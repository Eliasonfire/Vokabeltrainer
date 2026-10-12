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
 * Dazu kommen zwei weitere kleine Welten: neun Karten zur Regel „wie die Karte“ (Abschnitt 5) und drei Karten eines
 * Buches mit Schlüssel (Abschnitt 6: die Säuberung der Schlüsselzeilen und die Grenze der Regel am Schlüssel).
 *
 * Aufruf:  node werkzeuge/eiche-ersatz-zuordner.mjs      Exit 0 = jede Regel hält, Exit 1 = mindestens eine nicht
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  const umgebung = { ...process.env, ERSATZ_REPO: repo };
  const z = spawnSync(process.execPath, [path.join(HIER, 'ersatz-zuordnen.mjs')], { encoding: 'utf8', env: umgebung });
  const b = z.status === 0 ? spawnSync(process.execPath, [path.join(HIER, 'ersatz-bauen.mjs'), '--knapp'], { encoding: 'utf8', env: umgebung }) : { status: null, stdout: '', stderr: '' };
  const lies = (name, sonst) => { const d = path.join(repo, 'data-ersatz', name); try { return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : sonst; } catch { return sonst; } };
  const kartenDatei = path.join(repo, 'data-ersatz', 'vokabeln-' + ziel + '.js');
  let karten = [];
  if (fs.existsSync(kartenDatei)) { const m = fs.readFileSync(kartenDatei, 'utf8').match(/=\s*(\[[\s\S]*\])\s*;?\s*$/); if (m) karten = JSON.parse(m[1]); }
  const aus = { codeZ: z.status, codeB: b.status, text: (z.stdout || '') + (z.stderr || '') + (b.stdout || '') + (b.stderr || ''), belege: lies('belege-' + ziel + '.json', {}), nichtGefunden: lies('nicht-gefunden.json', []), karten };
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
pruefe('wie die Karte: ein Zusatz in Klammern, den nur die KARTE führt, steht in keiner Quelle → er kommt nicht herein (das entscheidet Elias)', deVon(w1, '26') === 'Stern', 'Karte 26: ' + deVon(w1, '26'));
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

const gut = faelle.filter(f => f.ok).length;
for (const f of faelle) if (!f.ok) console.log(`  ✗ ${f.name}\n      bekommen: ${f.was}`);
console.log(`Eichung Zuordner und Bau: ${gut} von ${faelle.length} Fällen wie erwartet`);
process.exit(gut === faelle.length ? 0 : 1);
