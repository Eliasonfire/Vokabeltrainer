#!/usr/bin/env node
/* pruefe-fachbegriffe-kette.mjs — finden und eintragen neuer Fachbegriffe, mit bekannten Antworten geprüft
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026:
 *   20:06:16 „das muss gefixt werden. eine routine dafür wäre doch gut oder was
 *             denkst du ? wie sollen wir das lösen"
 *   20:20:53 Auswahl: „Direkt eintragen (Recommended)"
 *
 * „Direkt eintragen" heißt: niemand sieht vorher hin. Deshalb muss hier stehen,
 * was die zwei Werkzeuge NIE durchlassen dürfen — und ein Störtest, der zeigt,
 * dass diese Prüfung an der echten Schutzstelle hängt.
 *
 *   A. EICHUNG: fachbegriffe-finden.mjs --ohne-bestand findet die zehn
 *      Fachbegriffe vom 17.08.2026 selbst wieder (bekannte Antwort).
 *   B. fachbegriffe-setzen.mjs weist ab: unvollständiges Taschkīl, eine
 *      Schreibung, die nicht in seinen Regeln steht, Dubletten (Fachbegriff und
 *      vocab-data.js), fehlenden type, eine Eselsbrücke mit unbelegtem Wort,
 *      eine falsche id. Und: alles oder nichts — ein fehlerhafter Eintrag
 *      verhindert auch den richtigen daneben.
 *   C. Ein richtiger Eintrag landet (auf einer KOPIE), die Datei lädt, keine
 *      .neu-Datei bleibt liegen.
 *   D. Jede „aufgenommen"-Entscheidung hat ihren Eintrag in data/fachbegriffe.js.
 *   E. STÖRTEST am echten Quelltext: ohne Taschkīl-Prüfung geht كَسْرة durch;
 *      ohne --ohne-bestand findet die Eichung nichts.
 *      [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FINDEN = path.join(REPO, 'werkzeuge', 'fachbegriffe-finden.mjs');
const SETZEN = path.join(REPO, 'werkzeuge', 'fachbegriffe-setzen.mjs');
const FACH = path.join(REPO, 'data', 'fachbegriffe.js');

let fehler = 0;
const pruefe = (b, t, gemessen) => { if (b) console.log('  ✓ ' + t); else { fehler++; console.log('  ✗ ' + t + (gemessen !== undefined ? '   gemessen: ' + String(gemessen).slice(0, 400) : '')); } };
const lauf = (datei, argumente) => { const r = spawnSync(process.execPath, [datei, ...argumente], { cwd: REPO, encoding: 'utf8', timeout: 120000 }); return { code: r.status, text: (r.stdout || '') + (r.stderr || '') }; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fach-kette-'));
const schreib = (name, inhalt) => { const p = path.join(tmp, name); fs.writeFileSync(p, typeof inhalt === 'string' ? inhalt : JSON.stringify(inhalt, null, 2), 'utf8'); return p; };
const hash = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const BEKANNT = ['مضاف', 'مجرور', 'مرفوع', 'نعت', 'اضافة', 'ظرف', 'شكل', 'اسم اشارة', 'تاء مربوطة', 'الف مقصورة'];
const gefunden = (text) => BEKANNT.filter(b => new RegExp('(🆕|\\[\\w+\\]) ' + b + '   ').test(text));

/* ================= A. Eichung ================= */
console.log('\n=== A. Eichung: die zehn Fachbegriffe vom 17.08.2026 ===');
{
  const r = lauf(FINDEN, ['--ohne-bestand', '--alle']);
  const g = gefunden(r.text);
  pruefe(g.length === 10, 'ohne den Bestand findet das Werkzeug alle zehn selbst wieder', g.length + ' von 10, fehlend: ' + BEKANNT.filter(b => !g.includes(b)).join(', '));
}

/* ================= B./C. Eintragen auf einer Kopie ================= */
console.log('\n=== B. fachbegriffe-setzen.mjs weist ab, was nie durchgehen darf ===');
const kopie = schreib('fachbegriffe.js', fs.readFileSync(FACH, 'utf8'));
const entsch = path.join(tmp, 'entscheidungen.json');
const GUT = { id: 'gram-nakira-test', ar: 'نَكِرَة', de: 'unbestimmtes Nomen', type: 'noun', regel: 'nakira-marifa-01',
  mnemo: 'Das Gegenteil von مَعْرِفَة: ein Wort wie بَيْتٌ ohne Artikel ist unbestimmt — mit Artikel wird daraus اَلْبَيْتُ.' };
