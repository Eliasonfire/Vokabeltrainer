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
import { laneDateiname as laneDatei, wurzelSchluessel, wurzelWert, ausBW } from './ersatz-bama-lib.mjs';

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
    // Abschnitt 18: abgelegte ARTIKEL von Verbstämmen (quellen/lane/woerter/<Kennung>.html) und Einträge aus einem
    // früheren Lauf von ersatz-lane.mjs --verben
    if (welt.laneArtikel) { fs.mkdirSync(path.join(lane, 'woerter'), { recursive: true }); for (const [nr, html] of Object.entries(welt.laneArtikel)) fs.writeFileSync(path.join(lane, 'woerter', nr + '.html'), html); }
    if (welt.laneVerben) fs.writeFileSync(path.join(repo, 'data-ersatz', 'arbeit', 'lane-verben.json'), JSON.stringify({ eintraege: welt.laneVerben }));
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
  // Abschnitt 18: der Lauf, der bei Lane das Verbalsubstantiv nachsieht (auf abgelegten Artikeln der Probe), dann der Bau
  let lv = { status: null, stdout: '', stderr: '' };
  if (welt && welt.laneVerbenlauf && b.status === 0) {
    lv = spawnSync(process.execPath, [path.join(HIER, 'ersatz-lane.mjs'), '--verben'], { encoding: 'utf8', env: umgebung });
    if (lv.status === 0) b = bau();
  }
  // Abschnitt 13: der Lauf, der die fehlenden Wurzelseiten holen würde — hier OHNE --holen, er liest nur die Liste des Baus
  const sl = welt && welt.laneSeitenlauf && b.status === 0 ? spawnSync(process.execPath, [path.join(HIER, 'ersatz-lane.mjs'), '--seiten'], { encoding: 'utf8', env: umgebung }) : { status: null, stdout: '', stderr: '' };
  const lies = (name, sonst) => { const d = path.join(repo, 'data-ersatz', name); try { return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : sonst; } catch { return sonst; } };
  const kartenDatei = path.join(repo, 'data-ersatz', 'vokabeln-' + ziel + '.js');
  let karten = [];
  if (fs.existsSync(kartenDatei)) { const m = fs.readFileSync(kartenDatei, 'utf8').match(/=\s*(\[[\s\S]*\])\s*;?\s*$/); if (m) karten = JSON.parse(m[1]); }
  const aus = { codeZ: z.status, codeB: b.status, codeL: l.status, text: (z.stdout || '') + (z.stderr || '') + (l.stdout || '') + (l.stderr || '') + (b.stdout || '') + (b.stderr || ''), belege: lies('belege-' + ziel + '.json', {}), nichtGefunden: lies('nicht-gefunden.json', []), karten, lane: lies(path.join('arbeit', 'lane-wurzeln.json'), {}).eintraege || {},
    fehlend: lies(path.join('arbeit', 'lane-fehlende-seiten.json'), {}).schluessel || null, codeS: sl.status, seitenText: (sl.stdout || '') + (sl.stderr || ''), codeV: lv.status, verbenText: (lv.stdout || '') + (lv.stderr || ''), laneVerben: lies(path.join('arbeit', 'lane-verben.json'), {}).eintraege || {} };
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
pruefe('Das Wort selbst: der Bau nennt die Zahl der gesetzten Felder', /Das Wort selbst: Einzahl an 1 Nomen, Mehrzahl an 0 Nomen und Vergangenheit an 1 Verben gesetzt/.test(wv.text), (wv.text.split('\n').find(z => z.startsWith('Das Wort selbst')) || 'keine Zeile').slice(0, 200));

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

