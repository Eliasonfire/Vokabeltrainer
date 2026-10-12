/* eiche-ersatz-zuordner.mjs -- zeigt, dass die REGELN von ersatz-zuordnen.mjs und ersatz-bauen.mjs halten.
 *
 * Elias, 11.10.2026: die Ersatzdatenbank soll die Vokabeln „wo anders" finden — jede Angabe mit einer Quelle. Daraus
 * folgt das Versprechen, das hier bewacht wird: ein Platz wird nur dann von selbst „belegt", wenn eine Quelle das Wort
 * mit DENSELBEN Vokalzeichen führt, in passender Wortart, und ein deutsches Wort nennt, das sich mit dem Sinn der Karte
 * deckt. Alles andere bleibt offen, bis die Hand entscheidet — und eine Handangabe, die nicht zu den Quellen passt,
 * hält den Bau an.
 *
 * Gebaut wird in einem Wegwerfordner eine winzige Welt: ein Buch mit sechs Karten und ein Wörterbuch mit sechs
 * Einträgen, jede Karte eine Störung der Regel. Die echten Werkzeuge laufen darauf (über ERSATZ_REPO); die echte
 * data-ersatz/ und die echte data/ werden nicht angefasst. Die arabischen Wörter der Probe sind aus Codepunkten
 * zusammengesetzt und stammen aus keiner Datenbank.
 * Dazu kommen drei weitere kleine Welten: neun Karten zur Regel „wie die Karte“ (Abschnitt 5), drei Karten eines
 * Buches mit Schlüssel (Abschnitt 6: die Säuberung der Schlüsselzeilen und die Grenze der Regel am Schlüssel) und
 * elf Karten zur Wurzel aus Lanes Lexikon (Abschnitt 7: hier läuft zwischen zwei Bauten auch ersatz-lane.mjs
 * --wurzeln, auf abgelegten Seiten der Probe — geholt wird nie etwas; in Abschnitt 13 dazu ersatz-lane.mjs --seiten,
 * ebenfalls ohne Abruf).
 *
 * Aufruf:  node werkzeuge/eiche-ersatz-zuordner.mjs      Exit 0 = jede Regel hält, Exit 1 = mindestens eine nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { laneDateiname as laneDatei, wurzelSchluessel, wurzelWert } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const cp = (...n) => String.fromCodePoint(...n);
// Buchstaben und Zeichen als Codepunkte
const BA = 0x0628, YA = 0x064A, TA = 0x062A, KAF = 0x0643, ALIF = 0x0627, DAL = 0x062F, RA = 0x0631, SIN = 0x0633, QAF = 0x0642, MIM = 0x0645, NUN = 0x0646;
const FATHA = 0x064E, DAMMA = 0x064F, KASRA = 0x0650, SUKUN = 0x0652, DAMMATAN = 0x064C;
const W = {
  bayt: cp(BA, FATHA, YA, SUKUN, TA), baytNackt: cp(BA, YA, TA),                                 // „Haus": genau ein Eintrag, gleiche Zeichen
  kutub: cp(KAF, DAMMA, TA, DAMMA, BA), ktbNackt: cp(KAF, TA, BA),                               // Eintrag mit ANDEREN Vokalzeichen
  kitab: cp(KAF, KASRA, TA, FATHA, BA),                                                         // Karte: gleiche Buchstaben, andere Zeichen
  sakana: cp(SIN, FATHA, KAF, FATHA, NUN, FATHA), sknNackt: cp(SIN, KAF, NUN),                    // Karte Verb, Eintrag Nomen
  qamar: cp(QAF, FATHA, MIM, FATHA, RA),                                                        // steht in keinem Eintrag
  dars: cp(DAL, FATHA, RA, SUKUN, SIN), drsNackt: cp(DAL, RA, SIN),                              // zwei Einträge gleicher Schreibung
  bab: cp(BA, FATHA, ALIF, BA), babNackt: cp(BA, ALIF, BA),                                      // Eintrag da, aber sein Deutsch deckt sich nicht
};
const UN = cp(DAMMATAN);
const leer = { gender: null, sg: null, pl: null, femSg: null, femPl: null, root: null, past: null, present: null, imperative: null, masdar: null, note: null, book: 'madina-1' };
const KARTEN = [
  { id: '1', ar: W.bayt + UN, de: 'Haus', type: 'noun', chapter: 1, ...leer },
  { id: '2', ar: W.kitab + UN, de: 'Buch', type: 'noun', chapter: 1, ...leer },
  { id: '3', ar: W.qamar + UN, de: 'Mond', type: 'noun', chapter: 1, ...leer },
  { id: '4', ar: W.dars + UN, de: 'Unterricht', type: 'noun', chapter: 2, ...leer },
  { id: '5', ar: W.sakana, de: 'wohnen', type: 'verb', chapter: 2, ...leer, past: W.sakana },
  { id: '6', ar: W.bab + UN, de: 'Tür', type: 'noun', chapter: 2, ...leer },
];
const nomen = (w, kopf, sinn, n) => ({ w, pos: 'noun', n: n || null, kopf: [{ f: kopf, t: ['canonical', 'masculine'] }], hf: [], tab: [], sinn: [{ g: sinn }] });
const WOERTERBUCH = [
  nomen(W.baytNackt, W.bayt, 'house'),
  nomen(W.ktbNackt, W.kutub, 'book'),
  nomen(W.sknNackt, W.sakana, 'dwelling'),
  nomen(W.drsNackt, W.dars, 'lesson', '1'),
  nomen(W.drsNackt, W.dars, 'class', '2'),
  nomen(W.babNackt, W.bab, 'gate'),
];
// Mit Absicht deckt sich das Deutsch in den Störfällen 2, 4 und 5 mit der Karte: fiele dort die Regel (andere
// Vokalzeichen · zwei gleiche Einträge · andere Wortart), wäre der Platz sofort „belegt" — nur so kann die Probe rot werden.
const ENGLISCH_DEUTSCH = [
  ['house', 'Haus'], ['book', 'Buch'], ['dwelling', 'wohnen'], ['lesson', 'Unterricht'], ['class', 'Unterricht'], ['gate', 'Tor'],
].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] }));
const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];

function probe(hand = {}, welt = null) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'eiche-zuordner-'));
  const ziel = (welt && welt.buch) || 'madina-1';
  const auszuege = path.join(repo, 'data-ersatz', 'quellen', 'auszuege');
  for (const o of [path.join(repo, 'data'), auszuege, path.join(repo, 'data-ersatz', 'hand'), path.join(repo, 'data-ersatz', 'arbeit')]) fs.mkdirSync(o, { recursive: true });
  for (const buch of BUECHER) fs.writeFileSync(path.join(repo, 'data', 'vokabeln-' + buch + '.js'), `(window.VOKABELN = window.VOKABELN || {})[${JSON.stringify(buch)}] = ${JSON.stringify(buch === ziel ? (welt ? welt.karten : KARTEN) : [])};\n`);
  fs.writeFileSync(path.join(auszuege, 'enwikt-arabisch.jsonl'), (welt ? welt.woerterbuch : WOERTERBUCH).map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.writeFileSync(path.join(auszuege, 'enwikt-deutsch.jsonl'), (welt ? welt.englischDeutsch : ENGLISCH_DEUTSCH).map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.writeFileSync(path.join(repo, 'data-ersatz', 'hand', ziel + '.json'), JSON.stringify(hand));
  if (welt && welt.schluessel) fs.writeFileSync(path.join(auszuege, 'schluessel-' + ziel + '.jsonl'), welt.schluessel.map(e => JSON.stringify(e)).join('\n') + '\n');
  // Abschnitt 8: was ersatz-seiten.mjs aus den abgelegten Seiten des Wiktionary liest (Wurzelvorlagen und Kopfformen je Herkunftsabschnitt)
  if (welt && welt.wurzelSeiten) fs.writeFileSync(path.join(auszuege, 'enwikt-wurzeln.json'), JSON.stringify(welt.wurzelSeiten));
  // Abschnitt 9: die Übersetzungstabellen des englischen Wiktionary (am arabischen Wort steht dort oft das Geschlecht)
  if (welt && welt.tabellen) fs.writeFileSync(path.join(auszuege, 'enwikt-tabellen.jsonl'), welt.tabellen.map(e => JSON.stringify(e)).join('\n') + '\n');
  // Abschnitt 13: Buckwalters Stammliste (Zeilen „;--- Wurzel", „;; Lemma", dann „ohne Vokale<Tab>mit Vokalen<Tab>Kategorie<Tab>Bedeutung")
  if (welt && welt.bama) { fs.mkdirSync(path.join(repo, 'data-ersatz', 'quellen', 'bama'), { recursive: true }); fs.writeFileSync(path.join(repo, 'data-ersatz', 'quellen', 'bama', 'dictStems'), welt.bama.join('\n') + '\n', 'latin1'); }
  // Abschnitt 10: gebeugte Formen aus den vollständigen Tabellen der Quelle (ersatz-quellen.mjs zusatz), hier die Gegenwart eines Verbs
  if (welt && welt.zusatz) fs.writeFileSync(path.join(auszuege, 'enwikt-zusatzformen.jsonl'), welt.zusatz.map(e => JSON.stringify(e)).join('\n') + '\n');
  // Abschnitt 7: Einträge aus einem früheren Lauf von ersatz-lane.mjs --wurzeln, und abgelegte Wurzelseiten von Lanes
  // Lexikon (nur die Verweise auf die Stichwörter, wie die echte Seite sie trägt). Geholt wird in der Probe nie etwas.
  if (welt && welt.laneWurzeln) fs.writeFileSync(path.join(repo, 'data-ersatz', 'arbeit', 'lane-wurzeln.json'), JSON.stringify({ eintraege: welt.laneWurzeln }));
  if (welt && welt.laneSeiten) {
    const lane = path.join(repo, 'data-ersatz', 'quellen', 'lane');
    fs.mkdirSync(path.join(lane, 'seiten'), { recursive: true });
    for (const [bw, woerter] of Object.entries(welt.laneSeiten)) fs.writeFileSync(path.join(lane, 'seiten', laneDatei(bw)), '<html><body>\n' + woerter.map(([nr, wort]) => `<a href="/word/x/${nr}" class="root-word-link">${wort}</a>`).join('\n') + '\n</body></html>\n');
    fs.writeFileSync(path.join(lane, 'ohne-seite.json'), JSON.stringify(Object.fromEntries((welt.laneOhneSeite || []).map(k => [k, '2026-10-12']))));
  }
  const umgebung = { ...process.env, ERSATZ_REPO: repo };
  const bau = () => spawnSync(process.execPath, [path.join(HIER, 'ersatz-bauen.mjs'), '--knapp'], { encoding: 'utf8', env: umgebung });
  const z = spawnSync(process.execPath, [path.join(HIER, 'ersatz-zuordnen.mjs')], { encoding: 'utf8', env: umgebung });
  let b = z.status === 0 ? bau() : { status: null, stdout: '', stderr: '' };
  // die Reihenfolge des echten Laufs: Zuordner, Bau, Wurzeln bei Lane nachsehen, Bau noch einmal
  let l = { status: null, stdout: '', stderr: '' };
  if (welt && welt.laneSeiten && b.status === 0) {
    l = spawnSync(process.execPath, [path.join(HIER, 'ersatz-lane.mjs'), '--wurzeln', ...(welt.laneAlle ? ['--ids', welt.karten.map(k => k.id).join(',')] : [])], { encoding: 'utf8', env: umgebung });
    if (l.status === 0) b = bau();
  }
  // Abschnitt 13: der Lauf, der die fehlenden Wurzelseiten holen würde — hier OHNE --holen, er liest nur die Liste des Baus
  const sl = welt && welt.laneSeitenlauf && b.status === 0 ? spawnSync(process.execPath, [path.join(HIER, 'ersatz-lane.mjs'), '--seiten'], { encoding: 'utf8', env: umgebung }) : { status: null, stdout: '', stderr: '' };
  const lies = (name, sonst) => { const d = path.join(repo, 'data-ersatz', name); try { return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : sonst; } catch { return sonst; } };
  const kartenDatei = path.join(repo, 'data-ersatz', 'vokabeln-' + ziel + '.js');
  let karten = [];
  if (fs.existsSync(kartenDatei)) { const m = fs.readFileSync(kartenDatei, 'utf8').match(/=\s*(\[[\s\S]*\])\s*;?\s*$/); if (m) karten = JSON.parse(m[1]); }
  const aus = { codeZ: z.status, codeB: b.status, codeL: l.status, text: (z.stdout || '') + (z.stderr || '') + (l.stdout || '') + (l.stderr || '') + (b.stdout || '') + (b.stderr || ''), belege: lies('belege-' + ziel + '.json', {}), nichtGefunden: lies('nicht-gefunden.json', []), karten, lane: lies(path.join('arbeit', 'lane-wurzeln.json'), {}).eintraege || {},
    fehlend: lies(path.join('arbeit', 'lane-fehlende-seiten.json'), {}).schluessel || null, codeS: sl.status, seitenText: (sl.stdout || '') + (sl.stderr || '') };
  fs.rmSync(repo, { recursive: true, force: true });
  return aus;
}

const faelle = [];
const pruefe = (name, ok, was) => faelle.push({ name, ok: !!ok, was });
const st = (p, id) => (p.belege[id] || {}).status;

// 1. Grundlauf ohne Handangaben
const g = probe();
pruefe('beide Werkzeuge laufen durch', g.codeZ === 0 && g.codeB === 0, `Exit ${g.codeZ} / ${g.codeB}: ${g.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300)}`);
pruefe('ein Eintrag mit denselben Vokalzeichen, passender Wortart und passendem Deutsch → belegt', st(g, '1') === 'belegt', `Status ${st(g, '1')}, Grund ${(g.belege['1'] || {}).grund}`);
const k1 = g.karten.find(k => k.id === '1');
pruefe('die belegte Karte trägt das Deutsch der Quelle und eine Fundstelle je Angabe', k1 && k1.de === 'Haus' && k1.type === 'noun' && ['ar', 'de', 'type'].every(f => ((g.belege['1'].felder || {})[f] || {}).wo), JSON.stringify(k1 || null).slice(0, 200));
pruefe('die Fundstelle des Arabischen nennt die Quelle, nicht den Bestand', k1 && /wiktionary/.test(g.belege['1'].felder.ar.wo) && !/arabic\s?roots/i.test(JSON.stringify(g.belege['1'])), k1 ? g.belege['1'].felder.ar.wo : 'keine Karte');
pruefe('gleiche Buchstaben, andere Vokalzeichen → nicht belegt', st(g, '2') === 'offen', `Status ${st(g, '2')}`);
pruefe('kein Eintrag → nicht belegt', st(g, '3') === 'offen', `Status ${st(g, '3')}`);
pruefe('zwei Einträge gleicher Schreibung, beide mit dem Sinn der Karte → nicht von selbst belegt', st(g, '4') === 'offen', `Status ${st(g, '4')}`);
pruefe('gleiche Schreibung, aber andere Wortart → nicht von selbst belegt', st(g, '5') === 'offen', `Status ${st(g, '5')}`);
pruefe('Eintrag passt, aber sein Deutsch deckt sich nicht mit der Karte → nicht belegt, Grund nennt das Deutsch', st(g, '6') === 'offen' && /Deutsch fehlt/.test((g.belege['6'] || {}).grund || ''), `Status ${st(g, '6')}, Grund ${(g.belege['6'] || {}).grund}`);
pruefe('in der Ersatzdatei steht genau die eine belegte Karte', g.karten.length === 1 && g.karten[0].id === '1', `Karten: ${g.karten.map(k => k.id).join(',')}`);

// 2. „nicht gefunden" von Hand: steht mit Grund in der Liste, bekommt keine Karte
const n = probe({ 3: { status: 'nicht-gefunden', grund: 'Probe: in keiner Quelle' } });
pruefe('„nicht gefunden" von Hand → in der Liste mit Grund, ohne Karte', n.codeB === 0 && st(n, '3') === 'nicht-gefunden' && n.nichtGefunden.some(x => String(x.id) === '3' && x.grund) && !n.karten.some(k => k.id === '3'), `Exit ${n.codeB}, Status ${st(n, '3')}, Liste ${JSON.stringify(n.nichtGefunden).slice(0, 120)}`);

// 3. Deutsch von Hand, das keine Quelle nennt: der Bau hält an
const h = probe({ 6: { de: ['Quatsch'] } });
pruefe('Deutsch von Hand, das keine Quelle nennt → der Bau meldet es und endet mit Exit 1', h.codeB === 1 && /HAND:/.test(h.text), `Exit ${h.codeB}: ${h.text.trim().split('\n').slice(-3).join(' | ').slice(0, 300)}`);

// 4. Deutsch von Hand, das eine Quelle nennt (aber sich mit dem Wort der Karte nicht deckt): gilt, mit Fundstelle
const d = probe({ 6: { de: ['Tor'] } });
const k6 = d.karten.find(k => k.id === '6');
pruefe('Deutsch von Hand aus den Kandidaten der Quelle → belegt, mit Fundstelle', d.codeB === 0 && st(d, '6') === 'belegt' && k6 && k6.de === 'Tor' && ((d.belege['6'].felder || {}).de || {}).wo, `Exit ${d.codeB}, Status ${st(d, '6')}, Karte ${JSON.stringify(k6 || null).slice(0, 160)}`);

// 5. „Wie die Karte" (wieDieKarte in ersatz-bauen.mjs). Elias, 12.10.2026, als von 4414 belegten Karten 1601 im Deutschen
// wortgleich mit der bisherigen Karte waren: „das ist sehr wenig, guck mal nach damit wir mehr identische bekommen".
// Seitdem steht das Deutsch im WORTLAUT der bisherigen Karte, wenn die Quelle jedes ihrer Wörter nennt. Bewacht wird hier
// die Grenze der Regel (sie stammt von Claude): was nur in der FORM abweicht, gilt als dasselbe Wort — was im INHALT
// abweicht, nie. Jeder Wortlaut unten kann nur über die Regel entstehen: die Quelle der Probe schreibt ihn anders.
const HA = 0x0647, LAM = 0x0644, JIM = 0x062C, FA = 0x0641, HAA = 0x062D, WAW = 0x0648;
const V = {
  nahr: cp(NUN, FATHA, HA, SUKUN, RA), nahrNackt: cp(NUN, HA, RA),
  qalam: cp(QAF, FATHA, LAM, FATHA, MIM), qalamNackt: cp(QAF, LAM, MIM),
  najm: cp(NUN, FATHA, JIM, SUKUN, MIM), najmNackt: cp(NUN, JIM, MIM),
  jalasa: cp(JIM, FATHA, LAM, FATHA, SIN, FATHA), jalasaNackt: cp(JIM, LAM, SIN),
  fataha: cp(FA, FATHA, TA, FATHA, HAA, FATHA), fatahaNackt: cp(FA, TA, HAA),
  kawkab: cp(KAF, FATHA, WAW, SUKUN, KAF, FATHA, BA), kawkabNackt: cp(KAF, WAW, KAF, BA),
  sur: cp(SIN, DAMMA, WAW, RA), surNackt: cp(SIN, WAW, RA),
  jidar: cp(JIM, KASRA, DAL, FATHA, ALIF, RA), jidarNackt: cp(JIM, DAL, ALIF, RA),
};
const verb = (w, kopf, sinn) => ({ w, pos: 'verb', n: null, kopf: [{ f: kopf, t: ['canonical'] }], hf: [], tab: [], sinn: [{ g: sinn }] });
const WELT2 = {
  karten: [
    { id: '21', ar: V.nahr + UN, de: 'der Fluss', type: 'noun', chapter: 1, ...leer },                    // Artikel nur auf der Karte
    { id: '22', ar: V.qalam + UN, de: 'Stift / Feder', type: 'noun', chapter: 1, ...leer },               // ein Wort der Karte nennt die Quelle nicht
    { id: '23', ar: V.najm + UN, de: 'einen Stern', type: 'noun', chapter: 1, ...leer },                  // zwei VERSCHIEDENE Artikel
    { id: '24', ar: V.jalasa, de: 'sich setzen', type: 'verb', chapter: 1, ...leer, past: V.jalasa },     // „sich" ist Inhalt
    { id: '25', ar: V.fataha, de: 'etwas öffnen', type: 'verb', chapter: 1, ...leer, past: V.fataha },    // Platzhalter am Verb
    { id: '26', ar: V.kawkab + UN, de: 'Stern (Himmelskörper)', type: 'noun', chapter: 2, ...leer },      // Zusatz nur auf der KARTE
    { id: '27', ar: V.sur + UN, de: 'Mauer', type: 'noun', chapter: 2, ...leer },                         // Zusatz nur in der QUELLE
    { id: '28', ar: V.jidar + UN, de: 'Wand Mauer', type: 'noun', chapter: 2, ...leer },                  // der Karte fehlt das Trennzeichen
    { id: '29', ar: W.bab + UN, de: 'Tür', type: 'noun', chapter: 2, ...leer },                           // das Wort der Karte steht nur im Deutsch von Claude
  ],
  woerterbuch: [
    nomen(V.nahrNackt, V.nahr, 'river'), nomen(V.qalamNackt, V.qalam, 'pen'), nomen(V.najmNackt, V.najm, 'star'),
    verb(V.jalasaNackt, V.jalasa, 'to sit'), verb(V.fatahaNackt, V.fataha, 'to open'),
    nomen(V.kawkabNackt, V.kawkab, 'orb'), nomen(V.surNackt, V.sur, 'wall'), nomen(V.jidarNackt, V.jidar, 'partition'), nomen(W.babNackt, W.bab, 'gate'),
  ],
  englischDeutsch: [
    ['river', 'noun', 'Fluss'], ['pen', 'noun', 'Stift'], ['star', 'noun', 'ein Stern'], ['sit', 'verb', 'setzen'], ['open', 'verb', 'öffnen'],
    ['orb', 'noun', 'Stern'], ['wall', 'noun', 'Mauer (einer Stadt)'], ['partition', 'noun', 'Wand, Mauer'], ['gate', 'noun', 'Tor'],
  ].map(([w, pos, de]) => ({ w, pos, k: [{ sinn: 'Probe', de: [de] }] })),
};
const w1 = probe({ 28: { de: ['Wand, Mauer'] }, 29: { deEigen: 'Pforte, Tür' } }, WELT2);
const deVon = (p, id) => (p.karten.find(k => k.id === id) || {}).de;
const belegDe = (p, id) => ((p.belege[id] || {}).felder || {}).de || {};
pruefe('wie die Karte: die Probe läuft durch, alle neun Plätze sind belegt', w1.codeZ === 0 && w1.codeB === 0 && w1.karten.length === 9, 'Exit ' + w1.codeZ + ' / ' + w1.codeB + ', Karten ' + w1.karten.map(k => k.id).join(',') + ': ' + w1.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('wie die Karte: die Quelle nennt „Fluss", die Karte „der Fluss" → Wortlaut der Karte, und der Beleg sagt es', deVon(w1, '21') === 'der Fluss' && /Wortlaut wie die bisherige Karte/.test(belegDe(w1, '21').wo || ''), 'Karte 21: ' + deVon(w1, '21') + ' · Beleg: ' + String(belegDe(w1, '21').wo).slice(0, 160));
pruefe('wie die Karte: ein Wort der Karte nennt die Quelle nicht → nichts wird übernommen, auch nicht halb', deVon(w1, '22') === 'Stift', 'Karte 22: ' + deVon(w1, '22'));
pruefe('wie die Karte: zwei verschiedene Artikel („einen Stern" gegen „ein Stern") sind ein Unterschied → das Deutsch der Quelle bleibt', deVon(w1, '23') === 'ein Stern', 'Karte 23: ' + deVon(w1, '23'));
pruefe('wie die Karte: „sich" ist Inhalt („sich setzen" gegen „setzen") → das Deutsch der Quelle bleibt', deVon(w1, '24') === 'setzen', 'Karte 24: ' + deVon(w1, '24'));
pruefe('wie die Karte: der Platzhalter am Verb ist Form („etwas öffnen" gegen „öffnen") → Wortlaut der Karte', deVon(w1, '25') === 'etwas öffnen', 'Karte 25: ' + deVon(w1, '25'));
pruefe('wie die Karte: ein Zusatz in Klammern, den nur die KARTE führt, steht in keiner Quelle → er kommt nicht herein (Elias, 12.10.2026: „dann nicht übernehmen")', deVon(w1, '26') === 'Stern', 'Karte 26: ' + deVon(w1, '26'));
pruefe('wie die Karte: ein Zusatz in Klammern, den nur die QUELLE führt → Wortlaut der Karte', deVon(w1, '27') === 'Mauer', 'Karte 27: ' + deVon(w1, '27'));
pruefe('wie die Karte: dieselben Wörter, der Karte fehlt nur das Trennzeichen → Wortlaut der Karte', deVon(w1, '28') === 'Wand Mauer', 'Karte 28: ' + deVon(w1, '28'));
pruefe('wie die Karte: das Wort der Karte steht nur im Deutsch von Claude → Wortlaut der Karte, aber der Beleg bleibt „ohne deutsche Quelle"', deVon(w1, '29') === 'Tür' && belegDe(w1, '29').q === 'claude' && /ohne deutsche Quelle/.test(belegDe(w1, '29').wo || ''), 'Karte 29: ' + deVon(w1, '29') + ' · Sorte ' + belegDe(w1, '29').q + ' · ' + String(belegDe(w1, '29').wo).slice(0, 120));
// derselbe Platz, aber das Wort der Karte steht nur im ZUSATZ von Claude hinter einem belegten Wort: dann bekäme es die
// Fundstelle des belegten Worts — ein falscher Beleg (gesehen am 12.10.2026 an 46830). Es bleibt, wie es ist.
const w2 = probe({ 28: { de: ['Wand, Mauer'] }, 29: { de: ['Tor'], deZusatz: 'Pforte, Tür, Eingang' } }, WELT2);
pruefe('wie die Karte: steht das Wort der Karte nur im Zusatz von Claude in Klammern, wird es nicht mit fremder Fundstelle zur Karte', w2.codeB === 0 && deVon(w2, '29') === 'Tor (Pforte, Tür, Eingang)', 'Exit ' + w2.codeB + ', Karte 29: ' + deVon(w2, '29'));

// 6. Der Schlüssel zum Lehrbuch (Elias' eigenes Buch; nur für das Buch, zu dem er gehört). Drei Karten in „madina-3":
//    31  die Karte nennt „Schrift / Buch"; genau das nennt eine Zeile des Schlüssels — aber ihr Stichwort ist nur bis auf
//        die Schreibweise dasselbe (ohne das Fatha vor dem Alif) und sie steht in einer anderen Lektion. Eine solche Zeile
//        zählt für „wie die Karte" NICHT: am 12.10.2026 kam so bei 47793 das Deutsch eines Nachbarworts herein.
//    32  die Zeile führt „Pfad (fem. )": beim Auslesen des PDF ging das arabische Wort in der Klammer verloren
//    33  die Zeile führt „schreiben, (a-u)": nach dem Abziehen der Verbklasse bliebe ein Komma am Ende
const YAKTUBU = cp(YA, FATHA, KAF, SUKUN, TA, DAMMA, BA, DAMMA);
const S3 = { kitaab: cp(KAF, KASRA, TA, FATHA, ALIF, BA), kitaabKnapp: cp(KAF, KASRA, TA, ALIF, BA), kitaabNackt: cp(KAF, TA, ALIF, BA), darb: cp(DAL, FATHA, RA, SUKUN, BA), kataba: cp(KAF, FATHA, TA, FATHA, BA, FATHA) };
const leer3 = { ...leer, book: 'madina-3' };
const WELT3 = {
  buch: 'madina-3',
  karten: [
    { id: '31', ar: S3.kitaab + UN, de: 'Schrift / Buch', type: 'noun', chapter: 2, ...leer3 },
    { id: '32', ar: S3.darb + UN, de: 'Straße', type: 'noun', chapter: 1, ...leer3 },
    { id: '33', ar: S3.kataba, de: 'notieren', type: 'verb', chapter: 1, ...leer3, past: S3.kataba },
  ],
  woerterbuch: [nomen(S3.kitaabNackt, S3.kitaab, 'volume')],
  englischDeutsch: [{ w: 'volume', pos: 'noun', k: [{ sinn: 'Probe', de: ['Band'] }] }],
  schluessel: [
    { ar: S3.kitaabKnapp + UN, de: 'Schrift, Buch', lektion: 5, seite: 50, zeile: 1 },
    { ar: S3.darb + UN, de: 'Pfad (fem. )', lektion: 1, seite: 10, zeile: 1 },
    { ar: S3.kataba + ' ' + YAKTUBU, de: 'schreiben, (a-u)', lektion: 1, seite: 10, zeile: 2 },
  ],
};
const s3 = probe({ 31: { de: ['Band'] } }, WELT3);
pruefe('Schlüssel: die Probe läuft durch, alle drei Plätze sind belegt', s3.codeZ === 0 && s3.codeB === 0 && s3.karten.length === 3, 'Exit ' + s3.codeZ + ' / ' + s3.codeB + ', Karten ' + s3.karten.map(k => k.id).join(',') + ': ' + s3.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('wie die Karte: eine Schlüsselzeile, deren Stichwort nur bis auf die Schreibweise passt, macht nicht den Wortlaut der Karte', deVon(s3, '31') === 'Band', 'Karte 31: ' + deVon(s3, '31'));
pruefe('Schlüssel: die leere Klammer „(fem. )" aus dem Auslesen steht nicht auf der Karte', deVon(s3, '32') === 'Pfad', 'Karte 32: ' + deVon(s3, '32'));
pruefe('Schlüssel: nach der Verbklasse bleibt kein Komma am Zeilenende', deVon(s3, '33') === 'schreiben', 'Karte 33: ' + deVon(s3, '33'));

// 7. Die Wurzel aus Lanes Lexikon (ersatz-lane.mjs --wurzeln sieht nach, ersatz-bauen.mjs trägt ein). Anlass: der
// Probelauf des Wechsels zeigte am 12.10.2026, dass von den 331 Wörtern aus Elias' freigeschalteten Kapiteln nach einem
// Wechsel 58 unvollständig wären, 53 davon ohne Wurzel — und er will „nahtlos wechseln … ohne probleme" (11.10.2026).
// Die Bauart stammt von Claude. Bewacht wird ihr Versprechen: die Wurzel der bisherigen Karte ist nur der WEG zur Seite;
// auf die Ersatzkarte kommt eine Wurzel allein dann, wenn Lane das Wort mit denselben Vokalzeichen unter ihr führt —
// und nie über eine andere Quelle oder die Hand hinweg. Die Seiten der Probe tragen nur, was das Werkzeug an der
// echten Seite liest: die Verweise auf die Stichwörter.
const HAMZA_ALIF = 0x0623, YA_OHNE_PUNKTE = 0x0649, SHADDA = 0x0651;
const wz = (...n) => n.map(c => cp(c)).join(' ');
const L = {
  sarw: cp(SIN, FATHA, RA, SUKUN, WAW), sarwNackt: cp(SIN, RA, WAW),
  jadid: cp(JIM, FATHA, DAL, KASRA, YA, DAL), jadidNackt: cp(JIM, DAL, YA, DAL),
  anf: cp(HAMZA_ALIF, FATHA, NUN, SUKUN, FA), anfNackt: cp(HAMZA_ALIF, NUN, FA),
  fam: cp(FA, FATHA, MIM), famNackt: cp(FA, MIM),
  qulum: cp(QAF, DAMMA, LAM, DAMMA, MIM),
  kursi: cp(KAF, DAMMA, RA, SUKUN, SIN, KASRA, YA, SHADDA), kursiLane: cp(KAF, DAMMA, RA, SUKUN, SIN, KASRA, YA_OHNE_PUNKTE, SHADDA), kursiNackt: cp(KAF, RA, SIN, YA),
};
const WELT4 = {
  karten: [
    { id: '41', ar: W.bayt + UN, de: 'Haus', type: 'noun', chapter: 1, ...leer, root: wz(BA, YA, TA) },           // Lane führt das Wort unter der Wurzel
    { id: '42', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 1, ...leer, root: wz(QAF, LAM, MIM) },       // Lane führt dort nur ANDERE Vokalzeichen
    { id: '43', ar: V.nahr + UN, de: 'Fluss', type: 'noun', chapter: 1, ...leer, root: wz(NUN, HA, RA) },          // das Wörterbuch nennt selbst eine Wurzel
    { id: '44', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer, root: wz(NUN, JIM, MIM) },        // die Hand sagt „leer"
    { id: '45', ar: L.sarw + UN, de: 'Zypresse', type: 'noun', chapter: 2, ...leer, root: wz(SIN, RA, WAW) },      // steht bei Lane unter ZWEI Wurzeln
    { id: '46', ar: L.jadid + UN, de: 'Neuheit', type: 'noun', chapter: 2, ...leer, root: wz(JIM, DAL, DAL) },     // Seite aus zwei Buchstaben, Schlüssel verdoppelt
    { id: '47', ar: L.anf + UN, de: 'Nase', type: 'noun', chapter: 2, ...leer, root: wz(HAMZA_ALIF, NUN, FA) },    // Hamza am Anfang: die Seite steht unter bloßem Alif
    { id: '48', ar: V.sur + UN, de: 'Mauer', type: 'noun', chapter: 2, ...leer, root: wz(SIN, WAW, RA) },          // die Seite ist nicht abgelegt
    { id: '49', ar: L.fam + UN, de: 'Mund', type: 'noun', chapter: 2, ...leer, root: wz(FA, MIM) },                // Seite aus zwei Buchstaben, Schlüssel NICHT verdoppelt
    { id: '50', ar: L.kursi + UN, de: 'Stuhl', type: 'noun', chapter: 2, ...leer, root: wz(KAF, RA, SIN) },        // Lane druckt das Ya am Ende ohne Punkte
    { id: '51', ar: W.bab + UN, de: 'Tor', type: 'noun', chapter: 2, ...leer, root: wz(BA, WAW, BA) },             // Lane führt das Wort als WEITERES Stichwort eines Artikels (Kennung mit Unternummer)
  ],
  woerterbuch: [
    nomen(W.baytNackt, W.bayt, 'house'), nomen(V.qalamNackt, V.qalam, 'pen'), { ...nomen(V.nahrNackt, V.nahr, 'river'), wurzel: wz(NUN, HA, RA) },
    nomen(V.najmNackt, V.najm, 'star'), nomen(L.sarwNackt, L.sarw, 'cypress'), nomen(L.jadidNackt, L.jadid, 'novelty'), nomen(L.anfNackt, L.anf, 'nose'),
    nomen(V.surNackt, V.sur, 'wall'), nomen(L.famNackt, L.fam, 'mouth'), nomen(L.kursiNackt, L.kursi + UN, 'chair'), nomen(W.babNackt, W.bab, 'gate'),
  ],
  englischDeutsch: [['house', 'Haus'], ['pen', 'Stift'], ['river', 'Fluss'], ['star', 'Stern'], ['cypress', 'Zypresse'], ['novelty', 'Neuheit'], ['nose', 'Nase'], ['wall', 'Mauer'], ['mouth', 'Mund'], ['chair', 'Stuhl'], ['gate', 'Tor']]
    .map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
  laneSeiten: {
    byt: [['n101', W.bayt + UN]], qlm: [['n201', L.qulum + UN]], nhr: [['n251', V.nahr + UN]], njm: [['n301', V.najm + UN]],
    srw: [['n401', L.sarw + UN]], srY: [['n402', L.sarw + UN]], jd: [['n501', L.jadid + UN]], Anf: [['n601', L.anf + UN]],
    fm: [['n701', L.fam + UN]], krs: [['n801', L.kursiLane + UN]],
    // Zwei Stichwörter EINES Artikels: das erste trägt die Nummer, das zweite die Nummer mit Unternummer
    bwb: [['n901', W.bayt + UN], ['n901-2', W.bab + UN]],
  },
  laneOhneSeite: ['sry', 'jdd', '>nf', "'nf"],
};
const wurzelAuf = (p, id) => { const k = p.karten.find(x => x.id === id); return k ? k.root : undefined; };
const belegWurzel = (p, id) => ((p.belege[id] || {}).felder || {}).root || {};
const zeig = (p, id) => 'Karte ' + id + ': Wurzel ' + JSON.stringify(wurzelAuf(p, id)) + ' · Beleg ' + JSON.stringify(belegWurzel(p, id)).slice(0, 160) + ' · Eintrag ' + JSON.stringify(p.lane[id] || null).slice(0, 120);
const la = probe({ 44: { leer: ['root'] } }, WELT4);
pruefe('Lane: die Probe läuft durch (Zuordner, Bau, Nachsehen, Bau), alle elf Plätze sind belegt', la.codeZ === 0 && la.codeL === 0 && la.codeB === 0 && la.karten.length === 11, 'Exit ' + la.codeZ + ' / ' + la.codeL + ' / ' + la.codeB + ', Karten ' + la.karten.map(k => k.id).join(',') + ': ' + la.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Lane: führt Lane das Wort mit denselben Vokalzeichen unter der Wurzel, steht sie auf der Karte — im Beleg Lane und die Nummer des Stichworts', wurzelAuf(la, '41') === wz(BA, YA, TA) && belegWurzel(la, '41').q === 'lane' && /Lane/.test(belegWurzel(la, '41').wo || '') && /n101/.test(belegWurzel(la, '41').wo || ''), zeig(la, '41'));
pruefe('Lane: führt Lane unter der Wurzel nur ein Wort mit ANDEREN Vokalzeichen, bleibt die Wurzel leer', wurzelAuf(la, '42') === null && !la.lane['42'], zeig(la, '42'));
pruefe('Lane: nennt das Wörterbuch selbst eine Wurzel, bleibt die — bei Lane wird dafür nicht nachgesehen', wurzelAuf(la, '43') === wz(NUN, HA, RA) && belegWurzel(la, '43').q !== 'lane' && !la.lane['43'], zeig(la, '43'));
pruefe('Lane: „leer" von Hand nimmt auch die Wurzel aus Lane wieder heraus', !!la.lane['44'] && wurzelAuf(la, '44') === null, zeig(la, '44'));
pruefe('Lane: steht das Wort unter zwei Wurzeln, gilt keine', wurzelAuf(la, '45') === null && !la.lane['45'], zeig(la, '45'));
pruefe('Lane: eine Seite aus zwei Buchstaben wird zur Wurzel mit verdoppeltem Buchstaben, wenn es der Suchschlüssel auch war', wurzelAuf(la, '46') === wz(JIM, DAL, DAL), zeig(la, '46'));
pruefe('Lane: Hamza am Anfang — gefunden unter dem bloßen Alif, auf der Karte steht das Hamza auf dem Alif', wurzelAuf(la, '47') === wz(HAMZA_ALIF, NUN, FA), zeig(la, '47'));
pruefe('Lane: ist eine Seite der Suchschlüssel nicht bekannt, wird der Platz nicht entschieden', wurzelAuf(la, '48') === null && !la.lane['48'] && /nichtGeprueft/.test(la.text), zeig(la, '48') + ' · ' + (la.text.split('\n').find(z => z.startsWith('LANE')) || '').slice(0, 200));
pruefe('Lane: eine Seite aus zwei Buchstaben, deren Suchschlüssel nicht verdoppelt war, ist keine Wurzel', wurzelAuf(la, '49') === null && !la.lane['49'], zeig(la, '49'));
pruefe('Lane: das Ya am Wortende ohne Punkte (Lanes Druck) zählt wie das Ya der Karte', wurzelAuf(la, '50') === wz(KAF, RA, SIN), zeig(la, '50'));
// Gemessen am 12.10.2026: 562 der Stichwörter auf den abgelegten Seiten tragen eine Kennung mit Unternummer („n123-2",
// ein weiteres Stichwort desselben Artikels). Das Werkzeug las bis dahin nur „n123" und sah diese Wörter nicht.
pruefe('Lane: ein Stichwort mit Unternummer (ein weiteres Stichwort desselben Artikels) zählt wie jedes andere — im Beleg steht die ganze Kennung', wurzelAuf(la, '51') === wz(BA, WAW, BA) && belegWurzel(la, '51').q === 'lane' && /n901-2/.test(belegWurzel(la, '51').wo || ''), zeig(la, '51'));
// Einträge aus einem früheren Lauf, alle Plätze noch einmal nachgesehen (--ids). Ein Eintrag nennt das Arabisch der
// ERSATZkarte, wie sie beim Nachsehen dastand — hier aus dem Lauf davor genommen.
const arVon = id => (la.karten.find(k => k.id === id) || {}).ar;
const lb = probe({}, { ...WELT4, laneAlle: true, laneWurzeln: {
  42: { ar: arVon('42'), w: wz(QAF, LAM, MIM), wo: 'Probe: Eintrag aus einem früheren Lauf' },
  48: { ar: arVon('48'), w: wz(SIN, WAW, RA), wo: 'Probe: Eintrag aus einem früheren Lauf' },
} });
pruefe('Lane: ein früherer Eintrag, dessen Seite jetzt nicht bekannt ist, bleibt stehen und gilt weiter', lb.codeL === 0 && lb.codeB === 0 && !!lb.lane['48'] && wurzelAuf(lb, '48') === wz(SIN, WAW, RA), 'Exit ' + lb.codeL + ' / ' + lb.codeB + ' · ' + zeig(lb, '48'));
pruefe('Lane: ein früherer Eintrag fällt heraus, wenn die Seite das Wort nicht als Stichwort führt', !lb.lane['42'] && wurzelAuf(lb, '42') === null, zeig(lb, '42'));
// nur der Bau, ohne Nachsehen: was er mit Einträgen macht, die nicht passen
const { laneSeiten: _s, laneOhneSeite: _o, ...WELT4_OHNE_SEITEN } = WELT4;
const lc = probe({}, { ...WELT4_OHNE_SEITEN, laneWurzeln: {
  41: { ar: arVon('41'), w: wz(BA, YA, TA), wo: 'Probe: Lane, Stichwort n101' },
  43: { ar: arVon('43'), w: wz(NUN, HA, HA), wo: 'Probe: eine ANDERE Wurzel als die des Wörterbuchs' },
  46: { ar: W.bab + UN, w: wz(JIM, DAL, DAL), wo: 'Probe: der Eintrag gehört zu einem anderen Wort' },
} });
pruefe('Bau: ein Eintrag aus Lane füllt die Lücke und steht mit seiner Fundstelle im Beleg', lc.codeB === 0 && wurzelAuf(lc, '41') === wz(BA, YA, TA) && belegWurzel(lc, '41').q === 'lane', 'Exit ' + lc.codeB + ' · ' + zeig(lc, '41'));
pruefe('Bau: nennt das Wörterbuch eine Wurzel, überschreibt ein Eintrag aus Lane sie nicht', wurzelAuf(lc, '43') === wz(NUN, HA, RA) && belegWurzel(lc, '43').q !== 'lane', zeig(lc, '43'));
pruefe('Bau: ein Eintrag, dessen Arabisch nicht mehr das der Karte ist, wird übergangen — und der Bau sagt es', wurzelAuf(lc, '46') === null && /1 übergangen, weil das Arabisch/.test(lc.text), zeig(lc, '46') + ' · ' + (lc.text.split('\n').find(z => z.startsWith('Wurzeln aus Lanes')) || '').slice(0, 200));
// die drei Bausteine für sich
pruefe('Suchschlüssel: schwacher letzter Radikal → auch die Seite mit Waw und die mit Alif maqsura', ['bny', 'bnY', 'bnw'].every(k => wurzelSchluessel(wz(BA, NUN, YA)).includes(k)), wurzelSchluessel(wz(BA, NUN, YA)).join(' '));
pruefe('Suchschlüssel: Hamza am Anfang → auch das bloße Alif; verdoppelt → auch die zwei Buchstaben', wurzelSchluessel(wz(HAMZA_ALIF, NUN, FA)).includes('Anf') && wurzelSchluessel(wz(JIM, DAL, DAL)).includes('jd'), wurzelSchluessel(wz(HAMZA_ALIF, NUN, FA)).join(' ') + ' · ' + wurzelSchluessel(wz(JIM, DAL, DAL)).join(' '));
pruefe('Wert der Wurzel: Alif maqsura am Ende wird Ya, Alif am Anfang wird Hamza auf Alif', wurzelWert('bnY', '') === wz(BA, NUN, YA) && wurzelWert('Anf', '') === wz(HAMZA_ALIF, NUN, FA), JSON.stringify([wurzelWert('bnY', ''), wurzelWert('Anf', '')]));
pruefe('Wert der Wurzel: ein bloßes Alif in der Mitte ist kein Radikal, zwei Buchstaben sind keine Wurzel → kein Wert', wurzelWert('$Ay', '') === null && wurzelWert('mn', wz(MIM, NUN)) === null && wurzelWert('tlfzn', '') === null, JSON.stringify([wurzelWert('$Ay', ''), wurzelWert('mn', wz(MIM, NUN)), wurzelWert('tlfzn', '')]));
pruefe('Dateiname der abgelegten Seite: Groß und klein der Umschrift ergeben verschiedene Dateien, auch wo das Dateisystem sie nicht unterscheidet', laneDatei('Drb').toLowerCase() !== laneDatei('drb').toLowerCase() && laneDatei('bnY').toLowerCase() !== laneDatei('bny').toLowerCase(), laneDatei('Drb') + ' / ' + laneDatei('drb') + ' · ' + laneDatei('bnY') + ' / ' + laneDatei('bny'));

// 8. Die Wurzel aus dem Wiktionary: was als Wurzel des WORTS gilt. Zwei Regeln von Claude, beide nach einem Fehler:
//    · Am 12.10.2026 trug die Ersatzkarte „junger Mann" die Wurzel m-n-y. Die Seite nennt sie nur zum Vergleich im
//      Herkunftstext (Vorlage mit nocat=1), der Auszug führt sie trotzdem als Wurzel des Eintrags. Gemessen: 4 Karten.
//    · Trägt ein Eintrag keine Herkunftsnummer, die Seite aber mehrere Abschnitte, fand der Zuordner den Abschnitt nicht
//      und ließ die Wurzel weg, obwohl sie dasteht. Jetzt zählt der EINE Abschnitt, dessen Kopfvorlage das Wort nennt.
const seite = (titel, einheiten) => ({ titel, revid: 1, zeit: '2026-10-12T00:00:00Z', vorspann: [], einheiten });
const WELT5 = {
  karten: [
    { id: '61', ar: W.bayt + UN, de: 'Haus', type: 'noun', chapter: 1, ...leer },        // der Auszug nennt eine Wurzel, die Seite kennt sie nur als Erwähnung
    { id: '62', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 1, ...leer },       // die Seite nennt die Wurzel UND erwähnt eine fremde
    { id: '63', ar: W.dars + UN, de: 'Unterricht', type: 'noun', chapter: 1, ...leer },   // zwei Abschnitte, nur einer führt das Wort
    { id: '64', ar: W.bab + UN, de: 'Tor', type: 'noun', chapter: 1, ...leer },           // zwei Abschnitte, BEIDE führen das Wort
    { id: '65', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 2, ...leer },        // Mehrzahl nur in der Beugungstabelle
    { id: '66', ar: V.nahr + UN, de: 'Fluss', type: 'noun', chapter: 2, ...leer },        // Mehrzahl in der Kopfzeile UND eine andere in der Tabelle
    { id: '67', ar: V.sur + UN, de: 'Mauer', type: 'noun', chapter: 2, ...leer },         // Geschlecht nur in der Kopfvorlage der Seite
    { id: '68', ar: V.jidar + UN, de: 'Wand', type: 'noun', chapter: 2, ...leer },        // die Seite nennt an derselben Form BEIDE Geschlechter
  ],
  woerterbuch: [
    { ...nomen(W.baytNackt, W.bayt, 'house'), wurzel: wz(MIM, NUN, YA) }, nomen(V.qalamNackt, V.qalam, 'pen'),
    nomen(W.drsNackt, W.dars, 'lesson'), nomen(W.babNackt, W.bab, 'gate'),
    { ...nomen(V.najmNackt, V.najm, 'star'), hf: [{ f: cp(NUN, DAMMA, JIM, DAMMA, WAW, MIM), t: ['construct'] }], tab: [
      { f: V.najm + UN, t: ['indefinite', 'nominative', 'singular', 'triptote'] },
      { f: cp(NUN, FATHA, JIM, SUKUN, MIM, FATHA, ALIF, NUN, KASRA), t: ['dual', 'indefinite', 'nominative'] },
      { f: cp(NUN, DAMMA, JIM, DAMMA, WAW, MIM) + UN, t: ['indefinite', 'nominative', 'plural', 'triptote'] } ] },
    { ...nomen(V.nahrNackt, V.nahr, 'river'), hf: [{ f: cp(HAMZA_ALIF, FATHA, NUN, SUKUN, HA, FATHA, ALIF, RA), t: ['plural'] }], tab: [
      { f: V.nahr + UN, t: ['indefinite', 'nominative', 'singular', 'triptote'] },
      { f: cp(HAMZA_ALIF, FATHA, NUN, SUKUN, HA, DAMMA, RA) + UN, t: ['indefinite', 'nominative', 'plural', 'triptote'] } ] },
    { ...nomen(V.surNackt, V.sur, 'wall'), kopf: [{ f: V.sur, t: ['canonical'] }] },
    { ...nomen(V.jidarNackt, V.jidar, 'partition'), kopf: [{ f: V.jidar, t: ['canonical'] }] },
  ],
  englischDeutsch: [['house', 'Haus'], ['pen', 'Stift'], ['lesson', 'Unterricht'], ['gate', 'Tor'], ['star', 'Stern'], ['river', 'Fluss'], ['wall', 'Mauer'], ['partition', 'Wand']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
  wurzelSeiten: {
    [W.baytNackt]: seite(W.baytNackt, [{ nr: null, w: [{ art: 'ar-root', w: wz(MIM, NUN, YA), nocat: true }], koepfe: [W.bayt] }]),
    [V.qalamNackt]: seite(V.qalamNackt, [{ nr: null, w: [{ art: 'ar-root', w: wz(QAF, LAM, MIM) }, { art: 'ar-root', w: wz(MIM, NUN, YA), nocat: true }], koepfe: [V.qalam] }]),
    [W.drsNackt]: seite(W.drsNackt, [{ nr: 1, w: [{ art: 'ar-rootbox', w: wz(KAF, TA, BA) }], koepfe: [W.kutub] }, { nr: 2, w: [{ art: 'ar-rootbox', w: wz(DAL, RA, SIN) }], koepfe: [W.dars] }]),
    [W.babNackt]: seite(W.babNackt, [{ nr: 1, w: [{ art: 'ar-rootbox', w: wz(BA, YA, TA) }], koepfe: [W.bab] }, { nr: 2, w: [{ art: 'ar-rootbox', w: wz(KAF, TA, BA) }], koepfe: [W.bab] }]),
    [V.surNackt]: seite(V.surNackt, [{ nr: null, w: [], koepfe: [V.sur], geschlecht: [{ f: [V.sur], g: 'feminine' }] }]),
    [V.jidarNackt]: seite(V.jidarNackt, [{ nr: 1, w: [], koepfe: [V.jidar], geschlecht: [{ f: [V.jidar], g: 'feminine' }] }, { nr: 2, w: [], koepfe: [V.jidar], geschlecht: [{ f: [V.jidar], g: 'masculine' }] }]),
  },
};
const ws = probe({}, WELT5);
const mehrzahlAuf = (p, id) => { const k = p.karten.find(x => x.id === id); return k ? k.pl : undefined; };
pruefe('Wiktionary: nennt die Kopfzeile keine Mehrzahl, kommt sie aus der Beugungstabelle (Nominativ, unbestimmt) — die Zweizahl nicht', mehrzahlAuf(ws, '65') === cp(NUN, DAMMA, JIM, DAMMA, WAW, MIM) + UN && /Beugungstabelle: Mehrzahl/.test((((ws.belege['65'] || {}).felder || {}).pl || {}).wo || ''), 'Karte 65: Mehrzahl ' + JSON.stringify(mehrzahlAuf(ws, '65')) + ' · Beleg ' + JSON.stringify(((ws.belege['65'] || {}).felder || {}).pl || null).slice(0, 160));
pruefe('Wiktionary: nennt die Kopfzeile eine Mehrzahl, gilt die — nicht die andere aus der Tabelle', mehrzahlAuf(ws, '66') === cp(HAMZA_ALIF, FATHA, NUN, SUKUN, HA, FATHA, ALIF, RA), 'Karte 66: Mehrzahl ' + JSON.stringify(mehrzahlAuf(ws, '66')));
const geschlechtAuf = (p, id) => { const k = p.karten.find(x => x.id === id); return k ? k.gender : undefined; };
pruefe('Wiktionary: trägt der Auszug kein Geschlecht, gilt das der Kopfvorlage der Seite an genau dieser Form', geschlechtAuf(ws, '67') === 'feminine' && /Kopfvorlage der Seite/.test((((ws.belege['67'] || {}).felder || {}).gender || {}).wo || ''), 'Karte 67: Geschlecht ' + JSON.stringify(geschlechtAuf(ws, '67')) + ' · Beleg ' + JSON.stringify(((ws.belege['67'] || {}).felder || {}).gender || null).slice(0, 160));
pruefe('Wiktionary: nennt die Seite an derselben Form beide Geschlechter, bleibt es offen', geschlechtAuf(ws, '68') === null, 'Karte 68: Geschlecht ' + JSON.stringify(geschlechtAuf(ws, '68')));
pruefe('Wiktionary: die Probe läuft durch, alle acht Plätze sind belegt', ws.codeZ === 0 && ws.codeB === 0 && ws.karten.length === 8, 'Exit ' + ws.codeZ + ' / ' + ws.codeB + ', Karten ' + ws.karten.map(k => k.id).join(',') + ': ' + ws.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('Wiktionary: eine Wurzel, die die Seite nur zum Vergleich erwähnt (nocat), ist nicht die Wurzel des Worts — auch wenn der Auszug sie so führt', wurzelAuf(ws, '61') === null, zeig(ws, '61'));
pruefe('Wiktionary: nennt die Seite die Wurzel und erwähnt daneben eine fremde, gilt die genannte', wurzelAuf(ws, '62') === wz(QAF, LAM, MIM), zeig(ws, '62'));
pruefe('Wiktionary: Eintrag ohne Herkunftsnummer, Seite mit zwei Abschnitten — es gilt die Wurzel des Abschnitts, dessen Kopfvorlage das Wort nennt', wurzelAuf(ws, '63') === wz(DAL, RA, SIN), zeig(ws, '63'));
pruefe('Wiktionary: nennen zwei Abschnitte das Wort, bleibt die Wurzel offen', wurzelAuf(ws, '64') === null, zeig(ws, '64'));

// 9. Vier Angaben, die die Quelle nennt, die der Zuordner aber nicht mitnahm (alle von Claude, 12.10.2026, gemessen am
//    Probelauf des Wechsels: 12 von Elias' 331 Wörtern wären unvollständig gewesen):
//    · Geschlecht: die Übersetzungstabelle nennt es am arabischen Wort. Nur Tabellen eines Nomens, nur genau die Form
//      der Karte, nicht bei Mundart, nicht bei Widerspruch — und nie gegen das, was der Eintrag selbst sagt.
//    · Mehrzahl bei Sammelwörtern: die Quelle führt Sammelform und Mehrzahl der kleinen Zahl; das Einzelstück eines
//      Sammelworts ist keine weibliche Form.
//    · Mehrzahl aus der Kopfvorlage der abgelegten Seite (auch Vorlagen mit Pluszeichen), an genau dieser Kopfform.
//    · Wurzel über die Grundform (das Wort ohne Ta marbuta, mit denselben Vokalzeichen); Lane geht ihr im Bau vor.
const TA_M = 0x0629;
const X = {
  tamr: cp(TA, FATHA, MIM, SUKUN, RA), tamrNackt: cp(TA, MIM, RA),
  tamra: cp(TA, FATHA, MIM, SUKUN, RA, FATHA, TA_M), tamraNackt: cp(TA, MIM, RA, TA_M),
  tamarat: cp(TA, FATHA, MIM, FATHA, RA, FATHA, ALIF, TA),
  judur: cp(JIM, DAMMA, DAL, DAMMA, RA), kawakib: cp(KAF, FATHA, WAW, FATHA, ALIF, KAF, KASRA, BA), kawkub: cp(KAF, FATHA, WAW, SUKUN, KAF, DAMMA, BA),
  qalama: V.qalam + cp(FATHA, TA_M), kitaba: W.kitab + cp(FATHA, TA_M), nahra: V.nahr + cp(FATHA, TA_M),
};
const ohneG = (w, kopf, sinn) => ({ ...nomen(w, kopf, sinn), kopf: [{ f: kopf, t: ['canonical'] }] });
const tabelle = (w, pos, ar, de) => ({ w, pos, n: null, k: [{ sinn: 'Probe', ar, de: [{ w: de }] }] });
const WELT6 = {
  karten: [
    { id: '71', ar: V.nahr + UN, de: 'Fluss', type: 'noun', chapter: 1, ...leer },        // Tabelle eines Nomens nennt die Form mit einem Geschlecht
    { id: '72', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 1, ...leer },       // zwei Tabellen, zwei Geschlechter
    { id: '73', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer },        // nur die Tabelle eines Adjektivs und eine Mundartform
    { id: '74', ar: V.sur + UN, de: 'Mauer', type: 'noun', chapter: 1, ...leer },         // der Eintrag nennt selbst ein Geschlecht, die Tabelle ein anderes
    { id: '75', ar: X.tamra + UN, de: 'Dattel', type: 'noun', chapter: 2, ...leer },      // Einzelstück eines Sammelworts
    { id: '76', ar: X.tamr + UN, de: 'Datteln', type: 'noun', chapter: 2, ...leer },      // das Sammelwort selbst
    { id: '77', ar: V.jidar + UN, de: 'Wand', type: 'noun', chapter: 2, ...leer },        // Mehrzahl nur in der Kopfvorlage der Seite
    { id: '78', ar: V.kawkab + UN, de: 'Planet', type: 'noun', chapter: 2, ...leer },     // die Seite nennt die Mehrzahl an einer ANDEREN Kopfform
    { id: '79', ar: X.qalama + UN, de: 'Feder', type: 'noun', chapter: 3, ...leer },      // Grundform mit denselben Vokalzeichen, ihre Seite nennt die Wurzel
    { id: '80', ar: X.kitaba + UN, de: 'Schrift', type: 'noun', chapter: 3, ...leer },    // Grundform nur mit ANDEREN Vokalzeichen im Wörterbuch
    { id: '81', ar: X.nahra + UN, de: 'Bach', type: 'noun', chapter: 3, ...leer },        // Grundform nennt eine Wurzel — und Lane nennt eine fürs Wort selbst
    { id: '82', ar: W.bab + UN, de: 'Tor', type: 'noun', chapter: 3, ...leer },           // die Mehrzahl steht nur im ANDEREN Herkunftsabschnitt derselben Schreibung
  ],
  woerterbuch: [
    { ...ohneG(V.nahrNackt, V.nahr, 'river'), wurzel: wz(NUN, HA, RA) }, ohneG(V.qalamNackt, V.qalam, 'pen'), ohneG(V.najmNackt, V.najm, 'star'),
    { ...nomen(V.surNackt, V.sur, 'wall'), kopf: [{ f: V.sur, t: ['canonical', 'feminine'] }] },
    { ...nomen(X.tamraNackt, X.tamra, 'date fruit'), kopf: [{ f: X.tamra, t: ['canonical', 'feminine'] }], hf: [{ f: X.tamr, t: ['collective', 'masculine'] }], tab: [
      { f: X.tamra + UN, t: ['indefinite', 'nominative', 'singulative', 'triptote'] }, { f: X.tamr + UN, t: ['collective', 'indefinite', 'nominative', 'triptote'] }, { f: X.tamarat + UN, t: ['indefinite', 'nominative', 'paucal', 'triptote'] } ] },
    { ...nomen(X.tamrNackt, X.tamr, 'dates'), hf: [{ f: X.tamra, t: ['feminine', 'singulative'] }], tab: [
      { f: X.tamr + UN, t: ['collective', 'indefinite', 'nominative', 'triptote'] }, { f: X.tamra + UN, t: ['indefinite', 'nominative', 'singulative', 'triptote'] }, { f: X.tamarat + UN, t: ['indefinite', 'nominative', 'paucal', 'triptote'] } ] },
    nomen(V.jidarNackt, V.jidar, 'partition'), nomen(V.kawkabNackt, V.kawkab, 'planet'),
    { ...nomen(V.qalamNackt + cp(TA_M), X.qalama, 'quill'), kopf: [{ f: X.qalama, t: ['canonical', 'feminine'] }] },
    { ...nomen(W.ktbNackt + cp(TA_M), X.kitaba, 'script'), kopf: [{ f: X.kitaba, t: ['canonical', 'feminine'] }] },
    { ...nomen(W.ktbNackt, W.kutub, 'books'), wurzel: wz(KAF, TA, BA) },
    { ...nomen(V.nahrNackt + cp(TA_M), X.nahra, 'stream'), kopf: [{ f: X.nahra, t: ['canonical', 'feminine'] }] },
    nomen(W.babNackt, W.bab, 'gate', '2'),
  ],
  englischDeutsch: [['gate', 'Tor'], ['river', 'Fluss'], ['pen', 'Stift'], ['star', 'Stern'], ['wall', 'Mauer'], ['date fruit', 'Dattel'], ['dates', 'Datteln'], ['partition', 'Wand'], ['planet', 'Planet'], ['quill', 'Feder'], ['script', 'Schrift'], ['books', 'Bücher'], ['stream', 'Bach']]
    .map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
  tabellen: [
    tabelle('river', 'noun', [{ w: V.nahr, r: 'nahr', t: ['masculine'] }], 'Fluss'),
    tabelle('pen', 'noun', [{ w: V.qalam, r: 'qalam', t: ['masculine'] }], 'Stift'), tabelle('quill pen', 'noun', [{ w: V.qalam, r: 'qalam', t: ['feminine'] }], 'Stift'),
    tabelle('stellar', 'adj', [{ w: V.najm, r: 'najm', t: ['feminine'] }], 'Stern'), tabelle('star', 'noun', [{ w: V.najm, r: 'nagm', t: ['Egyptian-Arabic', 'masculine'] }], 'Stern'),
    tabelle('wall', 'noun', [{ w: V.sur, r: 'sur', t: ['masculine'] }], 'Mauer'),
  ],
  wurzelSeiten: {
    [V.qalamNackt]: seite(V.qalamNackt, [{ nr: null, w: [{ art: 'ar-rootbox', w: wz(QAF, LAM, MIM) }], koepfe: [V.qalam] }]),
    [V.jidarNackt]: seite(V.jidarNackt, [{ nr: null, w: [], koepfe: [V.jidar], mehrzahl: [{ f: [V.jidar], pl: [X.judur] }] }]),
    [V.kawkabNackt]: seite(V.kawkabNackt, [{ nr: null, w: [], koepfe: [X.kawkub], mehrzahl: [{ f: [X.kawkub], pl: [X.kawakib] }] }]),
    [W.babNackt]: seite(W.babNackt, [{ nr: 1, w: [], koepfe: [W.bab], mehrzahl: [{ f: [W.bab], pl: [cp(HAMZA_ALIF, FATHA, BA, SUKUN, WAW, FATHA, ALIF, BA)] }] }, { nr: 2, w: [], koepfe: [W.bab] }]),
  },
};
const wn = probe({}, WELT6);
const feldBeleg = (p, id, feld) => (((p.belege[id] || {}).felder || {})[feld] || {});
const weiblAuf = (p, id) => { const k = p.karten.find(x => x.id === id); return k ? k.femSg : undefined; };
pruefe('Kopfvorlage der Seite: nennt nur ein ANDERER Herkunftsabschnitt derselben Schreibung die Mehrzahl, bleibt sie offen', mehrzahlAuf(wn, '82') === null, 'Karte 82: ' + JSON.stringify(mehrzahlAuf(wn, '82')));
pruefe('Nebenangaben: die Probe läuft durch, alle zwölf Plätze sind belegt', wn.codeZ === 0 && wn.codeB === 0 && wn.karten.length === 12, 'Exit ' + wn.codeZ + ' / ' + wn.codeB + ', Karten ' + wn.karten.map(k => k.id).join(',') + ': ' + wn.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('Geschlecht: nennt die Tabelle eines Nomens genau diese Form mit einem Geschlecht, kommt es auf die Karte — mit der Tabelle als Fundstelle', geschlechtAuf(wn, '71') === 'masculine' && /Übersetzungen .*Geschlecht des arabischen Worts/.test(feldBeleg(wn, '71', 'gender').wo || '') && feldBeleg(wn, '71', 'gender').q === 'enwikt-tab', 'Karte 71: ' + JSON.stringify(geschlechtAuf(wn, '71')) + ' · ' + JSON.stringify(feldBeleg(wn, '71', 'gender')).slice(0, 200));
pruefe('Geschlecht: nennen zwei Tabellen verschiedene Geschlechter, bleibt es offen', geschlechtAuf(wn, '72') === null, 'Karte 72: ' + JSON.stringify(geschlechtAuf(wn, '72')));
pruefe('Geschlecht: die Tabelle eines Adjektivs und eine Form der Mundart zählen nicht', geschlechtAuf(wn, '73') === null, 'Karte 73: ' + JSON.stringify(geschlechtAuf(wn, '73')));
pruefe('Geschlecht: nennt der Eintrag selbst eines, überschreibt die Tabelle es nicht', geschlechtAuf(wn, '74') === 'feminine' && /Kopfzeile: Geschlecht/.test(feldBeleg(wn, '74', 'gender').wo || ''), 'Karte 74: ' + JSON.stringify(geschlechtAuf(wn, '74')) + ' · ' + JSON.stringify(feldBeleg(wn, '74', 'gender')).slice(0, 160));
pruefe('Sammelwort: das Einzelstück nennt Sammelform und Mehrzahl der kleinen Zahl', mehrzahlAuf(wn, '75') === X.tamr + UN + '|' + X.tamarat + UN && /Sammelform und Mehrzahl der kleinen Zahl/.test(feldBeleg(wn, '75', 'pl').wo || ''), 'Karte 75: ' + JSON.stringify(mehrzahlAuf(wn, '75')) + ' · ' + JSON.stringify(feldBeleg(wn, '75', 'pl')).slice(0, 160));
pruefe('Sammelwort: das Sammelwort selbst nennt die Mehrzahl der kleinen Zahl', mehrzahlAuf(wn, '76') === X.tamarat + UN && /Mehrzahl der kleinen Zahl \(die Quelle führt das Wort als Sammelwort\)/.test(feldBeleg(wn, '76', 'pl').wo || ''), 'Karte 76: ' + JSON.stringify(mehrzahlAuf(wn, '76')) + ' · ' + JSON.stringify(feldBeleg(wn, '76', 'pl')).slice(0, 160));
pruefe('Sammelwort: das Einzelstück steht nicht im Feld der weiblichen Form', weiblAuf(wn, '76') === null, 'Karte 76: femSg ' + JSON.stringify(weiblAuf(wn, '76')));
pruefe('Kopfvorlage der Seite: nennt sie an genau dieser Kopfform eine Mehrzahl, kommt die auf die Karte', mehrzahlAuf(wn, '77') === X.judur && /Kopfvorlage der Seite: Mehrzahl/.test(feldBeleg(wn, '77', 'pl').wo || ''), 'Karte 77: ' + JSON.stringify(mehrzahlAuf(wn, '77')) + ' · ' + JSON.stringify(feldBeleg(wn, '77', 'pl')).slice(0, 160));
pruefe('Kopfvorlage der Seite: nennt sie die Mehrzahl an einer anderen Kopfform, bleibt sie offen', mehrzahlAuf(wn, '78') === null, 'Karte 78: ' + JSON.stringify(mehrzahlAuf(wn, '78')));
pruefe('Grundform: führt das Wörterbuch das Wort ohne Ta marbuta mit denselben Vokalzeichen, gilt dessen Wurzel — und der Beleg sagt, dass es die Grundform ist', wurzelAuf(wn, '79') === wz(QAF, LAM, MIM) && /ist die Grundform/.test(belegWurzel(wn, '79').wo || '') && belegWurzel(wn, '79').q === 'enwikt-grundform', zeig(wn, '79'));
pruefe('Grundform: steht sie nur mit anderen Vokalzeichen im Wörterbuch, bleibt die Wurzel offen', wurzelAuf(wn, '80') === null, zeig(wn, '80'));
pruefe('Grundform: ohne Eintrag aus Lane gilt die Wurzel der Grundform', wurzelAuf(wn, '81') === wz(NUN, HA, RA), zeig(wn, '81'));
// Lane nennt das Wort selbst: sein Stichwort geht der Wurzel vor, die nur über die Grundform gefunden ist
const ar81 = (wn.karten.find(k => k.id === '81') || {}).ar;
const wl = probe({}, { ...WELT6, laneWurzeln: { 81: { ar: ar81, w: wz(NUN, HA, WAW), wo: 'Lane, Arabic-English Lexicon: Probe', bw: 'nhw', nr: 'n1', stichwort: 'x' } } });
pruefe('Grundform: nennt Lane das Wort selbst, geht sein Stichwort vor — und der Bau zählt es als eingetragen', wurzelAuf(wl, '81') === wz(NUN, HA, WAW) && belegWurzel(wl, '81').q === 'lane' && /1 eingetragen/.test(wl.text), zeig(wl, '81') + ' · ' + (wl.text.split('\n').find(z => z.startsWith('Wurzeln aus Lanes')) || '').slice(0, 160));
// ersatz-seiten.mjs selbst: liest es die Kopfvorlage mit Pluszeichen, ihr Geschlecht und ihre ausgeschriebene Mehrzahl?
{
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'eiche-seiten-'));
  fs.mkdirSync(path.join(repo, 'data-ersatz', 'quellen', 'enwikt-seiten'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'data-ersatz', 'quellen', 'auszuege'), { recursive: true });
  const blatt = (titel, text) => JSON.stringify({ gefragt: titel, titel, revid: 1, zeit: '2026-10-12T00:00:00Z', arabisch: text });
  fs.writeFileSync(path.join(repo, 'data-ersatz', 'quellen', 'enwikt-seiten', 'seiten.jsonl'), [
    blatt(V.jidarNackt, '===Noun===\n{{ar-noun+|' + V.jidar + '|f|pl=' + X.judur + '}}\n'),
    blatt(V.kawkabNackt, '===Noun===\n{{ar-noun|' + V.kawkab + '|m|pl=+}}\n'),
  ].join('\n') + '\n');
  const lauf = spawnSync(process.execPath, [path.join(HIER, 'ersatz-seiten.mjs'), 'wurzeln'], { encoding: 'utf8', env: { ...process.env, ERSATZ_REPO: repo } });
  let aus = {};
  try { aus = JSON.parse(fs.readFileSync(path.join(repo, 'data-ersatz', 'quellen', 'auszuege', 'enwikt-wurzeln.json'), 'utf8')); } catch { /* bleibt leer, die Fälle unten werden rot */ }
  const a = aus[V.jidarNackt] || {}, b = aus[V.kawkabNackt] || {};
  pruefe('Seiten: eine Kopfvorlage mit Pluszeichen wird gelesen — Form, Geschlecht und ausgeschriebene Mehrzahl', lauf.status === 0 && JSON.stringify(a.geschlecht) === JSON.stringify([{ f: [V.jidar], g: 'feminine' }]) && JSON.stringify(a.mehrzahl) === JSON.stringify([{ f: [V.jidar], pl: [X.judur] }]), 'Exit ' + lauf.status + ' · ' + JSON.stringify({ g: a.geschlecht, pl: a.mehrzahl }).slice(0, 200));
  pruefe('Seiten: „pl=+" ist keine ausgeschriebene Mehrzahl', JSON.stringify(b.mehrzahl) === '[]' && JSON.stringify(b.geschlecht) === JSON.stringify([{ f: [V.kawkab], g: 'masculine' }]), JSON.stringify({ g: b.geschlecht, pl: b.mehrzahl }).slice(0, 200));
  fs.rmSync(repo, { recursive: true, force: true });
}