const setzen = (auftrag, extra = []) => lauf(SETZEN, [schreib('auftrag-' + Math.random().toString(36).slice(2) + '.json', auftrag), '--ziel', kopie, '--entscheidungen', entsch, ...extra]);
/* ⚠️ Der erste Fall hieß anfangs تَنْوين. Seit gram-tanwin in der App steht,
   wurde er AUCH als Dublette abgewiesen — der Fall war grün, egal ob die
   Taschkīl-Prüfung lebt. Aufgedeckt hat es Störtest 1 unten. Deshalb jetzt
   كَسْرة: unvollständig, belegt, aber weder Fachbegriff noch Vokabel — die
   Taschkīl-Prüfung ist der EINZIGE Grund zur Abweisung.
   [[stoertest_muss_wirkung_nachweisen]] */
const UNVOLLSTAENDIG = { ...GUT, id: 'gram-t1', ar: 'كَسْرة', regel: 'hu-nach-kasra-01' };
const faelle = [
  ['unvollständiges Taschkīl (كَسْرة)', UNVOLLSTAENDIG, /Taschkīl unvollständig/],
  ['eine Schreibung, die so in keiner Regel steht (مُبْتَدِأ)', { ...GUT, id: 'gram-t2', ar: 'مُبْتَدِأ', regel: 'mubtada-khabar-01' }, /nicht belegt/],
  ['Dublette eines Fachbegriffs (مُضَاف)', { ...GUT, id: 'gram-t3', ar: 'مُضَاف', regel: 'mudaf-01' }, /schon Fachbegriff/],
  ['Dublette einer Vokabel aus vocab-data.js (حَرْفُ الْجَرِّ)', { ...GUT, id: 'gram-t4', ar: 'حَرْفُ الْجَرِّ', regel: 'harf-jarr-01' }, /vocab-data\.js/],
  ['fehlender type', { ...GUT, id: 'gram-t5', type: undefined }, /type fehlt/],
  ['Eselsbrücke mit unbelegtem Wort', { ...GUT, id: 'gram-t6', mnemo: 'Merk dir das mit بَيْتَكُمَاهُنَّ, das es in keiner Quelle gibt, und dann weiter.' }, /steht so nirgends/],
  ['falsche id', { ...GUT, id: 'nakira' }, /id muss/],
];
for (const [was, eintrag, grund] of faelle){
  const vorher = hash(kopie);
  const r = setzen({ aufnehmen: [eintrag] });
  pruefe(r.code === 1 && grund.test(r.text) && hash(kopie) === vorher, 'abgewiesen: ' + was, r.code + ' ' + r.text);
}
{
  const vorher = hash(kopie);
  const r = setzen({ aufnehmen: [GUT, { ...UNVOLLSTAENDIG, id: 'gram-t7' }] });
  pruefe(r.code === 1 && hash(kopie) === vorher && !fs.existsSync(entsch), 'alles oder nichts: ein fehlerhafter Eintrag verhindert auch den richtigen', r.code + ' ' + r.text);
}
/* ⛔⛔ BUCHTAUSCH — die bekannte Antwort vom 11.09.2026 (v470): مَنْصُوب und
   حَرْف wurden beim Start durch Buchvokabeln ersetzt. Geprüft auf einer Kopie
   OHNE die beiden, sonst wiese schon „ist schon Fachbegriff" ab und der Test
   hinge nicht am Tausch. */