// 16. Mehrzahl aus Buckwalters Stammliste (13.10.2026, bamaMehrzahlZurKarte in ersatz-bama-lib.mjs und ersatz-bauen.mjs,
//     Regel von Claude): die Liste nennt die Mehrzahl als weitere Zeile unter dem Lemma oder über die Kategorie der
//     Einzahl-Zeile. Nur als Lücke, nur für ein Nomen aus einem Wort, dessen Einzahl das Wort selbst ist.
//     161  weitere Zeile mit anderem Stamm, englisch die Mehrzahl → gebrochene Mehrzahl, Fatha vor dem Dehnungs-Alif
//     162  die Einzahl-Zeile trägt die Kategorie NapAt → Stamm + At
//     163  eine Zeile der Kategorie NAt (mit dem Lautwechsel der Mehrzahl) → dieser Stamm + At
//     164  eine Zeile mit DEMSELBEN Stamm wie die Einzahl (Einzelstück, weibliche Form) → keine Mehrzahl
//     165  die weitere Zeile gehört zu einer anderen Bedeutung (englisch nicht die Mehrzahl der Einzahl) → keine
//     166  die weitere Zeile trägt eine Kategorie, die selbst nach Zahl beugt (Ndu) → keine
//     167  Wort auf Kasratan; ohne die Endung gliche es einem anderen Lemma → keine
//     168  zwei Lemmata gleicher Schreibung: das, dessen englische Bedeutung zur Karte passt → dessen Mehrzahl
//     169  zwei Lemmata, die Bedeutung der Karte passt zu keinem, und sie nennen verschiedene Mehrzahlen → offen, gezählt
//     170  die Quelle der Karte nennt selbst eine Mehrzahl → die bleibt
//     171  wie 161, aber die Hand nimmt das Feld mit „leer" heraus → offen, und nicht mitgezählt
//     172  schwache Mehrzahl: die Liste führt sie auf -iy und mit Kasratan (Kategorie NK) → nur die mit Kasratan
//     173  NAt-Zeile unter einem Lemma, das auch die Form auf Ta marbuta führt; die Karte trägt das Sammelwort → keine
//     174  die Quelle der Karte führt das Wort als NAMEN → keine
//     175  die weitere Zeile trägt den Artikel (ein Name) → keine
//     176  ein Eigenname, den die Stammliste als gewöhnliches Nomen führt (englische Bedeutung groß geschrieben) → keine
//          (ein Lemma der Kategorie Nprop hat ohnehin keine selbständige Form; der Störtest zeigte, dass die Probe
//          damit aus dem falschen Grund grün war)
//     177  Kategorie NduAt an einem Wort mit Verbindungs-Alif → Stamm + At, Alif mit Kasra geschrieben
//     178  zwei Mehrzahl-Zeilen → beide, in der Reihenfolge der Liste; das TRENNZEICHEN ist das der bisherigen Karte,
//          ihr Wert nicht (sie nennt in der Probe ganz andere Wörter)
//     183  die Karte trägt als Einzahl ein ANDERES Wort (ihr Wort ist selbst eine Mehrzahl) → keine, obwohl die
//          Stammliste ihr Wort als Einzahl mit der Kategorie NapAt führt (nachgetragen nach dem vollen Störtest:
//          die Bedingung hatte keinen Fall)
//     Dazu zwei kleine Regeln zum selben Feld (beide von Claude, 13.10.2026):
//     179  ZAHLWORT (Wortart „num", ersatz-zuordnen.mjs): die App führt im Feld Mehrzahl die Form, die bei einem
//          weiblichen Nomen steht — die Quelle nennt sie als männliche Form des weiblichen Stichworts → diese Form
//     180  dieselbe Kopfzeile an einem gewöhnlichen Nomen → keine Mehrzahl (die Regel gilt nur dem Zahlwort)
//     181  DAS WORT SELBST (ersatz-bauen.mjs): die bisherige Karte nennt als Mehrzahl ihr eigenes Wort (die Karte
//          trägt eine Mehrzahl) → das Arabisch der Ersatzkarte, mit dessen Fundstelle
//     182  die bisherige Karte nennt als Mehrzahl ein ANDERES Wort, und keine Quelle nennt eine → offen
const THA = 0x062B, SHIN = 0x0634, AYN = 0x0639, KHA = 0x062E, ZAY = 0x0632, KASRATAN_Z = 0x064D;
const THANIYA = cp(THA, FATHA, ALIF, NUN, KASRA, YA, FATHA, TA_M), SHAAR = cp(SHIN, FATHA, AYN, SUKUN, RA), JAZIRA = cp(JIM, FATHA, ZAY, KASRA, YA, RA, FATHA, TA_M);
const IKHTIBAR = cp(ALIF, KASRA, KHA, SUKUN, TA, KASRA, BA, FATHA, ALIF, RA), BUYUT = cp(BA, DAMMA, YA, DAMMA, WAW, TA);
const THALATH = cp(THA, FATHA, LAM, FATHA, ALIF, THA), THALATHA = THALATH + cp(FATHA, TA_M);
const PL = {
  aqlam: cp(HAMZA_ALIF, FATHA, QAF, SUKUN, LAM, FATHA, ALIF, MIM), safinat: cp(SIN, FATHA, FA, KASRA, YA, NUN, FATHA, ALIF, TA),
  madarasat: cp(MIM, FATHA, DAL, FATHA, RA, FATHA, SIN, FATHA, ALIF, TA), durus: cp(DAL, DAMMA, RA, DAMMA, WAW, SIN),
  thawanin: cp(THA, FATHA, WAW, FATHA, ALIF, NUN, KASRATAN_Z), ikhtibarat: cp(ALIF, KASRA, KHA, SUKUN, TA, KASRA, BA, FATHA, ALIF, RA, FATHA, ALIF, TA),
  judur: cp(JIM, DAMMA, DAL, DAMMA, RA), judran: cp(JIM, DAMMA, DAL, SUKUN, RA, FATHA, ALIF, NUN),
};
const nomenKarte = (id, ar, de, mehr = {}) => ({ id, ar: ar + UN, de, type: 'noun', chapter: 1, ...leer, sg: ar + UN, ...mehr });
const WELT13 = {
  karten: [
    nomenKarte('161', V.qalam, 'Stift'), nomenKarte('162', SAFINA, 'Schiff'), nomenKarte('163', MADRASA, 'Schule'), nomenKarte('164', W.qamar, 'Mond'),
    nomenKarte('165', V.najm, 'Stern'), nomenKarte('166', V.nahr, 'Fluss'), { ...nomenKarte('167', '', 'Erbauer'), ar: BANIN, sg: BANIN },
    nomenKarte('168', W.dars, 'Unterricht'), nomenKarte('169', W.bab, 'Tür'), nomenKarte('170', W.bayt, 'Haus'), nomenKarte('171', SIRR, 'Geheimnis'),
    nomenKarte('172', THANIYA, 'Sekunde'), nomenKarte('173', SHAAR, 'Haar'), nomenKarte('174', W.kitab, 'Buchstadt'), nomenKarte('175', JAZIRA, 'Insel'),
    nomenKarte('176', V.kawkab, 'Planet'), nomenKarte('177', IKHTIBAR, 'Test'), nomenKarte('178', V.jidar, 'Wand', { pl: W.kutub + ' / ' + W.bayt }),
    nomenKarte('179', THALATHA, 'drei'), nomenKarte('180', NAJMA, 'Sternchen'),
    { ...nomenKarte('181', W.kutub, 'Bücher'), sg: W.kitab + UN, pl: W.kutub + UN }, nomenKarte('182', DARISA, 'Gelehrter', { pl: W.kutub + UN }),
    { ...nomenKarte('183', FATINA, 'Zauber'), sg: W.kitab + UN },
  ],
  woerterbuch: [nomen(W.drsNackt, W.dars, 'lesson'), nomen(W.babNackt, W.bab, 'gate'), { ...nomen(W.baytNackt, W.bayt, 'house'), hf: [{ f: BUYUT, t: ['plural'] }] },
    { ...nomen(W.ktbNackt, W.kitab, 'Booktown'), pos: 'name' },
    { w: cp(THA, LAM, ALIF, THA, TA_M), pos: 'num', n: null, kopf: [{ f: THALATHA, t: ['canonical', 'feminine'] }], hf: [{ f: THALATH, t: ['masculine'] }], tab: [{ f: THALATH + UN, t: ['indefinite', 'masculine', 'nominative', 'singular'] }], sinn: [{ g: 'three' }] },
    { ...nomen(cp(NUN, JIM, MIM, TA_M), NAJMA, 'starlet'), kopf: [{ f: NAJMA, t: ['canonical', 'feminine'] }], hf: [{ f: V.najm, t: ['masculine'] }], tab: [{ f: V.najm + UN, t: ['indefinite', 'masculine', 'nominative', 'singular'] }] }],
  englischDeutsch: [...[['lesson', 'Unterricht'], ['gate', 'Tür'], ['house', 'Haus'], ['Booktown', 'Buchstadt'], ['starlet', 'Sternchen'], ['three', 'drei']].map(([w, de]) => ({ w, pos: 'noun', k: [{ sinn: 'Probe', de: [de] }] })),
    { w: 'three', pos: 'num', k: [{ sinn: 'Probe', de: ['drei'] }] }],
  bama: [
    ';; qalam_1', 'qlm\tqalam\tNdu\tpen', '>qlAm\t>aqolAm\tN\tpens',
    ';; safiynap_1', 'sfyn\tsafiyn\tNapAt\tship',
    ';; madorasap_1', 'mdrs\tmadoras\tNapdu\tschool', 'mdrs\tmadaras\tNAt\tschools',
    ';; qamar_1', 'qmr\tqamar\tNdu\tmoon', 'qmr\tqamar\tNap\tmoons',
    ';; najom_1', 'njm\tnajom\tNdu\tstar', 'njwm\tnujuwm\tN\therbs',
    ';; nahor_1', 'nhr\tnahor\tNdu\triver', '>nhr\t>anohur\tNdu\trivers',
    ';; bAn_1', 'bAn\tbAn\tNdu\tbuilder', 'bnAp\tbunAp\tN\tbuilders',
    ';; daros_1', 'drs\tdaros\tNdu\tlesson', 'drws\tduruws\tN\tlessons', ';; daros_2', 'drs\tdaros\tNdu\tthreshing', '>drAs\t>adorAs\tN\tthreshings',
    ';; bAb_1', 'bAb\tbAb\tNdu\tdoor', '>bwAb\t>abowAb\tN\tdoors', ';; bAb_2', 'bAb\tbAb\tNdu\tchapter', 'bybAn\tbiybAn\tN\tchapters',
    ';; bayot_1', 'byt\tbayot\tNdu\thouse', '>byAt\t>aboyAt\tN\thouses',
    ';; sir~_1', 'sr\tsir~\tNdu\tsecret', '>srAr\t>asorAr\tN\tsecrets',
    ';; vAniyap_1', 'vAny\tvAniy\tNapdu\tsecond', 'vwAny\tvawAniy\tN0_Nh\tseconds', 'vwAn\tvawAn\tNK\tseconds',
    ';; $aEor_1', '$Er\t$aEor\tN\thair', '$Er\t$aEor\tNapdu\thair', '$Er\t$aEar\tNAt\thairs',
    ';; kitab_1', 'ktb\tkitab\tNdu\tbook', 'ktb\tkutub\tN\tbooks',
    ';; jaziyrap_1', 'jzyr\tjaziyr\tNapdu\tisland', 'Aljzr\tAlojuzur\tN\tislands',
    ';; kawokab_1', 'kwkb\tkawokab\tNdu\tJupiter', 'kwAkb\tkawAkib\tNdip\tJupiters',
    ';; {ixotibAr_1', 'AxtbAr\t{ixotibAr\tNduAt\ttest',
    ';; jidAr_1', 'jdAr\tjidAr\tNdu\twall', 'jdr\tjudur\tN\twalls', 'jdrAn\tjudorAn\tN\twalls',
    ';; fAtinap_1', 'fAtn\tfAtin\tNapAt\tcharm',
  ],
};
const wpl = probe({
  161: vonHand(V.qalam + UN, 'noun', 'Stift'), 162: vonHand(SAFINA + UN, 'noun', 'Schiff'), 163: vonHand(MADRASA + UN, 'noun', 'Schule'), 164: vonHand(W.qamar + UN, 'noun', 'Mond'),
  165: vonHand(V.najm + UN, 'noun', 'Stern'), 166: vonHand(V.nahr + UN, 'noun', 'Fluss'), 167: vonHand(BANIN, 'noun', 'Erbauer'),
  171: { ...vonHand(SIRR + UN, 'noun', 'Geheimnis'), leer: ['pl'] }, 172: vonHand(THANIYA + UN, 'noun', 'Sekunde'), 173: vonHand(SHAAR + UN, 'noun', 'Haar'),
  175: vonHand(JAZIRA + UN, 'noun', 'Insel'), 176: vonHand(V.kawkab + UN, 'noun', 'Planet'), 177: vonHand(IKHTIBAR + UN, 'noun', 'Test'), 178: vonHand(V.jidar + UN, 'noun', 'Wand'),
  181: vonHand(W.kutub + UN, 'noun', 'Bücher'), 182: vonHand(DARISA + UN, 'noun', 'Gelehrter'),
  183: { ...vonHand(FATINA + UN, 'noun', 'Zauber'), felder: { ...vonHand(FATINA + UN, 'noun', 'Zauber').felder, sg: { w: W.kitab + UN, wo: 'Probe: Stammliste', q: 'bama' } } },
}, WELT13);
const zeigP = id => 'Karte ' + id + ': Mehrzahl ' + JSON.stringify(feldAuf(wpl, id, 'pl')) + ' · Einzahl ' + (feldAuf(wpl, id, 'sg') ? 'da' : 'leer') + ' · ' + JSON.stringify(feldBeleg(wpl, id, 'pl')).slice(0, 330);
const plZeile = () => (wpl.text.split('\n').find(z => /Mehrzahl aus Buckwalters Stammliste/.test(z)) || '(keine Zeile)').slice(0, 240);
const plAus = (id, wert) => feldAuf(wpl, id, 'pl') === wert && feldBeleg(wpl, id, 'pl').q === 'bama-mehrzahl';
const plOffen = id => feldAuf(wpl, id, 'pl') === null && !!feldAuf(wpl, id, 'sg');
pruefe('Mehrzahl aus der Stammliste: die Probe läuft durch, alle dreiundzwanzig Plätze sind belegt', wpl.codeZ === 0 && wpl.codeB === 0 && wpl.karten.length === 23, 'Exit ' + wpl.codeZ + ' / ' + wpl.codeB + ', Karten ' + wpl.karten.map(k => k.id).join(',') + ': ' + wpl.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Mehrzahl aus der Stammliste: eine weitere Zeile des Lemmas mit anderem Stamm, deren englische Bedeutung die Mehrzahl ist, kommt auf die Karte — Fatha vor dem Dehnungs-Alif, im Beleg Lemma und Zeile, und dass Claude es abgelesen hat', plAus('161', PL.aqlam) && /Lemma „qalam_1“ \(englisch „pen“\): Zeile „>aqolAm“ \(Kategorie N, englisch „pens“\)/.test(feldBeleg(wpl, '161', 'pl').wo || '') && /hat Claude aus der Liste abgelesen/.test(feldBeleg(wpl, '161', 'pl').wo || ''), zeigP('161'));
pruefe('Mehrzahl aus der Stammliste: trägt die Zeile der Einzahl die Kategorie NapAt, ist die Mehrzahl Stamm + At — der Beleg nennt die Kategorie und den Begleittext', plAus('162', PL.safinat) && /Zeile der Einzahl „safiyn“ trägt die Kategorie NapAt — nach dem Begleittext/.test(feldBeleg(wpl, '162', 'pl').wo || ''), zeigP('162'));
pruefe('Mehrzahl aus der Stammliste: eine Zeile der Kategorie NAt trägt den Lautwechsel der Mehrzahl — ihr Stamm + At gilt, nicht der Stamm der Einzahl', plAus('163', PL.madarasat) && /Zeile „madaras“ der Kategorie NAt/.test(feldBeleg(wpl, '163', 'pl').wo || ''), zeigP('163'));
pruefe('Mehrzahl aus der Stammliste: eine Zeile mit demselben Stamm wie die Einzahl ist keine Mehrzahl (Einzelstück, weibliche Form)', plOffen('164'), zeigP('164'));
pruefe('Mehrzahl aus der Stammliste: ist die englische Bedeutung der weiteren Zeile nicht die Mehrzahl der Einzahl, gehört sie zu einer anderen Bedeutung — keine Mehrzahl', plOffen('165'), zeigP('165'));
pruefe('Mehrzahl aus der Stammliste: eine weitere Zeile mit einer Kategorie, die selbst nach Zahl beugt, ist eine Einzahl — keine Mehrzahl', plOffen('166'), zeigP('166'));
pruefe('Mehrzahl aus der Stammliste: ein Wort auf Kasratan bekommt keine (ohne die Endung gliche es einem anderen Lemma)', plOffen('167'), zeigP('167'));
pruefe('Mehrzahl aus der Stammliste: unter zwei gleich geschriebenen Lemmata gilt das, dessen englische Bedeutung zur Karte passt — der Beleg sagt es', plAus('168', PL.durus) && /Lemma „daros_1“ .*unter 2 gleich geschriebenen Lemmata das, dessen englische Bedeutung/.test(feldBeleg(wpl, '168', 'pl').wo || ''), zeigP('168'));
pruefe('Mehrzahl aus der Stammliste: passt die Bedeutung der Karte zu keinem von zwei Lemmata und nennen sie verschiedene Mehrzahlen, bleibt das Feld offen — und der Bau zählt es', plOffen('169') && /offen gelassen an 1: gleich geschriebene Lemmata/.test(wpl.text), zeigP('169') + ' · ' + plZeile());
pruefe('Mehrzahl aus der Stammliste: nennt die Quelle der Karte selbst eine Mehrzahl, bleibt die — die Regel füllt nur eine Lücke', feldAuf(wpl, '170', 'pl') === BUYUT && feldBeleg(wpl, '170', 'pl').q !== 'bama-mehrzahl', zeigP('170'));
pruefe('Mehrzahl aus der Stammliste: „leer" von Hand nimmt das Feld heraus, und der Bau nennt die Zahl ohne diese Karte', plOffen('171') && /Mehrzahl aus Buckwalters Stammliste [^\n]*: 7 Nomen/.test(wpl.text), zeigP('171') + ' · ' + plZeile());
pruefe('Mehrzahl aus der Stammliste: eine schwache Mehrzahl steht in der Form mit Kasratan da, nicht daneben noch auf -iy', plAus('172', PL.thawanin), zeigP('172'));
pruefe('Mehrzahl aus der Stammliste: führt das Lemma auch die Form auf Ta marbuta und trägt die Karte das Sammelwort, gehört die NAt-Zeile zum Einzelstück — keine Mehrzahl', plOffen('173'), zeigP('173'));
pruefe('Mehrzahl aus der Stammliste: führt die Quelle der Karte das Wort als Namen, bekommt es keine', feldAuf(wpl, '174', 'pl') === null && /name/.test(((wpl.belege['174'] || {}).eintrag) || ''), zeigP('174') + ' · Eintrag ' + JSON.stringify((wpl.belege['174'] || {}).eintrag));
pruefe('Mehrzahl aus der Stammliste: eine weitere Zeile mit Artikel ist ein Name — keine Mehrzahl', plOffen('175'), zeigP('175'));
pruefe('Mehrzahl aus der Stammliste: ein Eigenname der Stammliste bekommt keine — auch wenn sie ihn als gewöhnliches Nomen führt (englische Bedeutung groß geschrieben)', plOffen('176'), zeigP('176'));
pruefe('Mehrzahl aus der Stammliste: Kategorie NduAt an einem Wort mit Verbindungs-Alif — Stamm + At, das Alif mit Kasra geschrieben wie im übrigen Ersatz', plAus('177', PL.ikhtibarat) && /trägt die Kategorie NduAt/.test(feldBeleg(wpl, '177', 'pl').wo || ''), zeigP('177'));
pruefe('Mehrzahl aus der Stammliste: zwei Mehrzahl-Zeilen stehen beide da, in der Reihenfolge der Liste — von der bisherigen Karte stammt nur das Trennzeichen, nicht der Wert', plAus('178', PL.judur + ' / ' + PL.judran), zeigP('178'));
pruefe('Mehrzahl aus der Stammliste: trägt die Karte als Einzahl ein anderes Wort, bleibt das Feld offen — die Regel gilt nur dem Wort in der Einzahl, auch wenn die Stammliste es als Einzahl führt', plOffen('183') && feldAuf(wpl, '183', 'sg') === W.kitab + UN, zeigP('183'));
pruefe('Zahlwort: die männliche Form der Kopfzeile steht im Feld Mehrzahl — die Form bei einem weiblichen Nomen, so sagt es der Beleg', feldAuf(wpl, '179', 'pl') === THALATH + UN && /männliche Form des Zahlworts — sie steht bei einem weiblichen Nomen/.test(feldBeleg(wpl, '179', 'pl').wo || ''), zeigP('179') + ' · Stufe ' + ((wpl.belege['179'] || {}).stufe));
pruefe('Zahlwort: dieselbe Kopfzeile an einem gewöhnlichen Nomen gibt keine Mehrzahl — nur ein Zahlwort führt dort die Gegenform', feldAuf(wpl, '180', 'pl') === null && (wpl.belege['180'] || {}).stufe === 'A', zeigP('180') + ' · Stufe ' + ((wpl.belege['180'] || {}).stufe));
pruefe('Das Wort selbst: nennt die bisherige Karte als Mehrzahl ihr eigenes Wort, steht dort das Arabisch der Ersatzkarte — mit dessen Fundstelle', feldAuf(wpl, '181', 'pl') === W.kutub + UN && /die Mehrzahl ist das Wort selbst/.test(feldBeleg(wpl, '181', 'pl').wo || '') && /Das Wort selbst: Einzahl an \d+ Nomen, Mehrzahl an 1 Nomen/.test(wpl.text), zeigP('181') + ' · ' + (wpl.text.split('\n').find(z => z.startsWith('Das Wort selbst')) || 'keine Zeile').slice(0, 160));
pruefe('Das Wort selbst: nennt die bisherige Karte als Mehrzahl ein anderes Wort und keine Quelle eine, bleibt die Mehrzahl offen', plOffen('182'), zeigP('182'));

// 17. Verbformen aus Buckwalters Stammliste (13.10.2026, bamaVerbformenZurKarte und bamaMasdarZurKarte in
//     ersatz-bama-lib.mjs, verbformenAusStammliste in ersatz-bauen.mjs; Regeln von Claude). Nur als Lücke, nur für ein
//     Verb aus einem Wort. Die bisherige Karte ist Schlüssel und Einspruch, nie Quelle — in der Probe führt sie im
//     Feld Befehl überall ein FREMDES Wort.
//     201  gesundes Verb der Grundform → Gegenwart aus Vorsilbe, Stamm und Endung; Befehl nach der Regel mit
//          Verbindungs-Alif und u; Verbalsubstantiv bleibt offen (die Grundform hat kein Muster)
//     202  die bisherige Karte nennt eine Gegenwart mit anderem Vokal als die Liste → Einspruch: offen, gezählt
//     203  das Lemma führt ZWEI Gegenwartszeilen → nur die, die der bisherigen Karte gleicht; der Befehl aus dieser Zeile
//     204  die bisherige Karte führt eine Gegenwart, aber keinen Befehl → Befehl bleibt offen, gezählt
//     205  Form II → Vorsilbe yu-; Verbalsubstantiv: das Nomen der Liste mit dem Muster unter DERSELBEN Wurzel
//     206  Form IV → der Befehl bekommt sein >a- zurück; die Liste führt das Nomen nicht, die bisherige Karte führt
//          genau das Muster → Verbalsubstantiv nach dem Muster, der Beleg sagt, dass es eine Regel ist
//     207  wie 206, aber die bisherige Karte führt ein ANDERES Verbalsubstantiv → offen
//     208  Form VII (Verbindungs-Alif im Befehl); das Nomen mit dem Muster steht unter einer ANDEREN Wurzel → offen
//     209  Form IV, die Zeile der Liste trägt die Kategorie ohne _yu (Vorsilbe passt nicht zur Bauform) → keine Gegenwart
//     210  schwacher Schluss → Gegenwart ohne Endung, Befehl mit kurzem Vokal
//     211  hohles Verb → Gegenwart aus dem langen Stamm, Befehl aus dem kurzen
//     212  „leer" von Hand an der Gegenwart → offen, und ohne Gegenwart auch kein Befehl (die bisherige Karte nennt
//          dieselbe Gegenwart wie die Liste — sonst hielte schon ihr Einspruch das Feld offen, und die Probe wäre aus
//          dem falschen Grund grün; so zeigte es der Störtest)
//     213  die Karte hat schon eine Gegenwart aus ihrer Quelle; die Liste nennt eine andere (und die bisherige Karte
//          dieselbe wie die Liste) → die Gegenwart der Quelle bleibt (nur Lücken werden gefüllt), und es gibt keinen Befehl
//     214  zwei gleich geschriebene Lemmata mit verschiedener Gegenwart, kein Schlüssel → offen, gezählt
//     215  verdoppeltes Verb → Befehl in der zusammengezogenen Form
//     216  zwei gleich geschriebene Lemmata mit verschiedener Gegenwart, kein Schlüssel — aber die Karte hat einen
//          Eintrag im Wörterbuch mit englischer Bedeutung → es gilt das Lemma, dessen englische Bedeutung ein Wort
//          damit teilt (in der Liste steht es an ZWEITER Stelle; „das erste" wäre falsch)
const HAMZA_U = 0x0625;
const VF = {
  yajlisuAnders: G.yajlusu,
  darrasa: cp(DAL, FATHA, RA, FATHA, SHADDA, SIN, FATHA), yudarrisu: cp(YA, DAMMA, DAL, FATHA, RA, KASRA, SHADDA, SIN, DAMMA), darris: cp(DAL, FATHA, RA, KASRA, SHADDA, SIN, SUKUN), tadris: cp(TA, FATHA, DAL, SUKUN, RA, KASRA, YA, SIN),
  akrama: cp(HAMZA_ALIF, FATHA, KAF, SUKUN, RA, FATHA, MIM, FATHA), yukrimu: cp(YA, DAMMA, KAF, SUKUN, RA, KASRA, MIM, DAMMA), akrim: cp(HAMZA_ALIF, FATHA, KAF, SUKUN, RA, KASRA, MIM, SUKUN), ikram: cp(HAMZA_U, KASRA, KAF, SUKUN, RA, FATHA, ALIF, MIM),
  arsala: cp(HAMZA_ALIF, FATHA, RA, SUKUN, SIN, FATHA, LAM, FATHA), yursilu: cp(YA, DAMMA, RA, SUKUN, SIN, KASRA, LAM, DAMMA), arsil: cp(HAMZA_ALIF, FATHA, RA, SUKUN, SIN, KASRA, LAM, SUKUN), risala: cp(RA, KASRA, SIN, FATHA, ALIF, LAM, FATHA, TA_M),
  inkasara: cp(ALIF, KASRA, NUN, SUKUN, KAF, FATHA, SIN, FATHA, RA, FATHA), yankasiru: cp(YA, FATHA, NUN, SUKUN, KAF, FATHA, SIN, KASRA, RA, DAMMA), inkasir: cp(ALIF, KASRA, NUN, SUKUN, KAF, FATHA, SIN, KASRA, RA, SUKUN),
  ajlasa: cp(HAMZA_ALIF, FATHA, JIM, SUKUN, LAM, FATHA, SIN, FATHA),
  bana: cp(BA, FATHA, NUN, FATHA, YA_OHNE_PUNKTE), yabni: cp(YA, FATHA, BA, SUKUN, NUN, KASRA, YA), ibni: cp(ALIF, KASRA, BA, SUKUN, NUN, KASRA),
  qala: cp(QAF, FATHA, ALIF, LAM, FATHA), yaqulu: cp(YA, FATHA, QAF, DAMMA, WAW, LAM, DAMMA), qul: cp(QAF, DAMMA, LAM, SUKUN),
  darasa: cp(DAL, FATHA, RA, FATHA, SIN, FATHA), yadrusu: cp(YA, FATHA, DAL, SUKUN, RA, DAMMA, SIN, DAMMA),
  rakiba: cp(RA, FATHA, KAF, KASRA, BA, FATHA), yarkubu: cp(YA, FATHA, RA, SUKUN, KAF, DAMMA, BA, DAMMA), yarkabu: cp(YA, FATHA, RA, SUKUN, KAF, FATHA, BA, DAMMA),
  malaka: cp(MIM, FATHA, LAM, FATHA, KAF, FATHA),
  madda: cp(MIM, FATHA, DAL, FATHA, SHADDA), yamuddu: cp(YA, FATHA, MIM, DAMMA, DAL, DAMMA, SHADDA), mudda: cp(MIM, DAMMA, DAL, FATHA, SHADDA),
  hamala: cp(HAA, FATHA, MIM, FATHA, LAM, FATHA), hamalaNackt: cp(HAA, MIM, LAM), yahmilu: cp(YA, FATHA, HAA, SUKUN, MIM, KASRA, LAM, DAMMA), ihmil: cp(ALIF, KASRA, HAA, SUKUN, MIM, KASRA, LAM, SUKUN),
};
const verbKarte = (id, ar, de, mehr = {}) => ({ id, ar, de, type: 'verb', chapter: 1, ...leer, past: ar, ...mehr });
const WELT14 = {
  karten: [
    verbKarte('201', S3.kataba, 'schreiben', { present: YAKTUBU, imperative: IJLIS }), verbKarte('202', V.jalasa, 'sitzen', { present: VF.yajlisuAnders, imperative: IJLIS }),
    verbKarte('203', V.fataha, 'öffnen', { present: G.yaftahu, imperative: IJLIS }), verbKarte('204', W.sakana, 'wohnen', { present: G.yaskunu }),
    verbKarte('205', VF.darrasa, 'lehren', { present: VF.yudarrisu, imperative: IJLIS }), verbKarte('206', VF.akrama, 'ehren', { present: VF.yukrimu, imperative: IJLIS, masdar: VF.ikram + UN }),
    verbKarte('207', VF.arsala, 'senden', { masdar: VF.risala + UN }), verbKarte('208', VF.inkasara, 'zerbrechen', { present: VF.yankasiru, imperative: IJLIS }),
    verbKarte('209', VF.ajlasa, 'setzen lassen'), verbKarte('210', VF.bana, 'bauen', { present: VF.yabni, imperative: IJLIS }),
    verbKarte('211', VF.qala, 'sagen', { present: VF.yaqulu, imperative: IJLIS }), verbKarte('212', VF.darasa, 'lernen', { present: VF.yadrusu, imperative: IJLIS }),
    verbKarte('213', VF.rakiba, 'reiten', { present: VF.yarkabu, imperative: IJLIS }), verbKarte('214', VF.malaka, 'besitzen'),
    verbKarte('215', VF.madda, 'ausstrecken', { present: VF.yamuddu, imperative: IJLIS }), verbKarte('216', VF.hamala, 'tragen'),
  ],
  // nur Karte 216 hat einen Eintrag im Wörterbuch (ohne Gegenwart): von dort kommt ihre englische Bedeutung
  woerterbuch: [verb(VF.hamalaNackt, VF.hamala, 'carry')], englischDeutsch: [{ w: 'carry', pos: 'verb', k: [{ sinn: 'Probe', de: ['tragen'] }] }],
  bama: [
    ';--- ktb', ';; katab-u_1', 'ktb\tkatab\tPV\twrite', 'ktb\tkotub\tIV\twrite', 'ktb\tkotab\tIV_Pass_yu\tbe written',
    ';--- jls', ';; jalas-i_1', 'jls\tjalas\tPV\tsit', 'jls\tjolis\tIV\tsit', ';; >ajolas_1', '>jls\t>ajolas\tPV\tseat', 'jls\tjolis\tIV\tseat',
    ';--- ftH', ';; fataH-au_1', 'ftH\tfataH\tPV\topen', 'ftH\tfotuH\tIV\topen', 'ftH\tfotaH\tIV\topen',
    ';--- skn', ';; sakan-u_1', 'skn\tsakan\tPV\tdwell', 'skn\tsokun\tIV\tdwell',
    ';--- drs', ';; dar~as_1', 'drs\tdar~as\tPV\tteach', 'drs\tdar~is\tIV_yu\tteach', ';; tadoriys_1', 'tdrys\ttadoriys\tNduAt\tteaching', ';; daras-u_1', 'drs\tdaras\tPV\tstudy', 'drs\tdorus\tIV\tstudy',
    ';--- krm', ';; >akoram_1', '>krm\t>akoram\tPV\thonor', 'krm\tkorim\tIV_yu\thonor',
    ';--- rsl', ';; >arosal_1', '>rsl\t>arosal\tPV\tsend', 'rsl\trosil\tIV_yu\tsend',
    ';--- ksr', ';; {inokasar_1', '<nksr\t{inokasar\tPV_intr\tbe broken', 'nksr\tnokasir\tIV_intr\tbe broken',
    ';--- nks', ';; {inokisAr_1', 'AnksAr\t{inokisAr\tN/At\tbreaking',
    ';--- bny', ';; banaY-i_1', 'bnY\tbanaY\tPV_0\tbuild', 'bny\tboniy\tIV_0hAnn\tbuild', 'bn\tbon\tIV_0hwnyn\tbuild',
    ';--- qwl', ';; qAl-u_1', 'qAl\tqAl\tPV_V\tsay', 'ql\tqul\tPV_C\tsay', 'qwl\tquwl\tIV_V\tsay', 'ql\tqul\tIV_C\tsay',
    ';--- rkb', ';; rakib-a_1', 'rkb\trakib\tPV\tride', 'rkb\trokab\tIV\tride',
    ';--- mlk', ';; malak-i_1', 'mlk\tmalak\tPV\town', 'mlk\tmolik\tIV\town', ';; malak-u_1', 'mlk\tmalak\tPV\trule', 'mlk\tmoluk\tIV\trule',
    ';--- Hml', ';; Hamal-u_1', 'Hml\tHamal\tPV\tattack', 'Hml\tHomul\tIV\tattack', ';; Hamal-i_1', 'Hml\tHamal\tPV\tcarry', 'Hml\tHomil\tIV\tcarry',
    ';--- mdd', ';; mad~-u_1', 'md\tmad~\tPV_V\textend', 'mdd\tmadad\tPV_C\textend', 'md\tmud~\tIV_V\textend', 'mdd\tmodud\tIV_C\textend',
  ],
};
const vH = (w, de) => vonHand(w, 'verb', de);
const wvf = probe({
  201: vH(S3.kataba, 'schreiben'), 202: vH(V.jalasa, 'sitzen'), 203: vH(V.fataha, 'öffnen'), 204: vH(W.sakana, 'wohnen'), 205: vH(VF.darrasa, 'lehren'), 206: vH(VF.akrama, 'ehren'),
  207: vH(VF.arsala, 'senden'), 208: vH(VF.inkasara, 'zerbrechen'), 209: vH(VF.ajlasa, 'setzen lassen'), 210: vH(VF.bana, 'bauen'), 211: vH(VF.qala, 'sagen'),
  212: { ...vH(VF.darasa, 'lernen'), leer: ['present'] },
  213: { ...vH(VF.rakiba, 'reiten'), felder: { ...vH(VF.rakiba, 'reiten').felder, present: { w: VF.yarkubu, wo: 'Probe: Stammliste', q: 'bama' } } },
  214: vH(VF.malaka, 'besitzen'), 215: vH(VF.madda, 'ausstrecken'),
}, WELT14);
const vfB = (id, f) => feldBeleg(wvf, id, f);
const zeigV = id => 'Karte ' + id + ': Gegenwart ' + JSON.stringify(feldAuf(wvf, id, 'present')) + ' · Befehl ' + JSON.stringify(feldAuf(wvf, id, 'imperative')) + ' · Verbalsubstantiv ' + JSON.stringify(feldAuf(wvf, id, 'masdar')) + ' · ' + JSON.stringify([vfB(id, 'present').q, vfB(id, 'imperative').q, vfB(id, 'masdar').q]) + ' · ' + String(vfB(id, 'present').wo || vfB(id, 'masdar').wo || '').slice(0, 260);
const vfZeile = () => (wvf.text.split('\n').find(z => /Verbformen aus Buckwalters Stammliste/.test(z)) || '(keine Zeile)').slice(0, 520);
const vfIst = (id, f, wert, q) => feldAuf(wvf, id, f) === wert && vfB(id, f).q === q;
pruefe('Verbformen aus der Stammliste: die Probe läuft durch, alle sechzehn Plätze sind belegt', wvf.codeZ === 0 && wvf.codeB === 0 && wvf.karten.length === 16, 'Exit ' + wvf.codeZ + ' / ' + wvf.codeB + ', Karten ' + wvf.karten.map(k => k.id).join(',') + ': ' + wvf.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Verbformen: die Gegenwart ist Vorsilbe + Stamm der Liste + Endung — im Beleg Lemma, Zeile, Kategorie, und dass Claude es zusammengesetzt hat', vfIst('201', 'present', YAKTUBU, 'bama-gegenwart') && /Lemma „katab-u_1“ \(englisch „write“\): Zeile „kotub“ der Kategorie IV — der Stamm der Gegenwart; Vorsilbe ya- nach der Kategorie, Endung -u/.test(vfB('201', 'present').wo || '') && /Zusammengesetzt hat es Claude/.test(vfB('201', 'present').wo || ''), zeigV('201'));
pruefe('Verbformen: der Befehl ist nach der Regel gebildet (Verbindungs-Alif mit u, weil der Stammvokal u ist) — der Beleg sagt, dass es eine Regel ist und keine Quelle; das fremde Wort der bisherigen Karte steht nicht da', vfIst('201', 'imperative', G.uktub, 'bama-befehl') && /Nach der Regel der Grammatik aus dem Stamm der Gegenwart gebildet — eine Regel von Claude, keine Angabe einer Quelle/.test(vfB('201', 'imperative').wo || ''), zeigV('201'));
pruefe('Verbformen: die Grundform hat kein Muster für das Verbalsubstantiv — das Feld bleibt offen', feldAuf(wvf, '201', 'masdar') === null && feldAuf(wvf, '211', 'masdar') === null, zeigV('201'));
pruefe('Verbformen: nennt die bisherige Karte eine Gegenwart mit anderem Vokal als die Liste, bleibt das Feld offen (Einspruch) — und der Bau zählt es', feldAuf(wvf, '202', 'present') === null && feldAuf(wvf, '202', 'imperative') === null && /offen gelassen: 1 Gegenwart \(keine Zeile der Liste gleicht der bisherigen Karte\)/.test(wvf.text), zeigV('202') + ' · ' + vfZeile());
pruefe('Verbformen: führt das Lemma zwei Gegenwartszeilen, gilt nur die, die der bisherigen Karte gleicht — der Beleg nennt den Schlüssel, und der Befehl stammt aus derselben Zeile', vfIst('203', 'present', G.yaftahu, 'bama-gegenwart') && /Zeile „fotaH“/.test(vfB('203', 'present').wo || '') && !/fotuH/.test(vfB('203', 'present').wo || '') && /Schlüssel und Einspruch, nie Quelle/.test(vfB('203', 'present').wo || '') && vfIst('203', 'imperative', IFTAH, 'bama-befehl'), zeigV('203'));
pruefe('Verbformen: führt die bisherige Karte eine Gegenwart, aber keinen Befehl, bleibt der Befehl offen — und der Bau zählt es', vfIst('204', 'present', G.yaskunu, 'bama-gegenwart') && feldAuf(wvf, '204', 'imperative') === null && /1 Befehl \(die bisherige Karte führt eine Gegenwart, aber keinen Befehl\)/.test(wvf.text), zeigV('204') + ' · ' + vfZeile());
pruefe('Verbformen: Kategorie …_yu gibt die Vorsilbe yu-, der Befehl einer Form II steht ohne Vorsatz', vfIst('205', 'present', VF.yudarrisu, 'bama-gegenwart') && /Vorsilbe yu- nach der Kategorie/.test(vfB('205', 'present').wo || '') && vfIst('205', 'imperative', VF.darris, 'bama-befehl'), zeigV('205'));
pruefe('Verbalsubstantiv: führt die Liste unter derselben Wurzel das Nomen mit dem Muster der Bauform, steht es da — der Beleg nennt Nomen, Verb und Muster, und dass die Liste beide nicht selbst verknüpft', vfIst('205', 'masdar', VF.tadris, 'bama-verbalsubstantiv') && /Nomen „tadoriys_1“ \(Kategorie NduAt, englisch „teaching“\) unter derselben Wurzel wie das Verb „dar~as_1“/.test(vfB('205', 'masdar').wo || '') && /Bauform \(II\)/.test(vfB('205', 'masdar').wo || '') && /verknüpft Verb und Verbalsubstantiv nicht selbst/.test(vfB('205', 'masdar').wo || ''), zeigV('205') + ' · ' + String(vfB('205', 'masdar').wo || '').slice(0, 300));
pruefe('Verbformen: der Befehl einer Form IV bekommt sein Hamza mit Fatha zurück', vfIst('206', 'present', VF.yukrimu, 'bama-gegenwart') && vfIst('206', 'imperative', VF.akrim, 'bama-befehl'), zeigV('206'));
pruefe('Verbalsubstantiv: führt die Liste das Nomen nicht, steht das Muster nur da, wo die bisherige Karte dasselbe Wort führt — Quelle „muster", der Beleg sagt, dass es eine Regel ist; ohne Schlussendung', vfIst('206', 'masdar', VF.ikram, 'muster') && /Nach dem Muster der Bauform \(IV\) aus der Vergangenheit gebildet — Regel der Grammatik, keine Angabe einer Quelle/.test(vfB('206', 'masdar').wo || '') && /Einspruch, nie Quelle/.test(vfB('206', 'masdar').wo || ''), zeigV('206') + ' · ' + String(vfB('206', 'masdar').wo || '').slice(0, 300));
pruefe('Verbalsubstantiv: führt die bisherige Karte ein anderes Wort als das Muster und die Liste das Nomen nicht, bleibt das Feld offen', feldAuf(wvf, '207', 'masdar') === null && vfIst('207', 'present', VF.yursilu, 'bama-gegenwart') && vfIst('207', 'imperative', VF.arsil, 'bama-befehl'), zeigV('207'));
pruefe('Verbformen: ein Stamm, der mit zwei Konsonanten beginnt, bekommt im Befehl das Verbindungs-Alif mit Kasra (Form VII)', vfIst('208', 'present', VF.yankasiru, 'bama-gegenwart') && vfIst('208', 'imperative', VF.inkasir, 'bama-befehl'), zeigV('208'));
pruefe('Verbalsubstantiv: steht das Nomen mit dem Muster unter einer ANDEREN Wurzel der Liste, gilt es nicht — das Feld bleibt offen', feldAuf(wvf, '208', 'masdar') === null, zeigV('208'));
pruefe('Verbformen: trägt die Zeile der Liste eine Kategorie, deren Vorsilbe nicht zur Bauform passt (Form IV ohne _yu), gibt es keine Gegenwart', feldAuf(wvf, '209', 'present') === null && feldAuf(wvf, '209', 'imperative') === null, zeigV('209'));
pruefe('Verbformen: schwacher Schluss — die Gegenwart steht ohne Endung da (der Beleg sagt es), der Befehl mit kurzem Vokal und Verbindungs-Alif', vfIst('210', 'present', VF.yabni, 'bama-gegenwart') && /keine Endung \(schwacher Schluss\)/.test(vfB('210', 'present').wo || '') && vfIst('210', 'imperative', VF.ibni, 'bama-befehl'), zeigV('210'));
pruefe('Verbformen: hohles Verb — die Gegenwart aus dem langen Stamm, der Befehl aus dem kurzen', vfIst('211', 'present', VF.yaqulu, 'bama-gegenwart') && vfIst('211', 'imperative', VF.qul, 'bama-befehl'), zeigV('211'));
pruefe('Verbformen: „leer" von Hand nimmt die Gegenwart heraus, und ohne Gegenwart gibt es keinen Befehl — der Bau nennt die Zahlen ohne diese Karte', feldAuf(wvf, '212', 'present') === null && feldAuf(wvf, '212', 'imperative') === null && /Gegenwart an 11 Verben, Befehl nach der Regel an 10, Verbalsubstantiv an 1 \(dazu nur nach dem Muster, wo die bisherige Karte dasselbe führt: 1\)/.test(wvf.text), zeigV('212') + ' · ' + vfZeile());
pruefe('Verbformen: hat die Karte schon eine Gegenwart aus ihrer Quelle und nennt die Liste eine andere, bleibt die Gegenwart der Quelle und es gibt keinen Befehl', feldAuf(wvf, '213', 'present') === VF.yarkubu && vfB('213', 'present').q === 'bama' && feldAuf(wvf, '213', 'imperative') === null, zeigV('213'));
pruefe('Verbformen: zwei gleich geschriebene Lemmata mit verschiedener Gegenwart und kein Schlüssel — das Feld bleibt offen, und der Bau zählt es', feldAuf(wvf, '214', 'present') === null && /1 Gegenwart \(gleich geschriebene Lemmata nennen Verschiedenes\)/.test(wvf.text), zeigV('214') + ' · ' + vfZeile());
pruefe('Verbformen: ein verdoppeltes Verb bekommt den Befehl in der zusammengezogenen Form', vfIst('215', 'present', VF.yamuddu, 'bama-gegenwart') && vfIst('215', 'imperative', VF.mudda, 'bama-befehl'), zeigV('215'));
pruefe('Verbformen: zwei gleich geschriebene Lemmata, kein Schlüssel, aber die Karte hat eine englische Bedeutung aus dem Wörterbuch — es gilt das Lemma, dessen Bedeutung ein Wort damit teilt (nicht das erste der Liste), und der Beleg sagt es', vfIst('216', 'present', VF.yahmilu, 'bama-gegenwart') && vfIst('216', 'imperative', VF.ihmil, 'bama-befehl') && /Lemma „Hamal-i_1“ \(englisch „carry“\)/.test(vfB('216', 'present').wo || '') && /Unter 2 gleich geschriebenen Lemmata das, dessen englische Bedeutung ein Wort mit der Bedeutung der Karte teilt/.test(vfB('216', 'present').wo || ''), zeigV('216') + ' · ' + String(vfB('216', 'present').wo || '').slice(0, 300));

// 18. Verbalsubstantiv aus Lanes Lexikon (13.10.2026, ersatz-lane.mjs --verben, laneVerbalsubstantive in
//     ersatz-bama-lib.mjs, verbalsubstantivAusLane in ersatz-bauen.mjs; Leser und Regel von Claude). Die bisherige Karte
//     ist Schlüssel und Einspruch, nie Quelle. Die Probe legt Wurzelseiten und Artikel ab, wie die echte Seite sie
//     druckt („aor." als Marke Present.T, „inf. n." als Marke Verbal.Noun); geholt wird nie etwas.
//     221  Lane nennt zwei Verbalsubstantive, die bisherige Karte führt das ZWEITE → genau das steht da
//     222  die bisherige Karte führt ein Wort, das Lane nicht nennt → Einspruch: offen, gezählt
//     223  die bisherige Karte führt keines → offen, gezählt („das erste, das Lane nennt" wäre geraten)
//     224  Stichwort mit angehängtem Fürwort; das Wort der Karte steht erst hinter einer Zwischenbemerkung, die auf
//          „and" endet → Fortsetzung der Aufzählung, der Beleg sagt es
//     225  das Wort der Karte steht hinter „instead of" → keine Fortsetzung: offen
//     226  das Wort der Karte steht nur hinter „quasi" → offen
//     227  das Wort der Karte gehört zu einem ANDEREN Stamm, der im Artikel genannt ist („; and <Stamm II>, inf. n. …") → offen
//     228  hinter „and" steht im Lauf das VERB selbst; es gliche in der Vergleichsform dem Wort der Karte → zählt nicht: offen
//     229  ein Eintrag aus einem früheren Lauf, aber die Vergangenheit der Karte ist nicht mehr sein Wort (die
//          Wurzelseite liegt nicht da, der Lauf kann nicht neu prüfen) → nicht eingetragen, gezählt
//     230  schwaches Verb: hinter „aor." steht die Gegenwart als Wort (sie ist nicht das Verb, dem die Angabe gilt);
//          Lane druckt Alif mit Madda vor Hamza und das Ya ohne Punkte → die Karte bekommt beide Wörter in heutiger
//          Rechtschreibung, mit dem Trennzeichen der bisherigen Karte
//     231  das Stichwort hat einen anderen Vokal, der Artikel nennt die Vergangenheit der Karte selbst → gilt, der Beleg sagt es
//     232  das Stichwort hat einen anderen Vokal, und der Artikel nennt die Vergangenheit der Karte nicht → kein Eintrag
//     233  das Feld ist von Hand leer gesetzt → bleibt leer, gezählt
const B = ausBW;
const wz18 = t => [...t].map(c => B(c)).join(' ');
const LW = w => `<span class="arabic-text arabic-font">${w}</span>`;
const AOR = v => '<span class="arabic-text-tense arabic-font">Present.T</span> ' + cp(0x0640) + B(v), INF = '<span class="arabic-text-tense arabic-font">Verbal.Noun</span>';
const FETT = t => `<span class="bold-black">${t}</span>`;
const laneArtikel = (stichwort, rumpf) => `<html><body><h2>Full Definition</h2>\n<div class="definition-content">\n<span class="display-word">${stichwort}</span><span class="itype circle-verb">I</span><entryFree id="x" key="x" type="main"> ${rumpf} </entryFree>\n</div>\n<h3>Related Words from the Same Root</h3></body></html>\n`;
const L18 = {
  jalasa: B('jalasa'), julus: B('juluwsN'), jals: B('jalosN'), fataha: B('fataHa'), fath: B('fatoHN'), kataba: B('kataba'), kitaba: B('kitaAbapN'),
  sakana: B('sakana'), sakanahu: B('sakanahu'), sukun: B('sukuwnN'), sakan: B('sakanN'), darasa: B('darasa'), dars: B('darosN'), dirasa: B('diraAsapN'),
  rasama: B('rasama'), rusum: B('rusuwmN'), rasm: B('rasomN'), kafara: B('kafara'), kaffarahu: B('kaf~arahu'), kufr: B('kuforN'), takfir: B('takofiyrN'),
  malaka: B('malaka'), mulk: B('mulokN'), malak: B('malakN'), nazala: B('nazala'), nazila: B('nazila'), nuzul: B('nuzuwlN'),
  bana: B('banaY'), yabni: B('yaboniY'), binaLane: B("bina|'N"), banyLane: B('banoYN'), bina: B("binaA'N"), bany: B('banoyN'),
  rakiba: B('rakiba'), rakaba: B('rakaba'), rukub: B('rukuwbN'), xaraja: B('xaraja'), xarija: B('xarija'), xuruj: B('xuruwjN'), dhahaba: B('*ahaba'), dhahab: B('*ahaAbN'),
};
const WELT15 = {
  karten: [
    verbKarte('221', L18.jalasa, 'sitzen', { root: wz18('jls'), masdar: L18.julus }), verbKarte('222', L18.fataha, 'öffnen', { root: wz18('ftH'), masdar: W.kitab + UN }),
    verbKarte('223', L18.kataba, 'schreiben', { root: wz18('ktb') }), verbKarte('224', L18.sakana, 'wohnen', { root: wz18('skn'), masdar: L18.sakan }),
    verbKarte('225', L18.darasa, 'lernen', { root: wz18('drs'), masdar: L18.dirasa }), verbKarte('226', L18.rasama, 'zeichnen', { root: wz18('rsm'), masdar: L18.rasm }),
    verbKarte('227', L18.kafara, 'leugnen', { root: wz18('kfr'), masdar: L18.takfir }), verbKarte('228', L18.malaka, 'besitzen', { root: wz18('mlk'), masdar: L18.malak }),
    verbKarte('229', L18.nazala, 'absteigen', { root: wz18('nzl'), masdar: L18.nuzul }), verbKarte('230', L18.bana, 'bauen', { root: wz18('bny'), masdar: L18.bina + ' / ' + L18.bany }),
    verbKarte('231', L18.rakiba, 'reiten', { root: wz18('rkb'), masdar: L18.rukub }), verbKarte('232', L18.xaraja, 'hinausgehen', { root: wz18('xrj'), masdar: L18.xuruj }),
    verbKarte('233', L18.dhahaba, 'gehen', { root: wz18('*hb'), masdar: L18.dhahab }),
  ],
  woerterbuch: [], englischDeutsch: [],
  laneSeiten: {
    jls: [['n221', L18.jalasa + ' Form 1']], ftH: [['n222', L18.fataha + ' Form 1']], ktb: [['n223', L18.kataba + ' Form 1']], skn: [['n224', L18.sakanahu + ' Form 1']],
    drs: [['n225', L18.darasa + ' Form 1']], rsm: [['n226', L18.rasama + ' Form 1']], kfr: [['n227', L18.kafara + ' Form 1']], mlk: [['n228', L18.malaka + ' Form 1']],
    bnY: [['n230', L18.bana + ' Form 1']], rkb: [['n231', L18.rakaba + ' Form 1']], xrj: [['n232', L18.xarija + ' Form 1']], '*hb': [['n233', L18.dhahaba + ' Form 1']],
  },
  laneArtikel: {
    n221: laneArtikel(L18.jalasa, `, ${AOR('i')} ${INF} ${LW(L18.jals)} and ${LW(L18.julus)}, ${FETT('He sat.')}`),
    n222: laneArtikel(L18.fataha, `, ${AOR('a')} ${INF} ${LW(L18.fath)}, ${FETT('He opened it.')}`),
    n223: laneArtikel(L18.kataba, `, ${AOR('u')} ${INF} ${LW(L18.kitaba)}, ${FETT('He wrote.')}`),
    n224: laneArtikel(L18.sakanahu, `, ${AOR('u')} ${INF} ${LW(L18.sukun)}, or this is a simple subst., and ${LW(L18.sakan)}, ${FETT('He dwelt in it.')}`),
    n225: laneArtikel(L18.darasa, `, ${AOR('u')} ${INF} ${LW(L18.dars)}, instead of ${LW(L18.dirasa)}, ${FETT('He studied.')}`),
    n226: laneArtikel(L18.rasama, `, ${AOR('u')} ${INF} ${LW(L18.rusum)}, and quasi ${INF} ${LW(L18.rasm)}, ${FETT('He drew.')}`),
    n227: laneArtikel(L18.kafara, `, ${AOR('u')} ${INF} ${LW(L18.kufr)}; and ${LW(L18.kaffarahu)}, ${INF} ${LW(L18.takfir)}, ${FETT('He covered it.')}`),
    n228: laneArtikel(L18.malaka, `, ${AOR('i')} ${INF} ${LW(L18.mulk)} and ${LW(L18.malaka)}, ${FETT('He possessed it.')}`),
    n230: laneArtikel(L18.bana, `, <span class="arabic-text-tense arabic-font">Present.T</span> ${LW(L18.yabni)}, ${INF} ${LW(L18.binaLane)} and ${LW(L18.banyLane)}, ${FETT('He built.')}`),
    n231: laneArtikel(L18.rakaba, `, and ${LW(L18.rakiba)}, ${AOR('a')} ${INF} ${LW(L18.rukub)}, ${FETT('He rode.')}`),
    n232: laneArtikel(L18.xarija, `, ${AOR('a')} ${INF} ${LW(L18.xuruj)}, ${FETT('He went out.')}`),
    n233: laneArtikel(L18.dhahaba, `, ${AOR('a')} ${INF} ${LW(L18.dhahab)}, ${FETT('He went.')}`),
  },
  laneVerben: { 229: { ar: L18.nazila, bw: 'nzl', nr: 'n229', form: 1, stichwort: L18.nazila, wie: 'gleich', verbalsubstantive: [L18.nuzul], fortsetzung: [], abgelegt: '2026-10-13' } },
  laneVerbenlauf: true,
};
const w18 = probe({
  221: vH(L18.jalasa, 'sitzen'), 222: vH(L18.fataha, 'öffnen'), 223: vH(L18.kataba, 'schreiben'), 224: vH(L18.sakana, 'wohnen'), 225: vH(L18.darasa, 'lernen'), 226: vH(L18.rasama, 'zeichnen'),
  227: vH(L18.kafara, 'leugnen'), 228: vH(L18.malaka, 'besitzen'), 229: vH(L18.nazala, 'absteigen'), 230: vH(L18.bana, 'bauen'), 231: vH(L18.rakiba, 'reiten'), 232: vH(L18.xaraja, 'hinausgehen'),
  233: { ...vH(L18.dhahaba, 'gehen'), leer: ['masdar'] },
}, WELT15);
const m18 = id => feldAuf(w18, id, 'masdar'), b18 = id => feldBeleg(w18, id, 'masdar');
const zeig18 = id => 'Karte ' + id + ': Verbalsubstantiv ' + JSON.stringify(m18(id)) + ' (' + (b18(id).q || '—') + ') · Eintrag ' + JSON.stringify(w18.laneVerben[id] || null).slice(0, 260);
const zeile18 = () => (w18.text.split('\n').find(z => /Verbalsubstantiv aus Lanes Lexikon/.test(z)) || '(keine Zeile)').slice(0, 640);
pruefe('Verbalsubstantiv aus Lane: die Probe läuft durch (Zuordner, Bau, Lauf --verben, Bau), alle dreizehn Plätze sind belegt, geholt wird nichts', w18.codeZ === 0 && w18.codeB === 0 && w18.codeV === 0 && w18.karten.length === 13 && /neu geholte Seiten: 0 \(ohne --holen/.test(w18.verbenText), 'Exit ' + w18.codeZ + ' / ' + w18.codeB + ' / ' + w18.codeV + ', Karten ' + w18.karten.length + ' · ' + w18.verbenText.trim().split('\n')[0].slice(0, 300) + ' · ' + w18.text.trim().split('\n').slice(-2).join(' | ').slice(0, 300));
pruefe('Verbalsubstantiv aus Lane: nennt Lane zwei, steht das da, das die bisherige Karte führt (nicht das erste) — Quelle „lane", der Beleg nennt Artikel, Stamm, Wurzel, „unmittelbar hinter inf. n." und dass die bisherige Karte nur Schlüssel und Einspruch ist', m18('221') === L18.julus && b18('221').q === 'lane' && /im Artikel des Verbstamms „.+“ \(n221, Stamm 1\) unter der Wurzel/.test(b18('221').wo || '') && /unmittelbar hinter „inf\. n\.“/.test(b18('221').wo) && /Lane nennt dort 2 Verbalsubstantive; genommen ist, was auch die bisherige Karte führt \(sie ist nur Schlüssel und Einspruch\)/.test(b18('221').wo), zeig18('221') + ' · ' + String(b18('221').wo || '').slice(0, 300));
pruefe('Verbalsubstantiv aus Lane: führt die bisherige Karte ein Wort, das Lane nicht nennt, bleibt das Feld offen (Einspruch)', m18('222') === null && !!w18.laneVerben['222'], zeig18('222'));
pruefe('Verbalsubstantiv aus Lane: führt die bisherige Karte keines, bleibt das Feld offen — „das erste, das Lane nennt" wird nicht genommen', m18('223') === null && !!w18.laneVerben['223'], zeig18('223'));
pruefe('Verbalsubstantiv aus Lane: das Wort hinter einer Zwischenbemerkung, die auf „and" endet, ist die Fortsetzung der Aufzählung — es gilt, und der Beleg sagt „nach einer Zwischenbemerkung"; das Stichwort mit angehängtem Fürwort ist derselbe Stamm', m18('224') === L18.sakan && b18('224').q === 'lane' && /in der Aufzählung hinter „inf\. n\.“ \(Verbalsubstantiv\), nach einer Zwischenbemerkung Lanes/.test(b18('224').wo || '') && /Lane druckt das Stichwort mit angehängtem Fürwort/.test(b18('224').wo), zeig18('224') + ' · ' + String(b18('224').wo || '').slice(0, 300));
pruefe('Verbalsubstantiv aus Lane: ein Wort hinter „instead of" ist keine Fortsetzung der Aufzählung — das Feld bleibt offen', m18('225') === null && JSON.stringify((w18.laneVerben['225'] || {}).fortsetzung) === '[]' && ((w18.laneVerben['225'] || {}).verbalsubstantive || []).length === 1, zeig18('225'));
pruefe('Verbalsubstantiv aus Lane: ein Wort hinter „quasi" (Lanes quasi-inf. n.) zählt nicht — das Feld bleibt offen', m18('226') === null && ((w18.laneVerben['226'] || {}).verbalsubstantive || []).length === 1, zeig18('226'));
pruefe('Verbalsubstantiv aus Lane: eine Angabe, die einem ANDEREN Stamm im selben Artikel gilt, zählt nicht — das Feld bleibt offen', m18('227') === null && ((w18.laneVerben['227'] || {}).verbalsubstantive || []).length === 1, zeig18('227'));
pruefe('Verbalsubstantiv aus Lane: ein VERB im Lauf zählt nicht, auch wenn es in der Vergleichsform dem Wort der bisherigen Karte gleicht — das Feld bleibt offen', m18('228') === null && ((w18.laneVerben['228'] || {}).verbalsubstantive || []).length === 1, zeig18('228'));
pruefe('Verbalsubstantiv aus Lane: ein Eintrag, dessen Wort nicht mehr die Vergangenheit der Karte ist, wird nicht eingetragen (der Lauf konnte nicht neu prüfen und lässt ihn stehen)', m18('229') === null && !!w18.laneVerben['229'] && /"nichtGeprueft":1/.test(w18.verbenText), zeig18('229') + ' · ' + w18.verbenText.trim().split('\n')[0].slice(0, 200));
pruefe('Verbalsubstantiv aus Lane: die Gegenwart hinter „aor." ist nicht das Verb, dem die Angabe gilt; Alif mit Madda vor Hamza und das Ya ohne Punkte stehen auf der Karte in heutiger Rechtschreibung, beide Wörter mit dem Trennzeichen der bisherigen Karte', m18('230') === L18.bina + ' / ' + L18.bany && b18('230').q === 'lane' && /jedes dieser Wörter unmittelbar hinter „inf\. n\.“/.test(b18('230').wo || '') && /Geschrieben in heutiger Rechtschreibung/.test(b18('230').wo), zeig18('230'));
pruefe('Verbalsubstantiv aus Lane: hat das Stichwort einen anderen Vokal, gilt der Artikel nur, wenn er die Vergangenheit der Karte selbst nennt — der Beleg sagt es', m18('231') === L18.rukub && /das Stichwort hat andere oder keine Vokalzeichen, der Artikel nennt die Vergangenheit der Karte selbst/.test(b18('231').wo || '') && m18('232') === null && !w18.laneVerben['232'] && /"andereVokale":1/.test(w18.verbenText), zeig18('231') + ' · ' + zeig18('232') + ' · ' + w18.verbenText.trim().split('\n')[0].slice(0, 200));
pruefe('Verbalsubstantiv aus Lane: ein Feld, das von Hand leer gesetzt ist, bleibt leer — und der Bau nennt alle Zahlen', m18('233') === null && /4 eingetragen \(davon 1 aus der Fortsetzung der Aufzählung hinter einer Zwischenbemerkung\) · offen gelassen: 1, weil das Feld von Hand leer gesetzt ist, 5, weil Lane keines der Wörter der bisherigen Karte nennt, 1, weil die bisherige Karte keines führt, 1, weil die Vergangenheit der Karte nicht mehr das Wort des Eintrags ist · 0 übergangen, weil eine andere Quelle es nennt \(von 12 Einträgen/.test(w18.text), zeig18('233') + ' · ' + zeile18());

// 19. Schlussvokal der Vergangenheit (13.10.2026, schlussFatha in ersatz-bauen.mjs, Regel von Claude): druckt die Quelle
//     ein Verb ohne Schlussendung (so arabdict), wird das Fatha am Ende ergänzt und im Beleg genannt — an `ar` und `past`.
//     241  Verb ohne Schlussvokal, die bisherige Karte endet auf Fatha → ergänzt, der Beleg sagt es
//     242  das Wort endet auf Alif → bleibt
//     243  die bisherige Karte trägt dort einen ANDEREN Vokal → Einspruch, das Wort der Quelle bleibt
//     244  das Wort hat seinen Schlussvokal schon → bleibt, der Beleg nennt nichts
//     245  verdoppelter Schlussbuchstabe (Schadda) ohne Vokal → Fatha, in der Reihenfolge von NFC
//     246  ein Nomen ohne Schlussvokal → bleibt, die Regel gilt nur für Verben
const KATAB19 = cp(KAF, FATHA, TA, FATHA, BA), DANA19 = cp(DAL, FATHA, NUN, FATHA, ALIF), DARAS19 = cp(DAL, FATHA, RA, FATHA, SIN);
const SADD19 = cp(SIN, FATHA, DAL, SHADDA), SADDA19 = cp(SIN, FATHA, DAL, FATHA, SHADDA);
const mitPast19 = (w, de) => { const h = vonHand(w, 'verb', de); return { ...h, felder: { ...h.felder, past: { w, wo: 'Probe: Wörterbuch ohne Schlussendung', q: 'arabdict' } } }; };
const WELT19 = {
  karten: [
    { id: '241', ar: KATAB19 + cp(FATHA), de: 'schreiben', type: 'verb', chapter: 1, ...leer, past: KATAB19 + cp(FATHA) },
    { id: '242', ar: DANA19, de: 'sich nähern', type: 'verb', chapter: 1, ...leer, past: DANA19 },
    { id: '243', ar: DARAS19 + cp(DAMMA), de: 'lernen', type: 'verb', chapter: 1, ...leer, past: DARAS19 + cp(DAMMA) },
    { id: '244', ar: W.sakana, de: 'wohnen', type: 'verb', chapter: 2, ...leer, past: W.sakana },
    { id: '245', ar: SADDA19, de: 'verschließen', type: 'verb', chapter: 2, ...leer, past: SADDA19 },
    { id: '246', ar: KATAB19, de: 'Schrift', type: 'noun', chapter: 2, ...leer, sg: KATAB19 },
  ],
  woerterbuch: [], englischDeutsch: [],
};
const w19 = probe({ 241: mitPast19(KATAB19, 'schreiben'), 242: mitPast19(DANA19, 'sich nähern'), 243: mitPast19(DARAS19, 'lernen'),
  244: mitPast19(W.sakana, 'wohnen'), 245: mitPast19(SADD19, 'verschließen'), 246: vonHand(KATAB19, 'noun', 'Schrift') }, WELT19);
const nf19 = t => String(t ?? '').normalize('NFC');
const hex19 = t => [...nf19(t)].map(c => c.codePointAt(0).toString(16)).join(' ');
const zeig19 = id => 'Karte ' + id + ': ar [' + hex19(feldAuf(w19, id, 'ar')) + '] · past [' + hex19(feldAuf(w19, id, 'past')) + '] · Beleg ar: …' + String(feldBeleg(w19, id, 'ar').wo || '').slice(-90);
const zeile19 = (w19.text.split('\n').find(z => /Schlussvokal der Vergangenheit/.test(z)) || '(keine Zeile)').slice(0, 220);
pruefe('Schlussvokal: die Probe läuft durch, alle sechs Plätze sind belegt', w19.codeZ === 0 && w19.codeB === 0 && w19.karten.length === 6, 'Exit ' + w19.codeZ + ' / ' + w19.codeB + ', Karten ' + w19.karten.map(k => k.id).join(',') + ': ' + w19.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Schlussvokal: fehlt dem Verb der Quelle der Schlussvokal, steht an `ar` und an `past` ein Fatha — der Beleg sagt, dass es ergänzt ist und die Regel der Grammatik, keine Angabe der Quelle',
  nf19(feldAuf(w19, '241', 'ar')) === nf19(KATAB19 + cp(FATHA)) && nf19(feldAuf(w19, '241', 'past')) === nf19(KATAB19 + cp(FATHA))
  && /Das Fatha am Ende ist ergänzt.*Regel der Grammatik, keine Angabe der Quelle/.test(feldBeleg(w19, '241', 'ar').wo || '') && /Das Fatha am Ende ist ergänzt/.test(feldBeleg(w19, '241', 'past').wo || ''), zeig19('241'));
pruefe('Schlussvokal: endet das Wort auf Alif, bleibt es, wie die Quelle es druckt', nf19(feldAuf(w19, '242', 'ar')) === nf19(DANA19) && nf19(feldAuf(w19, '242', 'past')) === nf19(DANA19) && !/ergänzt/.test(feldBeleg(w19, '242', 'ar').wo || ''), zeig19('242'));
pruefe('Schlussvokal: trägt die bisherige Karte dort einen anderen Vokal, bleibt das Wort der Quelle — sie ist der Einspruch, nicht die Quelle', nf19(feldAuf(w19, '243', 'ar')) === nf19(DARAS19) && nf19(feldAuf(w19, '243', 'past')) === nf19(DARAS19) && !/ergänzt/.test(feldBeleg(w19, '243', 'ar').wo || ''), zeig19('243'));
pruefe('Schlussvokal: hat das Wort seinen Schlussvokal, bleibt es, und der Beleg nennt keine Ergänzung', nf19(feldAuf(w19, '244', 'ar')) === nf19(W.sakana) && !/ergänzt/.test(feldBeleg(w19, '244', 'ar').wo || ''), zeig19('244'));
pruefe('Schlussvokal: nach einem verdoppelten Buchstaben steht das Fatha dort, wo NFC es hinstellt (vor dem Schadda)', nf19(feldAuf(w19, '245', 'ar')) === nf19(SADDA19) && nf19(feldAuf(w19, '245', 'past')) === nf19(SADDA19), zeig19('245'));
pruefe('Schlussvokal: ein Nomen ohne Schlussvokal bekommt keinen — die Regel gilt nur für Verben', nf19(feldAuf(w19, '246', 'ar')) === nf19(KATAB19) && !/ergänzt/.test(feldBeleg(w19, '246', 'ar').wo || ''), zeig19('246'));
pruefe('Schlussvokal: der Bau nennt beide Zahlen (4 Felder ergänzt, 2 wegen der bisherigen Karte offen gelassen)', /Fatha ergänzt an 4 Feldern · 2 offen gelassen/.test(zeile19), zeile19);

// 20. Gegenwart und Befehl nach dem Muster der Bauform (13.10.2026, formenNachMuster in ersatz-bauen.mjs, Regel von
//     Claude): bei einem abgeleiteten Verb mit starken Wurzelbuchstaben stehen beide mit der Vergangenheit fest — nur als
//     Lücke, und nur, wenn die bisherige Karte dieselbe Form führt (Schlüssel und Einspruch, nie die Quelle).
//     261  Bauform X, die bisherige Karte führt beide Formen so → beide eingetragen, der Beleg nennt Bauform und Regel
//     262  Bauform V, die bisherige Karte führt eine ANDERE Gegenwart → Gegenwart offen (Einspruch), der Befehl steht
//     263  ein Wurzelbuchstabe ist schwach (Waw) → kein Muster, nichts eingetragen
//     264  die bisherige Karte führt keine der Formen → nichts eingetragen, als „ohne Schlüssel" gezählt
//     265  „leer" von Hand sperrt die Gegenwart → nur der Befehl
//     266  Grundform (kein abgeleitetes Verb) → nichts
const P20 = {
  x: cp(ALIF, KASRA, SIN, SUKUN, TA, FATHA, QAF, SUKUN, DAL, FATHA, MIM, FATHA),
  xGw: cp(YA, FATHA, SIN, SUKUN, TA, FATHA, QAF, SUKUN, DAL, KASRA, MIM, DAMMA), xBf: cp(ALIF, KASRA, SIN, SUKUN, TA, FATHA, QAF, SUKUN, DAL, KASRA, MIM, SUKUN),
  v: cp(TA, FATHA, KAF, FATHA, LAM, FATHA, SHADDA, MIM, FATHA),
  vGwFalsch: cp(YA, FATHA, TA, FATHA, KAF, FATHA, LAM, KASRA, SHADDA, MIM, DAMMA), vBf: cp(TA, FATHA, KAF, FATHA, LAM, FATHA, SHADDA, MIM, SUKUN),
  w: cp(ALIF, KASRA, SIN, SUKUN, TA, FATHA, WAW, SUKUN, RA, FATHA, DAL, FATHA),
  wGw: cp(YA, FATHA, SIN, SUKUN, TA, FATHA, WAW, SUKUN, RA, KASRA, DAL, DAMMA), wBf: cp(ALIF, KASRA, SIN, SUKUN, TA, FATHA, WAW, SUKUN, RA, KASRA, DAL, SUKUN),
  uktub: cp(ALIF, DAMMA, KAF, SUKUN, TA, DAMMA, BA, SUKUN),
};
const WELT20 = {
  karten: [
    { id: '261', ar: P20.x, de: 'vorladen', type: 'verb', chapter: 1, ...leer, past: P20.x, present: P20.xGw, imperative: P20.xBf },
    { id: '262', ar: P20.v, de: 'sprechen', type: 'verb', chapter: 1, ...leer, past: P20.v, present: P20.vGwFalsch, imperative: P20.vBf },
    { id: '263', ar: P20.w, de: 'einführen', type: 'verb', chapter: 1, ...leer, past: P20.w, present: P20.wGw, imperative: P20.wBf },
    { id: '264', ar: P20.x, de: 'herbeirufen', type: 'verb', chapter: 2, ...leer, past: P20.x },
    { id: '265', ar: P20.x, de: 'kommen lassen', type: 'verb', chapter: 2, ...leer, past: P20.x, present: P20.xGw, imperative: P20.xBf },
    { id: '266', ar: KATAB19 + cp(FATHA), de: 'schreiben', type: 'verb', chapter: 2, ...leer, past: KATAB19 + cp(FATHA), present: YAKTUBU, imperative: P20.uktub },
  ],
  woerterbuch: [], englischDeutsch: [],
};
const w20 = probe({ 261: mitPast19(P20.x, 'vorladen'), 262: mitPast19(P20.v, 'sprechen'), 263: mitPast19(P20.w, 'einführen'), 264: mitPast19(P20.x, 'herbeirufen'),
  265: { ...mitPast19(P20.x, 'kommen lassen'), leer: ['present'] }, 266: mitPast19(KATAB19 + cp(FATHA), 'schreiben') }, WELT20);
const f20 = (id, feld) => feldAuf(w20, id, feld) == null ? null : nf19(feldAuf(w20, id, feld));
const zeig20 = id => 'Karte ' + id + ': Gegenwart [' + hex19(feldAuf(w20, id, 'present')) + '] (' + (feldBeleg(w20, id, 'present').q || '—') + ') · Befehl [' + hex19(feldAuf(w20, id, 'imperative')) + '] (' + (feldBeleg(w20, id, 'imperative').q || '—') + ')';
const zeile20 = (w20.text.split('\n').find(z => /Formen nach dem Muster der Bauform/.test(z)) || '(keine Zeile)').slice(0, 260);
pruefe('Muster der Bauform: die Probe läuft durch, alle sechs Plätze sind belegt', w20.codeZ === 0 && w20.codeB === 0 && w20.karten.length === 6, 'Exit ' + w20.codeZ + ' / ' + w20.codeB + ', Karten ' + w20.karten.map(k => k.id).join(',') + ': ' + w20.text.trim().split('\n').slice(-3).join(' | ').slice(0, 400));
pruefe('Muster der Bauform: führt die bisherige Karte beide Formen so, stehen Gegenwart und Befehl da — der Beleg nennt die Bauform und sagt, dass es die Regel der Grammatik ist und die bisherige Karte nur Schlüssel',
  f20('261', 'present') === nf19(P20.xGw) && f20('261', 'imperative') === nf19(P20.xBf) && feldBeleg(w20, '261', 'present').q === 'muster'
  && /Muster der Bauform \(X\).*Regel der Grammatik, keine Angabe einer Quelle.*Schlüssel und Einspruch, nicht die Quelle/.test(feldBeleg(w20, '261', 'present').wo || ''), zeig20('261') + ' · ' + String(feldBeleg(w20, '261', 'present').wo || '').slice(0, 120));
pruefe('Muster der Bauform: führt die bisherige Karte eine andere Gegenwart, bleibt die Gegenwart offen — der Befehl, den sie gleich führt, steht da', f20('262', 'present') === null && f20('262', 'imperative') === nf19(P20.vBf) && feldBeleg(w20, '262', 'imperative').q === 'muster', zeig20('262'));
pruefe('Muster der Bauform: ist ein Wurzelbuchstabe schwach (Waw), entsteht nichts — auch wenn die bisherige Karte die Formen führt', f20('263', 'present') === null && f20('263', 'imperative') === null, zeig20('263'));
pruefe('Muster der Bauform: führt die bisherige Karte keine der Formen, entsteht nichts', f20('264', 'present') === null && f20('264', 'imperative') === null, zeig20('264'));
pruefe('Muster der Bauform: „leer" von Hand sperrt die Gegenwart, der Befehl steht trotzdem da', f20('265', 'present') === null && f20('265', 'imperative') === nf19(P20.xBf), zeig20('265'));
pruefe('Muster der Bauform: ein Verb der Grundform bekommt nichts — die Regel gilt nur für abgeleitete Verben', f20('266', 'present') === null && f20('266', 'imperative') === null, zeig20('266'));
pruefe('Muster der Bauform: der Bau nennt alle vier Zahlen (Gegenwart 1, Befehl 3, 1 Einspruch, 2 ohne Schlüssel)', /Gegenwart an 1, Befehl an 3 Verben · 1 offen gelassen[^·]*· 2 ohne Schlüssel/.test(zeile20), zeile20);

const gut = faelle.filter(f => f.ok).length;
for (const f of faelle) if (!f.ok) console.log(`  ✗ ${f.name}\n      bekommen: ${f.was}`);
console.log(`Eichung Zuordner und Bau: ${gut} von ${faelle.length} Fällen wie erwartet`);
process.exit(gut === faelle.length ? 0 : 1);