// 10. Verbformen an einer Fügung mit Verb, und „das Wort selbst" (12.10.2026). Gemessen über alle Bücher mit der Pflicht
//     der App (vorrat.mjs: ein Verb braucht Vergangenheit, Gegenwart, Befehl, Verbalsubstantiv; ein Nomen die Einzahl):
//     73 Verben fehlte die Vergangenheit, 52 Nomen die Einzahl, 23 Fügungen „Verb + Verhältniswort" alle Formen.
//     · Fügung: ist ihr erstes Wort die Vergangenheit (die Form, unter der das Verb im Wörterbuch steht), bringt der
//       Eintrag des Verbs Formen und Wurzel mit — sie gelten dem Verb allein. Steht dort eine andere Form, nichts.
//     · Das Wort selbst (ersatz-bauen.mjs): nennt die bisherige Karte als Einzahl oder Vergangenheit ihr eigenes Wort,
//       steht im Feld das Arabisch der Ersatzkarte. Nennt sie dort ein anderes Wort, bleibt das Feld offen.
const FI = cp(FA, KASRA, YA), FI_NACKT = cp(FA, YA);
const YAJLISU = cp(YA, FATHA, JIM, SUKUN, LAM, KASRA, SIN, DAMMA), IJLIS = cp(ALIF, KASRA, JIM, SUKUN, LAM, KASRA, SIN, SUKUN), JULUS = cp(JIM, DAMMA, LAM, DAMMA, WAW, SIN);
const IFTAH = cp(ALIF, KASRA, FA, SUKUN, TA, FATHA, HAA, SUKUN);
const VERBTAFEL = [
  { f: V.jalasa, t: ['active', 'indicative', 'masculine', 'past', 'perfective', 'singular', 'third-person'] },
  { f: YAJLISU, t: ['active', 'indicative', 'masculine', 'non-past', 'imperfective', 'singular', 'third-person'] },
  { f: IJLIS, t: ['active', 'imperative', 'masculine', 'second-person', 'singular'] },
];
const WELT7 = {
  karten: [
    { id: '91', ar: V.jalasa + ' ' + FI, de: 'setzen in', type: 'verb', chapter: 1, ...leer, past: V.jalasa, present: YAJLISU },   // Verb in der Vergangenheit + Verhältniswort
    { id: '92', ar: YAJLISU + ' ' + FI, de: 'setzen in', type: 'verb', chapter: 1, ...leer },                                     // das erste Wort steht in der GEGENWART
    { id: '93', ar: V.fataha, de: 'öffnen', type: 'verb', chapter: 2, ...leer, past: V.fataha },                                  // Verb ohne Eintrag (von Hand belegt); die Karte nennt als Vergangenheit ihr eigenes Wort
    { id: '94', ar: IFTAH, de: 'öffne!', type: 'verb', chapter: 2, ...leer, past: V.fataha },                                     // die Karte führt eine Befehlsform; ihre Vergangenheit ist ein ANDERES Wort
    { id: '95', ar: W.qamar + UN, de: 'Mond', type: 'noun', chapter: 2, ...leer, sg: W.qamar + UN },                              // Nomen ohne Eintrag; die Karte nennt als Einzahl ihr eigenes Wort
    { id: '96', ar: W.kutub + UN, de: 'Bücher', type: 'noun', chapter: 2, ...leer, sg: W.kitab + UN },                            // die Karte führt eine Mehrzahl; ihre Einzahl ist ein ANDERES Wort
    { id: '97', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 2, ...leer, sg: V.najm + UN },                               // wie 95, aber die Hand nimmt das Feld mit „leer" heraus
    { id: '98', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 2, ...leer, sg: V.qalam + UN },                             // wie 95, aber die Ersatzkarte schreibt das Wort mit ANDEREN Vokalzeichen
  ],
  woerterbuch: [
    { ...verb(V.jalasaNackt, V.jalasa, 'to sit'), tab: VERBTAFEL, hf: [{ f: JULUS, t: ['noun-from-verb'] }], wurzel: wz(JIM, LAM, SIN) },
    { w: FI_NACKT, pos: 'prep', n: null, kopf: [{ f: FI, t: ['canonical'] }], hf: [], tab: [], sinn: [{ g: 'in' }] },
  ],
  englischDeutsch: [['sit', 'verb', 'setzen'], ['in', 'prep', 'in']].map(([w, pos, de]) => ({ w, pos, k: [{ sinn: 'Probe', de: [de] }] })),
  // die Gegenwart steht (wie im echten Auszug) nur in der vollständigen Tabelle des Verbs
  zusatz: [{ f: YAJLISU, t: VERBTAFEL[1].t, w: V.jalasaNackt, pos: 'verb', n: null, k: V.jalasa }],
};
const vonHand = (w, art, de) => ({ felder: { ar: { w, wo: 'Probe: Stammliste', q: 'bama' }, type: { w: art, wo: 'Probe: Stammliste', q: 'bama' } }, deEigen: de });
const wv = probe({
  91: { deTeile: { w: 'setzen in', teile: ['setzen', 'in'] } }, 92: { deTeile: { w: 'setzen in', teile: ['setzen', 'in'] } },
  93: vonHand(V.fataha, 'verb', 'öffnen'), 94: vonHand(IFTAH, 'verb', 'öffne!'),
  95: vonHand(W.qamar + UN, 'noun', 'Mond'), 96: vonHand(W.kutub + UN, 'noun', 'Bücher'), 97: { ...vonHand(V.najm + UN, 'noun', 'Stern'), leer: ['sg'] },
  98: vonHand(cp(QAF, KASRA, LAM, SUKUN, MIM) + UN, 'noun', 'Stift'),
}, WELT7);
const feldAuf = (p, id, feld) => { const k = p.karten.find(x => x.id === id); return k ? k[feld] : undefined; };
const formen = (p, id) => ['past', 'present', 'imperative', 'masdar', 'root'].map(f => JSON.stringify(feldAuf(p, id, f))).join(' · ');
pruefe('Das Wort selbst: schreibt die Ersatzkarte das Wort mit anderen Vokalzeichen als die bisherige, bleibt die Einzahl offen', feldAuf(wv, '98', 'sg') === null, 'Karte 98: ' + JSON.stringify(feldAuf(wv, '98', 'sg')));
pruefe('Verbformen: die Probe läuft durch, alle acht Plätze sind belegt', wv.codeZ === 0 && wv.codeB === 0 && wv.karten.length === 8, 'Exit ' + wv.codeZ + ' / ' + wv.codeB + ', Karten ' + wv.karten.map(k => k.id).join(',') + ': ' + wv.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Fügung mit Verb: steht ihr erstes Wort in der Vergangenheit, kommen Vergangenheit, Gegenwart, Befehl, Verbalsubstantiv und Wurzel aus dem Eintrag des Verbs — ohne das Verhältniswort', feldAuf(wv, '91', 'past') === V.jalasa && feldAuf(wv, '91', 'present') === YAJLISU && feldAuf(wv, '91', 'imperative') === IJLIS && feldAuf(wv, '91', 'masdar') === JULUS && feldAuf(wv, '91', 'root') === wz(JIM, LAM, SIN), 'Karte 91: ' + formen(wv, '91'));
pruefe('Fügung mit Verb: der Beleg sagt, dass die Angabe dem Verb der Fügung gilt', ['past', 'imperative', 'masdar', 'root'].every(f => /Verb der Fügung/.test(feldBeleg(wv, '91', f).wo || '')), 'Karte 91: ' + JSON.stringify(feldBeleg(wv, '91', 'imperative')).slice(0, 220));
pruefe('Fügung mit Verb: steht ihr erstes Wort in der Gegenwart, kommen keine Formen dazu', ['past', 'present', 'imperative', 'masdar'].every(f => feldAuf(wv, '92', f) === null), 'Karte 92: ' + formen(wv, '92'));
pruefe('Das Wort selbst: nennt die bisherige Karte als Vergangenheit ihr eigenes Wort, steht dort das Arabisch der Ersatzkarte — mit dessen Fundstelle', feldAuf(wv, '93', 'past') === V.fataha && /Stammliste — die Vergangenheit .* ist das Wort selbst/.test(feldBeleg(wv, '93', 'past').wo || '') && feldBeleg(wv, '93', 'past').q === 'bama', 'Karte 93: ' + JSON.stringify(feldAuf(wv, '93', 'past')) + ' · ' + JSON.stringify(feldBeleg(wv, '93', 'past')).slice(0, 200));
pruefe('Das Wort selbst: führt die Karte eine Befehlsform (ihre Vergangenheit ist ein anderes Wort), bleibt die Vergangenheit offen', feldAuf(wv, '94', 'past') === null, 'Karte 94: ' + JSON.stringify(feldAuf(wv, '94', 'past')));
pruefe('Das Wort selbst: nennt die bisherige Karte als Einzahl ihr eigenes Wort, steht dort das Arabisch der Ersatzkarte', feldAuf(wv, '95', 'sg') === W.qamar + UN && /die Einzahl ist das Wort selbst/.test(feldBeleg(wv, '95', 'sg').wo || ''), 'Karte 95: ' + JSON.stringify(feldAuf(wv, '95', 'sg')) + ' · ' + JSON.stringify(feldBeleg(wv, '95', 'sg')).slice(0, 200));
pruefe('Das Wort selbst: führt die Karte eine Mehrzahl (ihre Einzahl ist ein anderes Wort), bleibt die Einzahl offen', feldAuf(wv, '96', 'sg') === null, 'Karte 96: ' + JSON.stringify(feldAuf(wv, '96', 'sg')));
pruefe('Das Wort selbst: „leer" von Hand nimmt das Feld wieder heraus', feldAuf(wv, '97', 'sg') === null, 'Karte 97: ' + JSON.stringify(feldAuf(wv, '97', 'sg')));
pruefe('Das Wort selbst: der Bau nennt die Zahl der gesetzten Felder', /Das Wort selbst: Einzahl an 1 Nomen und Vergangenheit an 1 Verben gesetzt/.test(wv.text), (wv.text.split('\n').find(z => z.startsWith('Das Wort selbst')) || 'keine Zeile').slice(0, 200));

// 11. Gleich geschriebene Verben (12.10.2026): führt das Wörterbuch zwei Verben in derselben Schreibung, wählt der
//     Zuordner keinen Eintrag — Wort und Deutsch kommen dann aus einer Übersetzungstabelle (wie hier), dem Schlüssel
//     oder von arabdict, aber ohne Formen. Erkannt wird das Verb an seiner Gegenwartsform (verbUnterGleichen):
//     101  drei Einträge, zwei davon mit der Gegenwart der bisherigen Karte (bei nur EINEM solchen wählt schon stufeFuer
//          den Eintrag) → die Formen dieser zwei, die Wurzel von dem, der sie nennt
//     102  zwei Einträge, keine Stelle nennt eine Gegenwart → nichts
//     103  zwei Einträge mit GLEICHER Gegenwart, aber verschiedenem Verbalsubstantiv → der Befehl kommt, das Verbalsubstantiv nicht
//     104  wie 103, aber die bisherige Karte nennt ein Verbalsubstantiv → es gilt der Eintrag, der es führt
const NONPAST = VERBTAFEL[1].t, BEFEHL = VERBTAFEL[2].t, VERGANGEN = VERBTAFEL[0].t;
const G = {
  uktub: cp(ALIF, DAMMA, KAF, SUKUN, TA, DAMMA, BA, SUKUN), katb: cp(KAF, FATHA, TA, SUKUN, BA),
  yaktibu: cp(YA, FATHA, KAF, SUKUN, TA, KASRA, BA, DAMMA), iktib: cp(ALIF, KASRA, KAF, SUKUN, TA, KASRA, BA, SUKUN), kitba: cp(KAF, KASRA, TA, SUKUN, BA, FATHA, TA_M),
  yajlusu: cp(YA, FATHA, JIM, SUKUN, LAM, DAMMA, SIN, DAMMA), ujlus: cp(ALIF, DAMMA, JIM, SUKUN, LAM, DAMMA, SIN, SUKUN),
  yaftahu: cp(YA, FATHA, FA, SUKUN, TA, FATHA, HAA, DAMMA), fath: cp(FA, FATHA, TA, SUKUN, HAA), futuh: cp(FA, DAMMA, TA, DAMMA, WAW, HAA),
  yaskunu: cp(YA, FATHA, SIN, SUKUN, KAF, DAMMA, NUN, DAMMA), uskun: cp(ALIF, DAMMA, SIN, SUKUN, KAF, DAMMA, NUN, SUKUN), sakan: cp(SIN, FATHA, KAF, FATHA, NUN), sukun: cp(SIN, DAMMA, KAF, DAMMA, WAW, NUN),
};
const verbMit = (nacktW, kopf, sinn, n, geg, bef, mas, wurzel) => ({ ...verb(nacktW, kopf, sinn), n, tab: [{ f: kopf, t: VERGANGEN }, { f: geg, t: NONPAST }, { f: bef, t: BEFEHL }], hf: [{ f: mas, t: ['noun-from-verb'] }], ...(wurzel ? { wurzel } : {}) });
const WELT8 = {
  karten: [
    { id: '101', ar: S3.kataba, de: 'schreiben', type: 'verb', chapter: 1, ...leer, past: S3.kataba, present: YAKTUBU },
    { id: '102', ar: V.jalasa, de: 'setzen', type: 'verb', chapter: 1, ...leer, past: V.jalasa },
    { id: '103', ar: V.fataha, de: 'öffnen', type: 'verb', chapter: 1, ...leer, past: V.fataha, present: G.yaftahu },
    { id: '104', ar: W.sakana, de: 'wohnen', type: 'verb', chapter: 1, ...leer, past: W.sakana, present: G.yaskunu, masdar: G.sukun },
  ],
  woerterbuch: [
    verbMit(W.ktbNackt, S3.kataba, 'to write', '1', YAKTUBU, G.uktub, G.katb, wz(KAF, TA, BA)), verbMit(W.ktbNackt, S3.kataba, 'to write', '2', G.yaktibu, G.iktib, G.kitba, wz(KAF, TA, BA)),
    verbMit(W.ktbNackt, S3.kataba, 'to write', '3', YAKTUBU, G.uktub, G.katb),
    verbMit(V.jalasaNackt, V.jalasa, 'to sit', '1', YAJLISU, IJLIS, JULUS), verbMit(V.jalasaNackt, V.jalasa, 'to sit', '2', G.yajlusu, G.ujlus, JULUS),
    verbMit(V.fatahaNackt, V.fataha, 'to open', '1', G.yaftahu, IFTAH, G.fath), verbMit(V.fatahaNackt, V.fataha, 'to open', '2', G.yaftahu, IFTAH, G.futuh),
    verbMit(W.sknNackt, W.sakana, 'to dwell', '1', G.yaskunu, G.uskun, G.sakan), verbMit(W.sknNackt, W.sakana, 'to dwell', '2', G.yaskunu, G.uskun, G.sukun),
  ],
  englischDeutsch: [['write', 'verb', 'schreiben'], ['sit', 'verb', 'setzen'], ['open', 'verb', 'öffnen'], ['dwell', 'verb', 'wohnen']].map(([w, pos, de]) => ({ w, pos, k: [{ sinn: 'Probe', de: [de] }] })),
  tabellen: [
    tabelle('write', 'verb', [{ w: S3.kataba, r: 'kataba', t: [] }], 'schreiben'), tabelle('sit', 'verb', [{ w: V.jalasa, r: 'jalasa', t: [] }], 'setzen'),
    tabelle('open', 'verb', [{ w: V.fataha, r: 'fataha', t: [] }], 'öffnen'), tabelle('dwell', 'verb', [{ w: W.sakana, r: 'sakana', t: [] }], 'wohnen'),
  ],
};
const wg = probe({}, WELT8);
pruefe('Gleiche Verben: die Probe läuft durch, alle vier Plätze sind belegt (Wort und Deutsch aus der Übersetzungstabelle)', wg.codeZ === 0 && wg.codeB === 0 && wg.karten.length === 4, 'Exit ' + wg.codeZ + ' / ' + wg.codeB + ', Karten ' + wg.karten.map(k => k.id).join(',') + ': ' + wg.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Gleiche Verben: nennt die bisherige Karte die Gegenwart, wird das Verb unter drei gleich geschriebenen an der Gegenwartsform erkannt — Gegenwart, Befehl, Verbalsubstantiv und Wurzel kommen von den Einträgen mit dieser Gegenwart', feldAuf(wg, '101', 'present') === YAKTUBU && feldAuf(wg, '101', 'imperative') === G.uktub && feldAuf(wg, '101', 'masdar') === G.katb && feldAuf(wg, '101', 'root') === wz(KAF, TA, BA) && /unter 3 gleich geschriebenen Verben des Wörterbuchs an der Gegenwartsform erkannt \(2 Einträge nennen dasselbe\)/.test(feldBeleg(wg, '101', 'imperative').wo || ''), 'Karte 101: ' + formen(wg, '101') + ' · ' + JSON.stringify(feldBeleg(wg, '101', 'imperative')).slice(0, 220));
pruefe('Gleiche Verben: nennt keine Stelle die Gegenwart, bleibt alles offen', ['present', 'imperative', 'masdar'].every(f => feldAuf(wg, '102', f) === null), 'Karte 102: ' + formen(wg, '102'));
pruefe('Gleiche Verben: nennen die passenden Einträge verschiedene Verbalsubstantive, bleibt das offen — der gleich genannte Befehl kommt', feldAuf(wg, '103', 'imperative') === IFTAH && feldAuf(wg, '103', 'masdar') === null && /2 Einträge nennen dasselbe/.test(feldBeleg(wg, '103', 'imperative').wo || ''), 'Karte 103: ' + formen(wg, '103') + ' · ' + JSON.stringify(feldBeleg(wg, '103', 'imperative')).slice(0, 220));
pruefe('Gleiche Verben: nennt die bisherige Karte ein Verbalsubstantiv, gilt der Eintrag, der es führt', feldAuf(wg, '104', 'masdar') === G.sukun && feldAuf(wg, '104', 'imperative') === G.uskun, 'Karte 104: ' + formen(wg, '104'));

// 12. Kopfzeile mit BEIDEN Geschlechtern („m oder f", 12.10.2026): die Karte hat nur ein Feld — dort steht das der
//     bisherigen Karte (als Schlüssel unter den zwei Angaben der Quelle), ohne ihre Angabe das männliche, und der
//     Beleg sagt, dass die Quelle beide nennt. Eine klare Kopfzeile überstimmt die bisherige Karte weiterhin.
const beideG = (w, kopf, sinn) => ({ ...nomen(w, kopf, sinn), kopf: [{ f: kopf, t: ['canonical', 'feminine', 'masculine'] }] });
const WELT9 = {
  karten: [
    { id: '111', ar: V.nahr + UN, de: 'Fluss', type: 'noun', chapter: 1, ...leer, gender: 'feminine' },    // Quelle: beide; bisherige Karte: weiblich
    { id: '112', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 1, ...leer },                       // Quelle: beide; bisherige Karte nennt keines
    { id: '113', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer, gender: 'masculine' },   // Quelle: nur weiblich; bisherige Karte: männlich
  ],
  woerterbuch: [beideG(V.nahrNackt, V.nahr, 'river'), beideG(V.qalamNackt, V.qalam, 'pen'), { ...nomen(V.najmNackt, V.najm, 'star'), kopf: [{ f: V.najm, t: ['canonical', 'feminine'] }] }],
  englischDeutsch: [['river', 'Fluss'], ['pen', 'Stift'], ['star', 'Stern']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
};
const wb = probe({}, WELT9);
pruefe('Beide Geschlechter: die Probe läuft durch, alle drei Plätze sind belegt', wb.codeZ === 0 && wb.codeB === 0 && wb.karten.length === 3, 'Exit ' + wb.codeZ + ' / ' + wb.codeB + ', Karten ' + wb.karten.map(k => k.id).join(',') + ': ' + wb.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('Beide Geschlechter: nennt die Kopfzeile beide Geschlechter, steht das der bisherigen Karte da — und der Beleg sagt, dass die Quelle beide nennt', geschlechtAuf(wb, '111') === 'feminine' && /die Quelle nennt beide Geschlechter .*das der bisherigen Karte/.test(feldBeleg(wb, '111', 'gender').wo || ''), 'Karte 111: ' + JSON.stringify(geschlechtAuf(wb, '111')) + ' · ' + JSON.stringify(feldBeleg(wb, '111', 'gender')).slice(0, 220));
pruefe('Beide Geschlechter: nennt die bisherige Karte keines, steht das männliche da — mit dem Hinweis im Beleg', geschlechtAuf(wb, '112') === 'masculine' && /die Quelle nennt beide Geschlechter .*das männliche/.test(feldBeleg(wb, '112', 'gender').wo || ''), 'Karte 112: ' + JSON.stringify(geschlechtAuf(wb, '112')) + ' · ' + JSON.stringify(feldBeleg(wb, '112', 'gender')).slice(0, 220));
pruefe('Beide Geschlechter: eine klare Kopfzeile gilt weiter gegen die bisherige Karte', geschlechtAuf(wb, '113') === 'feminine' && /Kopfzeile: Geschlecht$/.test(feldBeleg(wb, '113', 'gender').wo || ''), 'Karte 113: ' + JSON.stringify(geschlechtAuf(wb, '113')) + ' · ' + JSON.stringify(feldBeleg(wb, '113', 'gender')).slice(0, 220));

// 13. Wurzel aus Buckwalters Stammliste (12.10.2026, ersatz-bauen.mjs): nur unter drei Bedingungen, nur als Lücke.
//     121  Lemma unter einer Wurzelzeile, deren Radikale im Wort stehen, und Lane führt die Seite der Wurzel → Wurzel
//     122  wie 121, aber Lane führt keine Seite dieser Wurzel → nichts
//     123  das Lemma hängt unter einer FREMDEN Wurzelzeile (ihre Radikale stehen nicht im Wort) → nichts
//     124  zweilautige Zeile, das Wort führt den zweiten Radikal nicht doppelt → nichts
//     125  zweilautige Zeile, das Wort führt den zweiten Radikal mit Schadda → verdoppelte Wurzel
//     Seit dem Abend des 12.10.2026 (f2) dazu, was „Lane führt die Wurzel" heißt und wann entschieden wird:
//     131  Lanes Seite nennt nur die blanke Wurzel als Verweis (kein Stichwort mit Vokalzeichen) → nichts
//     132  schwacher Radikal: die eine Schreibung ist nur so ein Verweis, die andere führt Stichwörter → die andere gilt
//     133  nach der Seite wurde noch NIE gefragt → offen, und ihr Schlüssel steht auf der Liste der fehlenden Seiten
//     134  schwacher Radikal: Lane führt die ANDERE Schreibung, nach der eigenen wurde nie gefragt → offen, auf der Liste nur die eigene
//     135  die Quelle der Karte führt das Wort als NAMEN (Wortart „name") → nichts, auch wenn Stammliste und Lane eine Wurzel hergäben
//     136  das einzige passende Lemma der Stammliste ist ein Funktionswort (Kategorie „FW…") → nichts
//     137  neben dem Funktionswort steht ein Nomen gleicher Schreibung unter derselben Zeile → dessen Wurzel, im Beleg das Nomen
//     Eine Seite, die Lane „führt", trägt in der Probe ein Stichwort mit Vokalzeichen (ein ANDERES Wort als die Karte).
//     Beim schwachen letzten Radikal gilt seit demselben Abend: der Wert ist die Zeile der Stammliste, wenn Lane GENAU
//     diese Schreibung führt (127: auch neben der anderen); führt Lane nur die andere, gilt keine (128).
const SIRR = cp(SIN, KASRA, RA, SHADDA), NAJW = cp(NUN, FATHA, JIM, SUKUN, WAW), DALW = cp(DAL, FATHA, LAM, SUKUN, WAW), BANIN = cp(BA, FATHA, ALIF, NUN, 0x064D);
const SAHW = cp(SIN, FATHA, HA, SUKUN, WAW), BADW = cp(BA, FATHA, DAL, SUKUN, WAW);
const FAWQ = cp(FA, FATHA, WAW, SUKUN, QAF), TAHT = cp(TA, FATHA, HAA, SUKUN, TA);
const FUEHRT = [['n1', W.bayt + UN]];
const WELT10 = {
  karten: [
    { id: '121', ar: W.dars + UN, de: 'Unterricht', type: 'noun', chapter: 1, ...leer },
    { id: '122', ar: V.qalam + UN, de: 'Stift', type: 'noun', chapter: 1, ...leer },
    { id: '123', ar: V.najm + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer },
    { id: '124', ar: V.nahr + UN, de: 'Fluss', type: 'noun', chapter: 1, ...leer },
    { id: '125', ar: SIRR + UN, de: 'Geheimnis', type: 'noun', chapter: 1, ...leer },
    { id: '126', ar: W.qamar + UN, de: 'Mond', type: 'noun', chapter: 2, ...leer },        // die Stammliste führt das Lemma als EIGENNAMEN
    { id: '127', ar: NAJW + UN, de: 'Flüstern', type: 'noun', chapter: 2, ...leer },       // schwacher Radikal; Lane führt die Wurzel unter BEIDEN Schreibungen
    { id: '128', ar: DALW + UN, de: 'Eimer', type: 'noun', chapter: 2, ...leer },          // schwacher Radikal; Lane führt nur die ANDERE Schreibung
    { id: '129', ar: BANIN, de: 'Erbauer', type: 'noun', chapter: 2, ...leer },            // Wort auf Kasratan; ohne die Endung gliche es einem anderen Lemma
    { id: '130', ar: V.kawkab + UN, de: 'Planet', type: 'noun', chapter: 2, ...leer },     // Eigenname, den die Stammliste als gewöhnliches Nomen führt (Bedeutung groß geschrieben)
    { id: '131', ar: V.sur + UN, de: 'Mauer', type: 'noun', chapter: 3, ...leer },         // Lanes Seite ist nur ein Verweis auf die andere Schreibung
    { id: '132', ar: SAHW + UN, de: 'Versehen', type: 'noun', chapter: 3, ...leer },       // schwacher Radikal; eine Schreibung nur Verweis, die andere führt Stichwörter
    { id: '133', ar: V.jidar + UN, de: 'Wand', type: 'noun', chapter: 3, ...leer },        // nach Lanes Seite wurde noch nie gefragt
    { id: '134', ar: BADW + UN, de: 'Wüste', type: 'noun', chapter: 3, ...leer },          // schwacher Radikal; Lane führt die andere Schreibung, nach der eigenen wurde nie gefragt
    { id: '135', ar: W.kitab + UN, de: 'Buchstadt', type: 'noun', chapter: 3, ...leer },   // die Quelle führt das Wort als Namen
    { id: '136', ar: FAWQ + UN, de: 'Oberseite', type: 'noun', chapter: 3, ...leer },      // in der Stammliste nur ein Funktionswort
    { id: '137', ar: TAHT + UN, de: 'Unterseite', type: 'noun', chapter: 3, ...leer },     // in der Stammliste Funktionswort UND Nomen unter derselben Zeile
  ],
  woerterbuch: [nomen(W.drsNackt, W.dars, 'lesson'), nomen(V.qalamNackt, V.qalam, 'pen'), nomen(V.najmNackt, V.najm, 'star'), nomen(V.nahrNackt, V.nahr, 'river'), nomen(cp(SIN, RA), SIRR, 'secret'),
    nomen(cp(QAF, MIM, RA), W.qamar, 'moon'), nomen(cp(NUN, JIM, WAW), NAJW, 'whisper'), nomen(cp(DAL, LAM, WAW), DALW, 'bucket'), nomen(cp(BA, ALIF, NUN), BANIN, 'builder'), nomen(V.kawkabNackt, V.kawkab, 'planet'),
    nomen(V.surNackt, V.sur, 'wall'), nomen(cp(SIN, HA, WAW), SAHW, 'oversight'), nomen(V.jidarNackt, V.jidar, 'partition'), nomen(cp(BA, DAL, WAW), BADW, 'desert'),
    { ...nomen(W.ktbNackt, W.kitab, 'Booktown'), pos: 'name' }, nomen(cp(FA, WAW, QAF), FAWQ, 'top'), nomen(cp(TA, HAA, TA), TAHT, 'bottom')],
  englischDeutsch: [['lesson', 'Unterricht'], ['pen', 'Stift'], ['star', 'Stern'], ['river', 'Fluss'], ['secret', 'Geheimnis'], ['moon', 'Mond'], ['whisper', 'Flüstern'], ['bucket', 'Eimer'], ['builder', 'Erbauer'], ['planet', 'Planet'],
    ['wall', 'Mauer'], ['oversight', 'Versehen'], ['partition', 'Wand'], ['desert', 'Wüste'], ['Booktown', 'Buchstadt'], ['top', 'Oberseite'], ['bottom', 'Unterseite']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
  bama: [
    ';--- kwkb', ';; kawokab_1', 'kwkb\tkawokab\tN0\tJupiter',
    ';--- qmr', ';; qamar_1', 'qmr\tqamar\tNprop\tmoon',
    ';--- njw', ';; najow_1', 'njw\tnajow\tN\twhisper',
    ';--- dlw', ';; dalow_1', 'dlw\tdalow\tN\tbucket',
    ';--- byn', ';; bAn_1', 'bAn\tbAn\tN\tevident',
    ';--- drs', ';; daros_1', 'drs\tdaros\tN\tlesson',
    ';--- qlm', ';; qalam_1', 'qlm\tqalam\tN\tpen',
    ';--- sr', ';; sir~_1', 'sr\tsir~\tN\tsecret',
    ';--- nh', ';; nahor_1', 'nhr\tnahor\tN\triver',
    ';--- drs(2)', ';; najom_1', 'njm\tnajom\tN\tstar',
    ';--- swr', ';; suwr_1', 'swr\tsuwr\tN\twall',
    ';--- shw', ';; sahow_1', 'shw\tsahow\tN\toversight',
    ';--- jdr', ';; jidAr_1', 'jdAr\tjidAr\tN\tpartition',
    ';--- bdw', ';; badow_1', 'bdw\tbadow\tN\tdesert',
    ';--- ktb', ';; kitab_1', 'ktb\tkitab\tN\tbook',
    ';--- fwq', ';; fawoqa_1', 'fwq\tfawoqa\tFW-Wa\tabove',
    ';--- tHt', ';; taHota_1', 'tHt\ttaHota\tFW-Wa\tbelow', ';; taHot_1', 'tHt\ttaHot\tN\tbottom',
  ],
  // „j…" ist kein Stichwort: so nennt Lanes Seite die blanke Wurzel, wenn sie nur auf die andere Schreibung verweist
  laneSeiten: { drs: FUEHRT, sr: FUEHRT, nh: FUEHRT, qmr: FUEHRT, njw: FUEHRT, njY: FUEHRT, dlY: FUEHRT, byn: FUEHRT, kwkb: FUEHRT,
    swr: [['j1', V.surNackt]], shY: [['j2', cp(SIN, HA, YA_OHNE_PUNKTE)]], shw: FUEHRT, bdY: FUEHRT, ktb: FUEHRT, fwq: FUEHRT, tHt: FUEHRT },
  laneOhneSeite: ['qlm', 'dlw'],
  laneSeitenlauf: true,
};
const ws13 = probe({}, WELT10);
pruefe('Stammliste: ein Eigenname, den die Stammliste als gewöhnliches Nomen führt (englische Bedeutung groß geschrieben), bekommt keine Wurzel', wurzelAuf(ws13, '130') === null, zeig(ws13, '130'));
pruefe('Stammliste: ein Eigenname der Stammliste bekommt keine Wurzel', wurzelAuf(ws13, '126') === null, zeig(ws13, '126'));
pruefe('Stammliste: führt Lane die Wurzel unter beiden Schreibungen des schwachen Radikals, gilt die der Stammliste — und der Beleg sagt, dass Lane auch die andere führt', wurzelAuf(ws13, '127') === wz(NUN, JIM, WAW) && /daneben auch die mit dem anderen schwachen Radikal \(Seite „njY“\)/.test(belegWurzel(ws13, '127').wo || ''), zeig(ws13, '127'));
pruefe('Stammliste: führt Lane die Wurzel nur unter der ANDEREN Schreibung des schwachen Radikals, widersprechen sich die Quellen — es gilt keine', wurzelAuf(ws13, '128') === null, zeig(ws13, '128'));
pruefe('Stammliste: ein Wort auf Kasratan bekommt keine Wurzel aus der Stammliste', wurzelAuf(ws13, '129') === null, zeig(ws13, '129'));
pruefe('Stammliste: die Probe läuft durch, alle siebzehn Plätze sind belegt', ws13.codeZ === 0 && ws13.codeB === 0 && ws13.karten.length === 17, 'Exit ' + ws13.codeZ + ' / ' + ws13.codeB + ' / ' + ws13.codeL + ', Karten ' + ws13.karten.map(k => k.id).join(',') + ': ' + ws13.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Stammliste: stehen die Radikale der Wurzelzeile im Wort und führt Lane die Seite dieser Wurzel, kommt sie auf die Karte — mit beiden Quellen im Beleg', wurzelAuf(ws13, '121') === wz(DAL, RA, SIN) && belegWurzel(ws13, '121').q === 'bama-wurzel' && /Stammliste: das Lemma .*Lanes Lexikon führt diese Wurzel/.test(belegWurzel(ws13, '121').wo || ''), zeig(ws13, '121'));
pruefe('Stammliste: führt Lane keine Seite dieser Wurzel, bleibt sie offen', wurzelAuf(ws13, '122') === null, zeig(ws13, '122'));
pruefe('Stammliste: hängt das Lemma unter einer fremden Wurzelzeile (ihre Radikale stehen nicht im Wort), bleibt die Wurzel offen', wurzelAuf(ws13, '123') === null, zeig(ws13, '123'));
pruefe('Stammliste: eine zweilautige Zeile zählt nicht, wenn das Wort den zweiten Radikal nicht doppelt führt', wurzelAuf(ws13, '124') === null, zeig(ws13, '124'));
pruefe('Stammliste: eine zweilautige Zeile gilt als verdoppelte Wurzel, wenn das Wort den zweiten Radikal mit Schadda führt', wurzelAuf(ws13, '125') === wz(SIN, RA, RA), zeig(ws13, '125'));
const fehlend13 = ws13.fehlend || {};
const zeigF = () => 'Liste der fehlenden Seiten: ' + JSON.stringify(ws13.fehlend) + ' · ' + (ws13.text.split('\n').find(z => /OFFEN/.test(z)) || '(keine Zeile „OFFEN")').slice(0, 220);
pruefe('Stammliste: nennt Lanes Seite nur die blanke Wurzel als Verweis (kein Stichwort mit Vokalzeichen), führt Lane die Wurzel nicht — sie bleibt offen', wurzelAuf(ws13, '131') === null && !fehlend13.swr, zeig(ws13, '131') + ' · ' + zeigF());
pruefe('Stammliste: ist die eine Schreibung des schwachen Radikals bei Lane nur ein Verweis, gilt die andere, die Stichwörter führt', wurzelAuf(ws13, '132') === wz(SIN, HA, WAW) && belegWurzel(ws13, '132').q === 'bama-wurzel', zeig(ws13, '132'));
pruefe('Stammliste: wurde nach Lanes Seite noch nie gefragt, bleibt die Wurzel offen und der Schlüssel steht auf der Liste der fehlenden Seiten', wurzelAuf(ws13, '133') === null && (fehlend13.jdr || []).includes('133'), zeig(ws13, '133') + ' · ' + zeigF());
pruefe('Stammliste: führt Lane die andere Schreibung des schwachen Radikals und wurde nach der eigenen nie gefragt, wird nicht entschieden — auf der Liste steht die eigene', wurzelAuf(ws13, '134') === null && (fehlend13.bdw || []).includes('134'), zeig(ws13, '134') + ' · ' + zeigF());
pruefe('Stammliste: auf der Liste der fehlenden Seiten steht nur, wonach nie gefragt wurde — keine abgelegte Seite, keine als „gibt es nicht" gemerkte, keine der anderen Schreibung; und der Bau nennt die Zahl', Object.keys(fehlend13).sort().join(' ') === 'bdw jdr' && /OFFEN an 2 Karten: nach 2 Wurzelseiten/.test(ws13.text), zeigF());
pruefe('Wurzelseiten holen (ersatz-lane.mjs --seiten): ohne --holen wird nichts abgerufen — der Lauf liest die Liste des Baus und meldet jede Seite als nicht bekannt', ws13.codeS === 0 && /LANE \(Wurzelseiten\): \{"nichtBekannt":2\}/.test(ws13.seitenText) && /neu geholte Seiten: 0 \(ohne --holen/.test(ws13.seitenText), 'Exit ' + ws13.codeS + ' · ' + ws13.seitenText.trim().split('\n')[0].slice(0, 260));
pruefe('Stammliste: führt die Quelle der Karte das Wort als Namen, bekommt es keine Wurzel — auch wenn Stammliste und Lane eine hergäben', wurzelAuf(ws13, '135') === null && /name/.test(((ws13.belege['135'] || {}).eintrag) || ''), zeig(ws13, '135') + ' · Eintrag ' + JSON.stringify((ws13.belege['135'] || {}).eintrag));
pruefe('Stammliste: ist das einzige passende Lemma ein Funktionswort, bekommt die Karte keine Wurzel', wurzelAuf(ws13, '136') === null, zeig(ws13, '136'));
pruefe('Stammliste: steht neben dem Funktionswort ein Nomen gleicher Schreibung unter derselben Zeile, gilt dessen Wurzel — im Beleg das Nomen', wurzelAuf(ws13, '137') === wz(TA, HAA, TA) && /das Lemma „taHot_1“/.test(belegWurzel(ws13, '137').wo || ''), zeig(ws13, '137'));

// 14. Das Geschlecht der FORM geht dem des Stichworts vor (13.10.2026, ersatz-zuordnen.mjs, Regel von Claude). Anlass: die
//     Ersatzkarte „Dienerin" trug „männlich" — ihr Wort steht im Eintrag „Diener" als dessen weibliche Form, und der
//     Zuordner nahm bei jeder gebeugten Form das Geschlecht des Stichworts.
//     141  die Quelle führt die Form der Karte als WEIBLICHE Form eines männlichen Stichworts → weiblich, der Beleg sagt beides
//     142  die Form trägt kein Geschlecht (eine Mehrzahl) → weiter das des Stichworts
const NAJMA = cp(NUN, FATHA, JIM, SUKUN, MIM, FATHA, TA_M), NUJUM = cp(NUN, DAMMA, JIM, DAMMA, WAW, MIM);
const WELT11 = {
  karten: [
    { id: '141', ar: NAJMA + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer },
    { id: '142', ar: NUJUM + UN, de: 'Stern', type: 'noun', chapter: 1, ...leer },
  ],
  woerterbuch: [nomen(V.najmNackt, V.najm, 'star')],
  englischDeutsch: [['star', 'Stern']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
  zusatz: [
    { f: NAJMA + UN, t: ['feminine', 'indefinite', 'nominative', 'singular'], w: V.najmNackt, pos: 'noun', n: null, k: V.najm },
    { f: NUJUM + UN, t: ['indefinite', 'nominative', 'plural'], w: V.najmNackt, pos: 'noun', n: null, k: V.najm },
  ],
};
const wgf = probe({}, WELT11);
const zeigG = id => 'Karte ' + id + ': ' + JSON.stringify(feldAuf(wgf, id, 'gender')) + ' · ' + JSON.stringify(feldBeleg(wgf, id, 'gender')).slice(0, 260) + ' · Stufe ' + ((wgf.belege[id] || {}).stufe);
pruefe('Geschlecht der Form: die Probe läuft durch, beide Plätze sind als gebeugte Form belegt', wgf.codeZ === 0 && wgf.codeB === 0 && wgf.karten.length === 2 && ['141', '142'].every(id => (wgf.belege[id] || {}).stufe === 'F'), 'Exit ' + wgf.codeZ + ' / ' + wgf.codeB + ', Karten ' + wgf.karten.map(k => k.id).join(',') + ' · ' + zeigG('141') + ' · ' + wgf.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('Geschlecht der Form: führt die Quelle die Form als weibliche, steht „weiblich" auf der Karte, auch wenn das Stichwort männlich ist — der Beleg nennt beides', feldAuf(wgf, '141', 'gender') === 'feminine' && /führt diese Form als weibliche .*das Stichwort selbst ist männlich/.test(feldBeleg(wgf, '141', 'gender').wo || ''), zeigG('141'));
pruefe('Geschlecht der Form: trägt die Form kein Geschlecht (eine Mehrzahl), gilt weiter das des Stichworts', feldAuf(wgf, '142', 'gender') === 'masculine' && /Geschlecht des ersten Wortes/.test(feldBeleg(wgf, '142', 'gender').wo || ''), zeigG('142'));

// 15. Geschlecht aus der Endung (13.10.2026, ersatz-bauen.mjs, Regel von Claude): ein Nomen, das in der Einzahl auf Ta
//     marbuta endet, ist weiblich — Regel der Grammatik, keine Quelle; nur als Lücke, und nie gegen ein „männlich" der
//     bisherigen Karte (dort ist sie der Einspruch, nicht die Quelle).
//     151  Einzahl auf Ta marbuta, keine Quelle nennt das Geschlecht → weiblich, der Beleg sagt, dass es die Regel ist
//     152  wie 151, aber die bisherige Karte sagt „männlich" → offen
//     153  das Wort endet auf Ta marbuta, die Einzahl der Karte ist aber ein ANDERES Wort (sie trägt eine Mehrzahl) → offen
//     154  die Einzahl endet nicht auf Ta marbuta → offen
//     155  wie 151, aber die Hand nimmt das Feld mit „leer" heraus → offen, und nicht mitgezählt
//     156  die Quelle nennt selbst ein Geschlecht (männlich) → das bleibt
const MADRASA = cp(MIM, FATHA, DAL, SUKUN, RA, FATHA, SIN, FATHA, TA_M), DARISA = cp(DAL, FATHA, ALIF, RA, KASRA, SIN, FATHA, TA_M);
const KATABA_T = cp(KAF, FATHA, TA, FATHA, BA, FATHA, TA_M), SAFINA = cp(SIN, FATHA, FA, KASRA, YA, NUN, FATHA, TA_M), FATINA = cp(FA, FATHA, ALIF, TA, KASRA, NUN, FATHA, TA_M);
const WELT12 = {
  karten: [
    { id: '151', ar: MADRASA + UN, de: 'Schule', type: 'noun', chapter: 1, ...leer, sg: MADRASA + UN, gender: 'feminine' },
    { id: '152', ar: DARISA + UN, de: 'Gelehrter', type: 'noun', chapter: 1, ...leer, sg: DARISA + UN, gender: 'masculine' },
    { id: '153', ar: KATABA_T + UN, de: 'Schreiber', type: 'noun', chapter: 1, ...leer, sg: W.kitab + UN, gender: 'feminine' },
    { id: '154', ar: W.qamar + UN, de: 'Mond', type: 'noun', chapter: 2, ...leer, sg: W.qamar + UN, gender: 'feminine' },
    { id: '155', ar: SAFINA + UN, de: 'Schiff', type: 'noun', chapter: 2, ...leer, sg: SAFINA + UN, gender: 'feminine' },
    { id: '156', ar: FATINA + UN, de: 'Zauber', type: 'noun', chapter: 2, ...leer, sg: FATINA + UN, gender: 'feminine' },
  ],
  woerterbuch: [nomen(cp(FA, ALIF, TA, NUN, TA_M), FATINA, 'charm')],
  englischDeutsch: [['charm', 'Zauber']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
};
const we = probe({
  151: vonHand(MADRASA + UN, 'noun', 'Schule'), 152: vonHand(DARISA + UN, 'noun', 'Gelehrter'),
  153: { ...vonHand(KATABA_T + UN, 'noun', 'Schreiber'), felder: { ...vonHand(KATABA_T + UN, 'noun', 'Schreiber').felder, sg: { w: W.kitab + UN, wo: 'Probe: Stammliste', q: 'bama' } } },
  154: vonHand(W.qamar + UN, 'noun', 'Mond'), 155: { ...vonHand(SAFINA + UN, 'noun', 'Schiff'), leer: ['gender'] },
}, WELT12);
const zeigE = id => 'Karte ' + id + ': Geschlecht ' + JSON.stringify(feldAuf(we, id, 'gender')) + ' · Einzahl ' + (feldAuf(we, id, 'sg') ? 'da' : 'leer') + ' · ' + JSON.stringify(feldBeleg(we, id, 'gender')).slice(0, 200);
pruefe('Geschlecht aus der Endung: die Probe läuft durch, alle sechs Plätze sind belegt', we.codeZ === 0 && we.codeB === 0 && we.karten.length === 6, 'Exit ' + we.codeZ + ' / ' + we.codeB + ', Karten ' + we.karten.map(k => k.id).join(',') + ': ' + we.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Geschlecht aus der Endung: ein Nomen, das in der Einzahl auf Ta marbuta endet, ist weiblich — der Beleg sagt, dass es die Regel der Grammatik ist und keine Quelle', feldAuf(we, '151', 'gender') === 'feminine' && feldBeleg(we, '151', 'gender').q === 'endung' && /Regel der Grammatik, keine Angabe einer Quelle/.test(feldBeleg(we, '151', 'gender').wo || ''), zeigE('151'));
pruefe('Geschlecht aus der Endung: sagt die bisherige Karte „männlich", bleibt das Feld offen', feldAuf(we, '152', 'gender') === null && !!feldAuf(we, '152', 'sg'), zeigE('152'));
pruefe('Geschlecht aus der Endung: ist die Einzahl der Karte ein anderes Wort (sie trägt eine Mehrzahl), bleibt das Feld offen', feldAuf(we, '153', 'gender') === null && !!feldAuf(we, '153', 'sg'), zeigE('153'));
pruefe('Geschlecht aus der Endung: endet die Einzahl nicht auf Ta marbuta, bleibt das Feld offen', feldAuf(we, '154', 'gender') === null && !!feldAuf(we, '154', 'sg'), zeigE('154'));
pruefe('Geschlecht aus der Endung: „leer" von Hand nimmt das Feld heraus, und der Bau nennt die Zahl ohne diese Karte', feldAuf(we, '155', 'gender') === null && /Geschlecht aus der Endung [^\n]*: 1 Nomen weiblich/.test(we.text), zeigE('155') + ' · ' + (we.text.split('\n').find(z => /Geschlecht aus der Endung/.test(z)) || '(keine Zeile)').slice(0, 160));
pruefe('Geschlecht aus der Endung: nennt die Quelle selbst ein Geschlecht, bleibt das — die Regel füllt nur eine Lücke', feldAuf(we, '156', 'gender') === 'masculine' && feldBeleg(we, '156', 'gender').q !== 'endung', zeigE('156'));

const gut = faelle.filter(f => f.ok).length;
for (const f of faelle) if (!f.ok) console.log(`  ✗ ${f.name}\n      bekommen: ${f.was}`);
console.log(`Eichung Zuordner und Bau: ${gut} von ${faelle.length} Fällen wie erwartet`);
process.exit(gut === faelle.length ? 0 : 1);