console.log('\n=== B2. Buchtausch: was die App beim Start ersetzen würde ===');
const ohneBeideListe = new Function(fs.readFileSync(FACH, 'utf8') + '; return FACHBEGRIFF_VOKABELN;')().filter(f => f.id !== 'gram-mansub' && f.id !== 'gram-harf');
/* Die Kopie endet wie das Original auf `\n];` — daran setzt das Werkzeug an. */
const ohneBeide = schreib('fachbegriffe-ohne.js', 'const FACHBEGRIFF_VOKABELN = ' + JSON.stringify(ohneBeideListe, null, 2).replace(/\n\]$/, '\n];') + '\n');
const setzenOhne = (auftrag, extra = []) => lauf(SETZEN, [schreib('auftrag-b2-' + Math.random().toString(36).slice(2) + '.json', auftrag), '--ziel', ohneBeide, '--entscheidungen', path.join(tmp, 'e-b2.json'), '--pruefen', ...extra]);
const MANSUB = { id: 'gram-mansub-test', ar: 'مَنْصُوب', de: 'Akkusativ (Frage: wen oder was?)', type: 'noun', regel: 'irab-drei-faelle-01',
  mnemo: 'Die drei Fälle deines Lehrers am Endvokal: مَرْفُوع mit Damma, مَجْرُور mit Kasra, مَنْصُوب mit Fatha.' };
{
  let r = setzenOhne({ aufnehmen: [MANSUB] });
  pruefe(r.code === 1 && /Buchvokabel مَنْصُوبٌ/.test(r.text) && /50471/.test(r.text), 'مَنْصُوب ohne buchTausch: abgewiesen, mit der Buchvokabel 50471 genannt', r.code + ' ' + r.text);
  r = setzenOhne({ aufnehmen: [{ ...MANSUB, buchTausch: '50471' }] });
  pruefe(r.code === 0 && /Buchtausch bestätigt/.test(r.text), 'مَنْصُوب mit buchTausch "50471": angenommen', r.code + ' ' + r.text);
  r = setzenOhne({ aufnehmen: [{ ...MANSUB, id: 'gram-harf-test', ar: 'حَرْف', de: 'Partikel — eine der drei Wortarten (auch: Buchstabe)', regel: 'wortarten-01',
    mnemo: 'Dein Lehrer kennt nur drei Wortarten: اِسْم, فِعْل und حَرْف — und nichts sonst.' }] });
  pruefe(r.code === 1 && /45954/.test(r.text), 'حَرْف mit „(auch: Buchstabe)": abgewiesen — die Bedeutung hätte die Buchvokabel 45954 getroffen', r.code + ' ' + r.text);
  r = setzenOhne({ aufnehmen: [{ ...MANSUB, id: 'gram-harf-test', ar: 'حَرْف', de: 'Partikel — eine der drei Wortarten', regel: 'wortarten-01',
    mnemo: 'Dein Lehrer kennt nur drei Wortarten: اِسْم, فِعْل und حَرْف — und nichts sonst.' }] });
  pruefe(r.code === 0, 'حَرْف als „Partikel — eine der drei Wortarten": kein Tausch, angenommen', r.code + ' ' + r.text);
}

console.log('\n=== C. Ein richtiger Eintrag landet — auf der Kopie ===');
{
  const vorherZahl = new Function(fs.readFileSync(kopie, 'utf8') + '; return FACHBEGRIFF_VOKABELN;')().length;
  let r = setzen({ aufnehmen: [GUT] }, ['--pruefen']);
  pruefe(r.code === 0 && fs.readFileSync(kopie, 'utf8').indexOf('gram-nakira-test') < 0, '--pruefen schreibt nichts', r.code + ' ' + r.text);
  r = setzen({ aufnehmen: [GUT], ablehnen: [{ ar: 'مُحَمَّدٌ', grund: 'Eigenname aus Beispielsätzen' }] });
  const neu = (() => { try { return new Function(fs.readFileSync(kopie, 'utf8') + '; return FACHBEGRIFF_VOKABELN;')(); } catch (e) { return null; } })();
  pruefe(r.code === 0 && neu && neu.length === vorherZahl + 1 && neu.some(x => x.id === 'gram-nakira-test' && x.ar === 'نَكِرَة' && x.book === 'grammar'), 'die Kopie lädt, ein Eintrag mehr, mit book: grammar', r.code + ' ' + r.text);
  const e = fs.existsSync(entsch) ? JSON.parse(fs.readFileSync(entsch, 'utf8')).entscheidungen : {};
  pruefe(e['نكرة'] && e['نكرة'].entscheidung === 'aufgenommen' && e['محمد'] && e['محمد'].entscheidung === 'abgelehnt', 'beide Entscheidungen sind gemerkt', JSON.stringify(e));
  pruefe(!fs.readdirSync(tmp).some(n => n.endsWith('.neu')), 'keine .neu-Datei bleibt liegen');
  pruefe(fs.readFileSync(FACH, 'utf8').indexOf('gram-nakira-test') < 0, 'die echte data/fachbegriffe.js ist unberührt');
}

/* ================= D. Entscheidungen gegen den Bestand ================= */
console.log('\n=== D. Jede „aufgenommen"-Entscheidung hat ihren Eintrag ===');
{
  const eDatei = path.join(REPO, 'werkzeuge', 'fachbegriffe-entscheidungen.json');
  const F = new Function(fs.readFileSync(FACH, 'utf8') + '; return FACHBEGRIFF_VOKABELN;')();
  const E = fs.existsSync(eDatei) ? JSON.parse(fs.readFileSync(eDatei, 'utf8')).entscheidungen : {};
  const auf = Object.entries(E).filter(([, x]) => x.entscheidung === 'aufgenommen');
  const ohne = auf.filter(([, x]) => !F.some(f => f.id === x.id));
  pruefe(ohne.length === 0, auf.length + ' aufgenommene Begriffe, jeder steht in data/fachbegriffe.js', ohne.map(([k, x]) => k + '→' + x.id).join(', '));
  /* Jeder aufgenommene Begriff, den die App beim Start gegen eine Buchvokabel
     tauschen würde, trägt diesen Tausch AUSDRÜCKLICH in seiner Entscheidung —
     mit genau dieser Buch-id. Ein unbestätigter Tausch ist der Fehler von v470. */
  const { buchDublette } = await import('./fachbegriffe-kern.mjs');
  const ohneBestaetigung = auf.map(([k, x]) => {
    const f = F.find(y => y.id === x.id);
    const b = f ? buchDublette({ id: f.id, ar: f.ar, de: f.de, chapter: 'personal' }) : null;
    return b && String(x.buchTausch || '') !== String(b.id) ? k + ' (' + x.id + ') ← Buch ' + b.id + ' ' + b.ar + ' „' + b.de + '"' : null;
  }).filter(Boolean);
  pruefe(ohneBestaetigung.length === 0, 'kein aufgenommener Begriff wird beim Start unbestätigt gegen eine Buchvokabel getauscht', ohneBestaetigung.join(' · '));
  const unbekannt = Object.values(E).filter(x => !['aufgenommen', 'abgelehnt', 'frage', 'zurueckgestellt'].includes(x.entscheidung));
  pruefe(unbekannt.length === 0, 'nur die vier bekannten Entscheidungsarten', JSON.stringify(unbekannt.slice(0, 2)));
}

/* ================= E. Störtests ================= */
console.log('\n=== E. Störtests: ausgehebelte Schutzstellen müssen auffallen ===');
const erzeugt = [];
try {
  const stoer = (quelle, name, alt, neu) => {
    const text = fs.readFileSync(quelle, 'utf8');
    if (!text.includes(alt)) return null;
    const ziel = path.join(path.dirname(quelle), '.stoer-' + name + '.mjs');
    fs.writeFileSync(ziel, text.replace(alt, () => neu), 'utf8');
    erzeugt.push(ziel);
    return ziel;
  };
  const s1 = stoer(SETZEN, 'setzen-ohne-taschkil', 'const l = taschkilLuecken(ar);', 'const l = [];');
  pruefe(!!s1, 'Störtest 1: die Taschkīl-Prüfung im Eintragwerkzeug ist auffindbar');
  if (s1){
    const k2 = schreib('fachbegriffe-2.js', fs.readFileSync(FACH, 'utf8'));
    const r = lauf(s1, [schreib('auftrag-stoer.json', { aufnehmen: [{ ...UNVOLLSTAENDIG, id: 'gram-stoer' }] }), '--ziel', k2, '--entscheidungen', path.join(tmp, 'e2.json'), '--pruefen']);
    pruefe(r.code === 0, 'Störtest 1: ohne sie geht كَسْرة durch — die Abweisung in B hängt an ihr', r.code + ' ' + r.text);
  }
  const s3 = stoer(SETZEN, 'setzen-ohne-tausch', 'try { tausch = buchDublette({ id: a.id, ar, de: String(a.de), chapter: \'personal\' }); }', 'try { tausch = null; }');
  pruefe(!!s3, 'Störtest 3: die Tausch-Prüfung im Eintragwerkzeug ist auffindbar');
  if (s3){
    const r = lauf(s3, [schreib('auftrag-stoer3.json', { aufnehmen: [MANSUB] }), '--ziel', ohneBeide, '--entscheidungen', path.join(tmp, 'e3.json'), '--pruefen']);
    pruefe(r.code === 0, 'Störtest 3: ohne sie geht مَنْصُوب ohne buchTausch durch — die Abweisung in B2 hängt an ihr', r.code + ' ' + r.text);
  }
  const s2 = stoer(FINDEN, 'finden-ohne-schalter', "const OHNE_BESTAND = args.includes('--ohne-bestand');", 'const OHNE_BESTAND = false;');
  pruefe(!!s2, 'Störtest 2: der Schalter --ohne-bestand ist auffindbar');
  if (s2){
    const r = lauf(s2, ['--ohne-bestand']);
    pruefe(gefunden(r.text).length === 0, 'Störtest 2: wirkt der Schalter nicht, findet die Eichung keinen der zehn', gefunden(r.text).join(', '));
  }
} finally {
  for (const d of erzeugt) try { fs.unlinkSync(d); } catch { /* weg */ }
}
pruefe(!fs.readdirSync(path.join(REPO, 'werkzeuge')).some(n => n.startsWith('.stoer-')), 'keine Störkopie bleibt in werkzeuge/ liegen');

console.log('');
if (fehler){ console.log('✗ ' + fehler + ' Prüfung(en) gescheitert — „direkt eintragen" ist so nicht abgesichert.'); process.exit(1); }
console.log('✓ Finden und Eintragen neuer Fachbegriffe halten, was „direkt eintragen" verlangt.');
