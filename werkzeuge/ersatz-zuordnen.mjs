/* ersatz-zuordnen.mjs -- sucht zu jedem Platz des Bestands die Einträge in den Wörterbuch-Auszügen und
 * schreibt einen VORSCHLAG je Platz: jede Angabe aus der Quelle, mit Fundstelle, und daneben der Vergleich
 * mit dem Bestand. Der Bestand (data/vokabeln-<buch>.js) dient nur als SUCHLISTE und zum Vergleich —
 * kein Feld wird von dort abgeschrieben (Elias, 11.10.2026: „wo anders suchst nach den selben begriffen").
 * Eine Ausnahme seit dem 12.10.2026, auf seinen Satz „guck mal nach damit wir mehr identische bekommen": nennen die
 * Quellen zu einem Wort GENAU die deutschen Wörter der Karte, schreibt ersatz-bauen.mjs das Deutsch im Wortlaut der
 * Karte (wieDieKarte dort) — belegt bleibt jedes Wort für sich, von der Karte stammen Reihenfolge und Trennzeichen.
 *
 * Die Ausgabe enthält die Suchschlüssel aus dem Bestand und bleibt deshalb lokal (data-ersatz/arbeit/).
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-zuordnen.mjs            → alle Bücher, schreibt data-ersatz/arbeit/zuordnung.jsonl, druckt Zahlen
 *   node werkzeuge/ersatz-zuordnen.mjs --knapp    → nur die Zahlen je Buch
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { abzugOrdner, istErsatzkarte } from './datenquelle.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const AUSZUEGE = path.join(REPO, 'data-ersatz', 'quellen', 'auszuege');
const ARBEIT = path.join(REPO, 'data-ersatz', 'arbeit');
export const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];

/* ---------- Schrift: Vergleichsschlüssel ------------------------------------------------------------------
 * nackt  = nur Buchstaben (so heißen die Seiten im Wiktionary)
 * k1     = mit Vokalzeichen, aber ohne die Schlussendung, ohne Sukun, ohne den Vokal am Verbindungsalif
 * k2     = wie k1, dazu ohne die Vokale, die ein Dehnungsbuchstabe ohnehin anzeigt, und mit vereinheitlichtem Hamza
 * Lehre vom 07.09.2026: der Vergleich läuft MIT Vokalzeichen, nackt gleich heißt nicht dasselbe Wort. */
const ZEICHEN = /[ً-ْٰـ]/g;
export const nfc = t => String(t ?? '').normalize('NFC').trim();
export const nackt = t => nfc(t).replace(ZEICHEN, '').replace(/ٱ/g, 'ا');
const ohneHamza = t => t.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي');
function k1Wort(v) {
  let s = v.replace(/ـ/g, '').replace(/ٱ/g, 'ا').replace(/ْ/g, '');
  const m = s.match(/^([\s\S]*?)([ً-ّٰ]*)$/);
  s = m[1] + m[2].replace(/[ً-ِ]/g, '');
  return s.replace(/^ا[َ-ِ]/, 'ا');
}
// Bei einer Fügung fällt die Schlussendung JEDES Wortes weg, nicht nur die des letzten.
export function k1(v) { return nfc(v).split(/\s+/).map(k1Wort).join(' '); }
// k2 setzt außerdem das Dolchalif dem Fatha gleich: „hadha" steht in der Quelle mit Dolchalif, auf der Karte mit Fatha.
export function k2(v) {
  // Nach dem Tausch noch einmal NFC: das Dolchalif steht in der Normalform HINTER dem Schadda, das Fatha davor.
  // das Fatha vor einem Alif maqsura zeigt der Buchstabe ohnehin an (wie vor dem Alif); manche Vorlagen lassen es weg
  return ohneHamza(k1(v).replace(/َ(?=ى)/g, '')).replace(/َ?ٰ/g, 'َ').normalize('NFC').replace(/َ(?=ا)/g, '').replace(/ِ(?=ي)/g, '').replace(/ُ(?=و)/g, '')
    // das Tanwin des Akkusativs steht je nach Vorlage vor oder hinter dem Schluss-Alif
    .replace(/ً(?=[اي](?: |$))/g, '')
    // vor dem Ta marbuta steht immer ein Fatha; manche Vorlagen (arabdict) schreiben es nicht
    .replace(/َ(?=ة)/g, '');
}
const ARTIKEL = /^الْ?/;
const hatArtikel = v => ARTIKEL.test(nfc(v));
function ohneArtikel(v) {
  let s = nfc(v).replace(ARTIKEL, '');
  // Sonnenbuchstabe: das Schadda der Angleichung fällt mit dem Artikel weg
  const m = s.match(/^(.)([ً-ْٰ]*)/);
  if (m && m[2].includes('ّ')) s = m[1] + m[2].replace('ّ', '') + s.slice(m[0].length);
  return s;
}
const voll = v => v !== null && v !== undefined && String(v).trim() !== '';

/* ---------- Laden ------------------------------------------------------------------------------------------ */
/* Der Bestand ist der Abzug von arabicroots. Er liegt in data/ -- oder in data-abzug/, solange auf die
 * Ersatzdatenbank umgeschaltet ist (datenquelle.mjs); in data/ stehen dann die Ersatzkarten selbst. */
export function ladeBuch(buch) {
  const datei = path.join(abzugOrdner(REPO), 'vokabeln-' + buch + '.js');
  const fenster = {};
  vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei });
  const karten = fenster.VOKABELN[buch];
  if (karten.some(istErsatzkarte)) throw new Error(datei + ': das sind Karten der Ersatzdatenbank, nicht der Abzug von arabicroots — der Zuordner hielte sie gegen sich selbst („node werkzeuge/ersatz-wechsel.mjs --stand“ zeigt die Lage)');
  return karten;
}
function ladeJsonl(datei) {
  if (!fs.existsSync(datei)) return [];
  return fs.readFileSync(datei, 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
}
const eintraege = ladeJsonl(path.join(AUSZUEGE, 'enwikt-arabisch.jsonl'));
const nachNackt = new Map(), nachOhneHamza = new Map(), eintragNach = new Map();
eintraege.forEach((e, i) => {
  e.ref = `${e.w}#${e.pos}#${e.n || 1}@${i}`;
  // für die Zusatzformen: der Eintrag zu Seite, Wortart, Herkunft und Stichwortform
  for (const f of e.kopf || []) { const s = [e.w, e.pos, e.n || '', String(f.f).normalize('NFC')].join('#'); if (!eintragNach.has(s)) eintragNach.set(s, e); }
  e.formVon = (e.sinn || []).every(s => (s.t || []).includes('form-of') || (s.t || []).includes('alt-of')) && (e.sinn || []).length > 0;
  const schluessel = new Set([nackt(e.w), ...(e.kopf || []).map(f => nackt(f.f))]);
  for (const s of schluessel) {
    (nachNackt.get(s) || nachNackt.set(s, []).get(s)).push(e);
    const h = ohneHamza(s);
    (nachOhneHamza.get(h) || nachOhneHamza.set(h, []).get(h)).push(e);
  }
});

/* Zusatzformen (ersatz-quellen.mjs zusatz): gebeugte Formen aus den vollständigen Tabellen der Quelle, die der schlanke
 * Auszug weglässt — die übrigen Personen des Verbs, die Zweizahl. Nur zu den Wörtern der noch offenen Plätze. */
const zusatzNach = new Map();
for (const z of ladeJsonl(path.join(AUSZUEGE, 'enwikt-zusatzformen.jsonl'))) { const s = ohneHamza(nackt(z.f)); (zusatzNach.get(s) || zusatzNach.set(s, []).get(s)).push(z); }

/* Deutsche Quellen: (1) deutsches Wiktionary, (2) Übersetzungstabellen des englischen Wiktionary */
const deNachNackt = new Map();
const merkeDe = (arWort, fund) => { const s = ohneHamza(nackt(arWort)); if (!s) return; (deNachNackt.get(s) || deNachNackt.set(s, []).get(s)).push({ ...fund, arWort: nfc(arWort) }); };
for (const e of ladeJsonl(path.join(AUSZUEGE, 'dewikt-arabisch.jsonl'))) {
  if (e.s === 'ar') {
    const formen = (e.formen || []).filter(f => /[ء-ي]/.test(f.form || '') && !(f.tags || []).includes('plural')).map(f => f.form);
    for (const s of e.sinn || []) if (s.g) merkeDe(e.w, { q: 'dewikt-ar', de: s.g, erkl: true, wo: `de.wiktionary „${e.w}“ (${e.pt || e.pos}) [${s.i || ''}]`, vok: formen });
    for (const u of e.ue || []) merkeDe(e.w, { q: 'dewikt-ar', de: u.w, wo: `de.wiktionary „${e.w}“ (${e.pt || e.pos}), Übersetzungen [${u.i || ''}]`, vok: formen });
  }
  if (e.s === 'de') for (const u of e.ar || []) {
    const sinn = (e.sinn || []).find(s => s.i === u.i);
    merkeDe(u.w, { q: 'dewikt-ue', de: e.w, pos: e.pos, wo: `de.wiktionary „${e.w}“ (${e.pt || e.pos}), Übersetzungen [${u.i || ''}]`, sinn: sinn ? sinn.g : u.sinn, unsicher: u.unsicher, vok: /[ً-ْ]/.test(u.w) ? [u.w] : [], rom: u.r });
  }
}
let tabellenDa = false;
for (const e of ladeJsonl(path.join(AUSZUEGE, 'enwikt-tabellen.jsonl'))) {
  tabellenDa = true;
  for (const k of e.k) for (const a of k.ar) for (const d of k.de) {
    if (!a.w || !d.w) continue;
    merkeDe(a.w, { q: 'enwikt-tab', de: d.w, pos: e.pos, wo: `en.wiktionary „${e.w}“ (${e.pos}), Übersetzungen „${k.sinn}“`, sinn: k.sinn, en: e.w, vok: /[ً-ْ]/.test(a.w) ? [a.w] : [], rom: a.r });
  }
}
/* (3) arabdict.com (Auszug von ersatz-arabdict.mjs): deutsch-arabische Wortpaare zu den Wörtern, die nach den
 * Wiktionary-Auszügen offen blieben. In Elias' Rangfolge der Belege steht arabdict an vierter Stelle. Ein Paar zählt
 * wie eine Zeile der Übersetzungstabellen: als deutscher Kandidat zu GENAU der arabischen Form, die dort steht.
 * Die Wortart („pos") ist dort nur selten ausdrücklich genannt („posFest"); sonst ist sie aus der Darstellung
 * geschlossen und dient allein als Hinweis, ob das Paar zur Karte passen kann. */
// Französisches Wiktionary (kaikki.org, Auszug frwikt-arabisch.jsonl): nennt das arabische Wort mit Vokalzeichen, dazu
// Wortart und Bedeutung auf Französisch. Fürs Arabische und die Wortart zählt es wie eine Übersetzungstabelle — aber
// nur, wo keine andere Stelle das Wort so nennt (Stufe „W"). Deutsch bringt es nicht mit: die Bedeutung steht als
// Erklärung dabei („erkl"), und das Deutsch schreibt die Hand danach („deEigen", im Beleg als eigenes Deutsch genannt).
let frwiktEintraege = 0;
for (const e of ladeJsonl(path.join(AUSZUEGE, 'frwikt-arabisch.jsonl'))) {
  if (!(e.formen || []).length) continue;
  frwiktEintraege++;
  merkeDe(e.w, { q: 'frwikt', de: e.sinn.slice(0, 3).join(' ; '), erkl: true, pos: e.pos, wo: `fr.wiktionary „${e.w}“ (${e.pos})`, vok: e.formen, fr: e.sinn.slice(0, 3) });
}
let arabdictPaare = 0;
for (const p of ladeJsonl(path.join(AUSZUEGE, 'arabdict.jsonl'))) {
  arabdictPaare++;
  merkeDe(p.ar, { q: 'arabdict', de: p.de, pos: p.pos || undefined, posFest: p.fest === true, posWie: p.wie || undefined,
    wo: `arabdict.com, Suchwort „${p.such}“: „${p.artikel ? p.artikel + ' ' : ''}${p.de}“ = ${p.ar}`, vok: p.vok ? [p.ar] : [] });
}

/* Der deutsche Schlüssel zum Lehrbuch (Auszug von ersatz-schluessel.py): je Tabellenzeile die arabische Zelle
 * (Stichwort, bei Verben Vergangenheit und Gegenwart, die Mehrzahl in Klammern hinter „ج") und die deutsche.
 * Er ist Elias' eigenes Buch — in seiner Rangfolge der Belege an zweiter Stelle, über dem Wörterbuch — und gilt
 * nur für das Buch, zu dem er gehört. Von Claude stammt: eine Zeile zählt nur bei GLEICHER Schreibung mit
 * Vokalzeichen (das Auslesen aus dem PDF macht Fehler; eine Zeile, die nicht passt, bleibt der Hand). */
const SCHLUESSEL_NAME = { 'madina-3': 'Schlüssel zu Madina Buch 3, deutsche Fassung (PDF)' };
const DE_KORREKTUR = (() => { const d = path.join(REPO, 'data-ersatz', 'hand', 'schluessel-korrektur.json'); return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : {}; })();
// Zeichen aus dem privaten Bereich (Reste der PDF-Schrift des Schlüssels); als Zahlen, damit hier nichts Unsichtbares steht
const PUNKT_PRIVAT = new RegExp(String.fromCodePoint(0xF024), 'g'), PUNKT_UNTEN = String.fromCodePoint(0x0323);
const PRIVAT = new RegExp('[' + String.fromCodePoint(0xE000) + '-' + String.fromCodePoint(0xF8FF) + ']', 'g');
const VERBKLASSE = /\(\s*(?:[aiu]\s*-\s*[aiu]|I{1,3}|IV|VI{0,3}|IX|X)\s*\)/g;
const schluessel = {};
for (const buch of Object.keys(SCHLUESSEL_NAME)) {
  const reg = schluessel[buch] = { kopf: new Map(), form: new Map(), nah: new Map(), zeilen: 0 };
  for (const z of ladeJsonl(path.join(AUSZUEGE, 'schluessel-' + buch + '.jsonl'))) {
    reg.zeilen++;
    const gruppen = [];
    const kopf = nfc(z.ar).replace(/\(([^()]*)\)/g, (_, g) => { gruppen.push(g.trim()); return ' '; }).replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!kopf) continue;
    const mehrzahl = gruppen.filter(g => /^ج\s/.test(g)).flatMap(g => g.replace(/^ج\s+/, '').split(/\s*[،,]\s*/)).filter(x => /[ء-ي]/.test(x));
    const klasse = (z.de.match(VERBKLASSE) || [])[0] || null;
    // Die Schrift der Vorlage setzt den Punkt unter einem Umschriftbuchstaben („ṣ", „ḥ", „ḍ") als eigenes Zeichen aus dem
    // privaten Bereich (U+F024) HINTER den Buchstaben; auf der Karte wäre das ein leeres Kästchen. Es wird zum Punkt
    // darunter (U+0323) und verschmilzt mit seinem Buchstaben. Andere private Zeichen sind Reste ohne Inhalt.
    // Reste des Auslesens (gefunden am 12.10.2026 bei der Durchsicht der Karten): wo im deutschen Feld des Schlüssels
    // ARABISCHE Schrift stand, fehlt sie im Auszug. Übrig bleibt eine leere Klammer („einäugig (fem. )" — dahinter stand die
    // weibliche Form) oder ein Komma am Zeilenende („entkommen, (a-u)" nach dem Abziehen der Verbklasse). Beides trägt
    // keinen Inhalt und stünde sonst genau so auf der Karte.
    let de = z.de.replace(PUNKT_PRIVAT, PUNKT_UNTEN).replace(PRIVAT, '').normalize('NFC').replace(VERBKLASSE, ' ').replace(/\(\s*(?:fem\.?|feminine?)\s*\)/gi, ' ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/[,;]\s*$/, '').trim();
    let berichtigt = false;
    for (const [falsch, richtig] of Object.entries(DE_KORREKTUR)) if (de.includes(falsch)) { de = de.split(falsch).join(richtig); berichtigt = true; }
    // „X = Y" und „X، Y" nennen zwei Stichwörter in einer Zeile
    const stichwoerter = kopf.split(/\s*[=،]\s*/).filter(x => /[ء-ي]/.test(x));
    const w = (stichwoerter[0] || kopf).split(' ');
    // Verbzeile: hinter der Vergangenheit steht die Gegenwart (beginnt mit Ya) oder, ab Lektion 14, das Verbalsubstantiv im
    // Akkusativ; meist nennt das Deutsch dazu die Vokalklasse oder den Stamm. Dazwischen kann eine Ergänzung stehen.
    const geg = w.slice(1).find(t => /^ي[َُ]/.test(t)) || null;
    const vergForm = /[َاى]$/.test(w[0]) || /َّ$/.test(w[0]);
    const mitMasdar = w.length >= 2 && /ً[اى]?$|اً$/.test(w[w.length - 1]);
    const istVerb = vergForm && (!!klasse || !!geg || mitMasdar);
    const zeile = { lektion: z.lektion, seite: z.seite, nr: z.zeile, kopf, mehrzahl, klasse, de, berichtigt, verb: istVerb, geg: istVerb ? geg : null };
    const merke = (karte, form) => { const s = k2(form); if (s) (karte.get(s) || karte.set(s, []).get(s)).push({ zeile, form: nfc(form) }); };
    // „nah": dieselben Buchstaben, die Vokalzeichen können abweichen — nur für das Blatt und die Entscheidung von Hand
    const merkeNah = form => { const s = ohneHamza(nackt(form)); if (s) (reg.nah.get(s) || reg.nah.set(s, []).get(s)).push({ zeile, form: nfc(form) }); };
    if (istVerb) { merke(reg.kopf, w[0]); merkeNah(w[0]); }
    for (const s of stichwoerter.slice(istVerb ? 1 : 0)) { merke(reg.kopf, s); merkeNah(s); }
    for (const m of mehrzahl) merke(reg.form, m);
    for (const g of gruppen.filter(g => !/^ج\s/.test(g))) if (/[ء-ي]/.test(g)) merke(reg.form, g);
  }
}
function schluesselFuer(buch, wort, kap) {
  const reg = schluessel[buch];
  if (!reg) return [];
  const s = k2(wort);
  let funde = [...(reg.kopf.get(s) || []).map(x => ({ ...x, alsKopf: true })), ...(reg.form.get(s) || []).map(x => ({ ...x, alsKopf: false }))];
  // Karte „Verb + Verhältniswort": die Zeile des Schlüssels führt das Verb; das Verhältniswort belegt das Wörterbuch
  const teile = nfc(wort).split(/\s+/);
  if (!funde.some(x => x.alsKopf) && teile.length > 1) funde = funde.concat((reg.kopf.get(k2(teile[0])) || []).filter(x => x.zeile.verb).map(x => ({ ...x, alsKopf: true, nurErstes: true })));
  return funde.map(x => ({ ...x, streng: k1(x.form) === k1(x.nurErstes ? teile[0] : wort), lektionGleich: x.zeile.lektion === kap }))
    .sort((a, b) => (b.alsKopf - a.alsKopf) || (b.lektionGleich - a.lektionGleich) || (b.streng - a.streng));
}
const schluesselOrt = (buch, zl) => `${SCHLUESSEL_NAME[buch]}, Lektion ${zl.lektion}, Wörterliste, S. ${zl.seite}`;
/* Vorschlag aus einer Zeile des Schlüssels. Die Wortart nennt der Schlüssel nicht; er zeigt nur, ob es ein Verb ist
 * (Gegenwartsform, Vokalklasse) oder ein Nomen (Mehrzahl, Tanwin). Die feinere Einteilung der App bleibt, wenn sie
 * dazu passt — dieselbe Regel wie beim Wörterbuch. */
function vorschlagAusSchluessel(x, wort, karte, buch) {
  const zl = x.zeile, ort = schluesselOrt(buch, zl);
  const v = {};
  const setze = (feld, w, was) => { if (voll(w)) v[feld] = { w: nfc(w), wo: `${ort}: ${was}`, q: 'buch' }; };
  setze('ar', x.form, zl.verb ? 'Vergangenheit' : 'Stichwort');
  const nominal = zl.mehrzahl.length > 0 || /[ً-ٍ]$|ً[اى]$/.test(x.form);
  if (zl.verb) { if (karte.type === 'verb') setze('type', 'verb', 'Verb (Gegenwartsform und Vokalklasse stehen dabei)'); }
  else if (karte.type !== 'verb') setze('type', karte.type, nominal ? 'Nomen (mit Tanwin oder Mehrzahl genannt); die feinere Einteilung der App ist beibehalten' : 'kein Verb (keine Gegenwartsform, keine Vokalklasse); die Einteilung der App ist beibehalten');
  if (zl.verb) { setze('past', x.form, 'Vergangenheit'); setze('present', zl.geg, 'Gegenwart'); }
  else {
    if (voll(karte.sg) && k1(karte.sg) === k1(wort)) setze('sg', x.form, 'Stichwort');
    if (zl.mehrzahl.length) {
      const bisher = teileVon(karte.pl);
      const gw = bisher.length && zl.mehrzahl.some(p => bisher.some(b => k1(b) === k1(p))) ? zl.mehrzahl.filter(p => bisher.some(b => k1(b) === k1(p))) : zl.mehrzahl;
      setze('pl', gw.join(trenner(karte.pl)), 'Mehrzahl' + (zl.mehrzahl.length > gw.length ? ` (der Schlüssel nennt ${zl.mehrzahl.length})` : ''));
    }
  }
  return v;
}

/* ---------- Zuordnung ---------------------------------------------------------------------------------------- */
const PASST = {
  noun: ['noun', 'name', 'num'], verb: ['verb'], adjective: ['adj', 'noun', 'num'], adverb: ['adv', 'noun', 'prep', 'adj'],
  particle: ['prep', 'conj', 'particle', 'adv', 'pron', 'det', 'intj', 'article', 'noun', 'num', 'prefix', 'suffix'],
  expression: ['phrase', 'intj', 'prep_phrase', 'proverb', 'noun', 'adv'], phrase: ['phrase', 'intj', 'prep_phrase', 'proverb', 'noun', 'adv'],
};
const ART = { noun: 'noun', name: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', prep: 'particle', conj: 'particle', particle: 'particle', pron: 'particle', det: 'particle', intj: 'particle', article: 'particle', num: 'noun', phrase: 'expression', prep_phrase: 'expression', proverb: 'expression' };
const AR_FELD = new Set(['ar', 'sg', 'pl', 'femSg', 'femPl', 'past', 'present', 'imperative', 'masdar']);
// Der Auszug führt Partizipien unter „verb"; für die Karte sind sie Adjektive.
const wortartVon = e => e.pos === 'verb' && (/participle/.test(e.kn || '') || (e.sinn || []).some(s => (s.t || []).includes('participle'))) ? 'adj' : e.pos;
const hat = (f, ...tags) => tags.every(t => Array.isArray(t) ? t.some(x => f.t.includes(x)) : f.t.includes(t));

function sucheEintraege(wort) {
  const n = nackt(wort);
  const funde = new Map();
  const nimm = (liste, artikelAb) => { for (const e of liste || []) if (!funde.has(e.ref)) funde.set(e.ref, { e, artikelAb }); };
  nimm(nachNackt.get(n), false);
  if (n.startsWith('ال')) nimm(nachNackt.get(n.slice(2)), true);
  if (!funde.size) { nimm(nachOhneHamza.get(ohneHamza(n)), false); if (n.startsWith('ال')) nimm(nachOhneHamza.get(ohneHamza(n.slice(2))), true); }
  return [...funde.values()];
}
function stufeFuer(wort, typ, karte) {
  const funde = sucheEintraege(wort);
  if (!funde.length) return { stufe: 'N', treffer: [], alle: [] };
  const mit = (schl) => funde.filter(({ e, artikelAb }) => (e.kopf || []).some(f => schl(f.f) === schl(artikelAb ? ohneArtikel(wort) : wort)));
  let treffer = mit(k1), streng = true;
  if (!treffer.length) { treffer = mit(k2); streng = false; }
  // Gleicht nur ein Eintrag ANDERER Wortart genau (das Verb „mit dem Stock schlagen" zur Karte „Stock"), zählt vor ihm
  // der Eintrag passender Wortart, der sich bloß in der Schreibweise unterscheidet (Tanwin vor dem Schluss-Alif).
  else if (!treffer.some(({ e }) => (PASST[typ] || []).includes(wortartVon(e)))) {
    const zweite = mit(k2).filter(({ e }) => (PASST[typ] || []).includes(wortartVon(e)));
    if (zweite.length) { treffer = zweite; streng = false; }
  }
  if (!treffer.length) return { stufe: 'C', treffer: [], alle: funde };
  const passend = treffer.filter(({ e }) => (PASST[typ] || []).includes(wortartVon(e)));
  let wahl = passend.length ? passend : treffer;
  const artFremd = !passend.length;
  // steht das Wort mit Artikel im Wörterbuch (Ländername), zählt dieser Eintrag vor dem ohne Artikel
  if (wahl.length > 1 && wahl.some(x => !x.artikelAb)) wahl = wahl.filter(x => !x.artikelAb);
  // Lemma vor gebeugter Form
  if (wahl.length > 1 && wahl.some(x => !x.e.formVon)) wahl = wahl.filter(x => !x.e.formVon);
  // genaue Wortart vor der weiten (Nomen vor Name, Adjektiv vor Nomen)
  if (wahl.length > 1) { const genau = wahl.filter(x => wortartVon(x.e) === (PASST[typ] || [])[0]); if (genau.length) wahl = genau; }
  // Verben: die Gegenwartsform der Karte trennt gleichlautende Verben
  if (wahl.length > 1 && typ === 'verb' && voll(karte.present)) {
    const g = wahl.filter(({ e }) => [...(e.hf || []), ...(e.tab || [])].some(f => (f.t.includes('non-past')) && k1(f.f) === k1(karte.present)));
    if (g.length) wahl = g;
  }
  // Nomen: Geschlecht und Mehrzahl der Karte trennen gleichlautende Nomen
  if (wahl.length > 1 && typ !== 'verb' && voll(karte.pl)) {
    const plK = String(karte.pl).split(/[|\/]/).map(k1);
    const g = wahl.filter(({ e }) => (e.hf || []).some(f => f.t.includes('plural') && plK.includes(k1(f.f))));
    if (g.length) wahl = g;
  }
  return { stufe: (wahl.length === 1 ? 'A' : 'B') + (streng ? '' : '2') + (artFremd ? '*' : ''), treffer: wahl, alle: funde };
}

/* Die Wurzel steht im Auszug nur bei jedem fünften Stichwort. Verlässlicher ist die Seite selbst
 * (ersatz-seiten.mjs): dort steht die Wurzelangabe je Herkunftsabschnitt. */
const WURZELSEITEN = fs.existsSync(path.join(AUSZUEGE, 'enwikt-wurzeln.json')) ? JSON.parse(fs.readFileSync(path.join(AUSZUEGE, 'enwikt-wurzeln.json'), 'utf8')) : {};
function wurzelAusSeite(e) {
  const seite = WURZELSEITEN[e.w];
  if (!seite) return null;
  const nr = e.n ? Number(e.n) : null;
  let einheit = seite.einheiten.find(x => x.nr === nr) || (seite.einheiten.length === 1 ? seite.einheiten[0] : null);
  // Trägt der Eintrag keine Herkunftsnummer, die Seite aber mehrere Abschnitte: der EINE Abschnitt, dessen Kopfvorlage
  // eine Kopfform dieses Eintrags nennt (gleiche Vokalzeichen). Nennen zwei Abschnitte sie, bleibt es offen.
  if (!einheit && seite.einheiten.length > 1) {
    const meine = new Set((e.kopf || []).map(f => k1(f.f)));
    const mit = seite.einheiten.filter(x => (x.koepfe || []).some(k => meine.has(k1(k))));
    if (mit.length === 1) einheit = mit[0];
  }
  // Eine Vorlage mit nocat ist eine Erwähnung im Herkunftstext, nie die Wurzel des Worts (ersatz-seiten.mjs).
  const eine = liste => { const echt = liste.filter(x => !x.nocat); const k = [...new Set(echt.filter(x => x.art === 'ar-rootbox').map(x => x.w))], a = [...new Set(echt.map(x => x.w))]; return k.length === 1 ? k[0] : a.length === 1 ? a[0] : null; };
  let w = einheit ? eine(einheit.w) : null, ort = einheit && einheit.nr ? ', Herkunft ' + einheit.nr : '';
  if (!w && (!einheit || !einheit.w.length)) { w = eine(seite.vorspann); ort = ', Seitenanfang'; }
  return w ? { w, wo: `en.wiktionary „${e.w}“${ort}: Wurzelangabe (Fassung vom ${String(seite.zeit).slice(0, 10)})` } : null;
}
/* Der Auszug führt als Wurzel eines Eintrags die erste Wurzelvorlage der Seite — auch eine, die dort nur zum Vergleich
 * steht (nocat=1). Kennt die abgelegte Seite die Wurzel des Auszugs NUR als Erwähnung, gilt sie nicht. */
const HAMZA_TRAEGER = new RegExp('[' + [0x623, 0x624, 0x625, 0x626].map(n => String.fromCodePoint(n)).join('') + ']', 'g');
const wurzelKern = w => String(w || '').replace(HAMZA_TRAEGER, String.fromCodePoint(0x621)).replace(/\s+/g, '');
const wurzelGleich = (a, b) => wurzelKern(a) === wurzelKern(b);
const nurErwaehnt = e => {
  const seite = WURZELSEITEN[e.w];
  if (!seite || !e.wurzel) return false;
  const meine = [...(seite.vorspann || []), ...seite.einheiten.flatMap(x => x.w)].filter(x => wurzelGleich(x.w, e.wurzel));
  return meine.length > 0 && meine.every(x => x.nocat);
};
const wurzelVon = (e, tiefe = 0) => {
  const ausSeite = wurzelAusSeite(e);
  if (ausSeite) return ausSeite;
  if (e.wurzel && !nurErwaehnt(e)) return { w: e.wurzel, wo: `en.wiktionary „${e.w}“ (${e.pos}), Wurzelangabe` };
  for (const k of e.wk || []) { const m = String(k).match(/root\s+([ء-ي](?:\s+[ء-ي])+)/); if (m) return { w: m[1].replace(/\s+/g, ' '), wo: `en.wiktionary „${e.w}“ (${e.pos}), Kategorie` }; }
  if (tiefe < 2) for (const a of e.abl || []) {
    if (!a.a) continue;
    const ziel = (nachNackt.get(nackt(a.a)) || []).filter(x => (x.kopf || []).some(f => k1(f.f) === k1(a.a)));
    for (const z of ziel) { const r = wurzelVon(z, tiefe + 1); if (r) return { w: r.w, wo: `en.wiktionary „${e.w}“ (${e.pos}): ${a.n.replace(/^ar-/, '')} von „${z.w}“; ${r.wo}` }; }
  }
  // dieselbe Seite: steht die Wurzel bei einem anderen Eintrag derselben Schreibung mit derselben Herkunftsnummer?
  if (tiefe === 0) { const nb = (nachNackt.get(nackt(e.w)) || []).filter(x => x !== e && x.wurzel && !nurErwaehnt(x) && (x.n || 1) === (e.n || 1)); if (nb.length) return { w: nb[0].wurzel, wo: `en.wiktionary „${e.w}“, Wurzelangabe am Eintrag (${nb[0].pos}) derselben Herkunft` }; }
  return null;
};

/* Ein einzelnes Wort einer Fügung im Wörterbuch suchen, GENAU in der Form, in der es dasteht (erstes Glied ohne Tanwin,
 * zweites im Genitiv mit Artikel) — die Beugungstabelle der Quelle nennt diese Formen. Ist der gefundene Eintrag selbst
 * nur eine gebeugte Form (weibliche Form, Mehrzahl), steht die Tabelle beim Stichwort, auf das er verweist. */
function teilFund(t, weit = false) {
  const r = stufeFuer(t, 'noun', {});
  // Ein Stichwort, das GENAU so dasteht (mit allen Zeichen), geht vor, gleich welcher Wortart. stufeFuer zieht hier Nomen
  // vor und vergleicht ohne Schlussendung: bei „ilā" gewann so das Nomen „ilan" (Wohltat), dessen Form im Status
  // constructus gleich aussieht, vor dem Verhältniswort — die Fundstelle nannte das falsche Wort (gesehen am 11.10.2026).
  // Unter mehreren genauen Stichwörtern bleibt die Wahl von stufeFuer vorn („dhī" in „dhī l-qurbā" ist das Nomen, nicht
  // das gleich geschriebene Fürwort).
  const genau = e => (e.kopf || []).some(f => nfc(f.f) === t);
  const mitStichwort = [...r.treffer.map(x => x.e).filter(genau), ...(r.alle || []).map(x => x.e).filter(e => !e.formVon && genau(e))].filter((e, i, l) => l.indexOf(e) === i);
  for (const x of r.treffer) {
    if (!mitStichwort.includes(x.e)) mitStichwort.push(x.e);
    if (x.e.formVon) for (const s of x.e.sinn || []) for (const ziel of s.fo || []) for (const l of nachNackt.get(nackt(ziel)) || []) if (!l.formVon && !mitStichwort.includes(l)) mitStichwort.push(l);
  }
  // die Quelle schreibt angehängte Verhältniswörter mit Dehnungsstrich („bi" + Strich); der Strich ist kein Buchstabe
  const ohneStrich = s => ohneSukun(s).replace(/ـ/g, '');
  // Tanwin oder kurzer Vokal am Schluss — in NFC steht er VOR einem Schadda desselben Buchstabens („iyyu" endet auf Schadda)
  const ENDUNG = /[ً-ِ](ّ?)$/;
  const endeVon = s => { const m = nfc(s).match(ENDUNG); return m ? m[0][0] : null; };
  const ohneEnde = s => nfc(s).replace(ENDUNG, '$1');
  const FALL = ['nominative', 'accusative', 'genitive'];
  for (const e of mitStichwort) {
    const formen = [...(e.tab || []), ...(e.kopf || []), ...(e.hf || [])];
    const f = formen.find(f => nfc(f.f) === t) || formen.find(f => ohneStrich(f.f) === ohneStrich(t));
    if (f) return { r, fund: { e, f, w: nfc(f.f) === t || t.includes('ـ') ? nfc(f.f) : nfc(f.f).replace(/ـ/g, '') } };
    // Verbindungs-Alif am Wortanfang: die Quelle schreibt es mit Vokalzeichen oder als Wasla, im Satzinnern steht es
    // ohne — dann gilt die Form, und auf die Karte kommt die Schreibung der Karte
    const wasl = s => ohneStrich(s).replace(/^[اٱ][َُِ]?/, 'ا');
    const fw = /^ا[^َُِ]/.test(t) ? formen.find(f => wasl(f.f) === wasl(t)) : null;
    if (fw) return { r, fund: { e, f: fw, w: t } };
  }
  // Zusatzformen: steht die Form GENAU so (bis auf das Sukun) in der vollständigen Tabelle eines Stichworts, gilt sie
  const gleich = s => ohneSukun(s).replace(/ـ/g, '');
  for (const z of zusatzNach.get(ohneHamza(nackt(t))) || []) {
    if (nfc(z.f) !== t && gleich(z.f) !== gleich(t)) continue;
    const e = eintragNach.get([z.w, z.pos, z.n || '', nfc(z.k)].join('#'));
    if (e) return { r, fund: { e, f: { f: z.f, t: z.t }, w: nfc(z.f), zusatz: true } };
  }
  // Erst wenn keine Form genau so dasteht: drei weitere Vergleiche, nur für die Wörter einer FÜGUNG („weit"), nicht für
  // ein einzelnes Wort — dort wäre eine Form ohne Endung oder mit versetztem Zeichen leicht ein anderes Wort.
  // Von Claude so festgelegt (11.10.2026); jeder dieser Fälle steht als Hinweis in der Fundstelle.
  if (weit) for (const e of mitStichwort) {
    const formen = [...(e.tab || []), ...(e.kopf || []), ...(e.hf || [])];
    // (a) Artikel vor Verbindungs-Alif: die Quelle setzt das Kasra an das Lam des Artikels, manche Karte unter das Alif
    //     — dieselbe Form, nur das Zeichen sitzt einen Buchstaben weiter. Auf die Karte kommt die Schreibung der Quelle.
    if (/^الاِ/.test(t)) {
      const artWasl = s => ohneStrich(s).replace(/^الِ?اِ?/, 'الا');
      const fa = formen.find(f => /^الِا/.test(ohneStrich(f.f)) && artWasl(f.f) === artWasl(t));
      if (fa) return { r, fund: { e, f: fa, w: nfc(fa.f), hinweis: 'die bisherige Karte setzt das Kasra unter das Verbindungs-Alif, die Quelle an das Lam des Artikels' } };
    }
    // (b) ohne Schlussendung: führt die Karte ein Nomen der Fügung in der Pausalform, die Tabelle aber nur die Formen
    //     mit Kasusendung, gilt die Form der Tabelle bis auf ihr letztes Zeichen. Nur Formen mit Kasusangabe (kein Verb:
    //     dessen Schlussvokal gehört zur Nennform). Auf die Karte kommt die Schreibung der Karte.
    if (!endeVon(t)) {
      const mitFall = formen.filter(f => (f.t || []).some(x => FALL.includes(x)) && endeVon(f.f) && ohneStrich(ohneEnde(f.f)) === ohneStrich(t));
      const fp = mitFall.find(f => f.t.includes('nominative')) || mitFall[0];
      if (fp) return { r, fund: { e, f: fp, w: t, hinweis: 'die Karte führt das Wort ohne die Schlussendung dieser Form' } };
    }
    // (c) Schreibung des Stichworts + Endung der Tabelle: die Tabelle schreibt manche Wörter ohne die Zeichen des
    //     Stichworts (beim Gottesnamen fehlen dort Schadda und Dolchalif). Dann gilt die Form, wenn das Wort ohne seine
    //     Schlussendung GENAU das Stichwort ist und die Tabelle zu denselben Buchstaben eine Form mit dieser Endung führt.
    const ende = endeVon(t);
    if (ende && (e.kopf || []).some(f => nfc(f.f) === ohneEnde(t))) {
      const fe = (e.tab || []).find(f => (f.t || []).some(x => FALL.includes(x)) && ohneHamza(nackt(f.f)) === ohneHamza(nackt(t)) && endeVon(f.f) === ende);
      if (fe) return { r, fund: { e, f: fe, w: t, hinweis: 'die Tabelle schreibt das Wort dort ohne die Zeichen des Stichworts; Schreibung nach dem Stichwort, Endung nach der Tabelle' } };
    }
  }
  return { r, fund: null };
}
/* Für die Hand: sucht das Wort als FORM in der Tabelle eines bestimmten Eintrags (auch in den Zusatzformen). */
function formIn(e, t) {
  const gleich = s => ohneSukun(s).replace(/ـ/g, '');
  const formen = [...(e.tab || []), ...(e.kopf || []), ...(e.hf || [])];
  const f = formen.find(f => nfc(f.f) === t) || formen.find(f => gleich(f.f) === gleich(t));
  if (f) return { e, f, w: nfc(f.f) };
  for (const z of zusatzNach.get(ohneHamza(nackt(t))) || []) {
    if (nfc(z.f) !== t && gleich(z.f) !== gleich(t)) continue;
    if (eintragNach.get([z.w, z.pos, z.n || '', nfc(z.k)].join('#')) === e) return { e, f: { f: z.f, t: z.t }, w: nfc(z.f), zusatz: true };
  }
  return null;
}
/* Für die Hand: setzt ein Leerzeichen nach dem n-ten Buchstaben (Vokalzeichen zählen nicht und bleiben bei ihrem Buchstaben). */
function trenneNach(s, stellen) {
  let n = 0, aus = '';
  for (const ch of s) {
    if (!/[ً-ْٰـۖ-ۭ]/.test(ch)) { if (n > 0 && stellen.includes(n)) aus += ' '; n++; }
    aus += ch;
  }
  return aus;
}
const teileVon = wert => voll(wert) ? nfc(wert).split(/\s*[|\/]\s*/).filter(Boolean) : [];
const trenner = wert => voll(wert) && String(wert).includes('/') ? ' / ' : '|';
const ohneSukun = t => nfc(t).replace(/ْ/g, '');
/* Unter mehreren Schreibweisen DERSELBEN Form, die die Quelle nennt, die nehmen, die der bisherigen gleicht —
 * dann sieht die Karte aus wie bisher, und in der Liste „Unterschiede" stehen nur echte Abweichungen. */
function nimmWie(formen, bisher, standard) {
  const liste = formen.filter(voll).map(nfc);
  if (voll(bisher)) { const b = nfc(bisher); const g = liste.find(f => f === b) || liste.find(f => ohneSukun(f) === ohneSukun(b)); if (g) return g; }
  return standard ?? liste[0];
}
function vorschlag(e, wort, artikelAb, karte) {
  const wo = was => `en.wiktionary „${e.w}“ (${e.pos}${e.n ? ', Herkunft ' + e.n : ''}), ${was}`;
  const v = {};
  // Ein Strich oder ein Tabellenkennzeichen ist keine Form: in arabischen Feldern zählt nur, was arabische Buchstaben hat.
  const setze = (feld, wert, beleg) => {
    if (!voll(wert)) return;
    let w = nfc(wert);
    if (AR_FELD.has(feld)) { const tr = w.includes(' / ') ? ' / ' : '|'; w = w.split(/\s*[|\/]\s*/).filter(x => /[ء-ي]/.test(x)).join(tr); if (!w) return; }
    v[feld] = { w, wo: beleg };
  };
  const ziel = artikelAb ? ohneArtikel(wort) : wort;
  // führt der Eintrag zwei Stichwortformen (Nebenform mit anderem Vokal), zählt die, die dem gesuchten Wort gleicht
  const kopf = (e.kopf || []).find(f => k1(f.f) === k1(ziel)) || (e.kopf || []).find(f => k2(f.f) === k2(ziel)) || (e.kopf || [])[0];
  // Die Einteilung der App (noun, particle …) bleibt, wenn die Wortart der Quelle zu ihr passt; sonst gilt die der Quelle.
  const pos = wortartVon(e);
  const typ = (PASST[karte.type] || []).includes(pos) ? karte.type : (ART[pos] || null);
  setze('type', typ, wo(`Wortart laut Quelle: ${pos}`));
  const tab = e.tab || [], hf = e.hf || [];
  if (pos === 'verb') {
    // dieselbe Form wie gesucht: nennt die Quelle zwei Vokalisierungen der Vergangenheit, zählt die des gesuchten Wortes
    const vergAlle = tab.filter(f => hat(f, 'active', 'third-person', 'singular', 'masculine', ['past', 'perfective']) && !f.t.includes('non-past')).map(f => f.f);
    const vergForm = [...vergAlle, ...(e.kopf || []).map(f => f.f)].filter(f => k1(f) === k1(wort) || k2(f) === k2(wort));
    setze('ar', nimmWie(vergForm, wort, vergForm[0]), wo(vergAlle.some(f => k1(f) === k1(wort)) ? 'Beugungstabelle: Vergangenheit, 3. Person m. Einzahl' : 'Kopfzeile'));
    setze('past', v.ar && v.ar.w, v.ar && v.ar.wo);
    const gegK = voll(karte.present) ? k1(karte.present) : null;
    let geg = tab.filter(f => hat(f, 'active', 'third-person', 'singular', 'masculine', 'indicative', ['non-past', 'imperfective']));
    if (geg.length > 1 && gegK && geg.some(f => k1(f.f) === gegK)) geg = geg.filter(f => k1(f.f) === gegK);
    if (geg.length) setze('present', [...new Set(geg.map(f => f.f))].join('|'), wo('Beugungstabelle: Gegenwart, 3. Person m. Einzahl'));
    else { const h = hf.filter(f => f.t.includes('non-past')); if (h.length) setze('present', h.map(f => f.f).join('|'), wo('Kopfzeile: Gegenwart (ohne Endvokal)')); }
    const befK = voll(karte.imperative) ? k1(karte.imperative) : null;
    let bef = tab.filter(f => hat(f, 'active', 'imperative', 'second-person', 'singular', 'masculine'));
    if (bef.length > 1 && befK && bef.some(f => k1(f.f) === befK)) bef = bef.filter(f => k1(f.f) === befK);
    if (bef.length) setze('imperative', [...new Set(bef.map(f => f.f))].join('|'), wo('Beugungstabelle: Befehl, 2. Person m. Einzahl'));
    let mas = [...hf, ...tab].filter(f => f.t.includes('noun-from-verb')).map(f => f.f);
    mas = [...new Set(mas)];
    if (mas.length) {
      const masK = teileVon(karte.masdar);
      const gewaehlt = masK.length && mas.some(m => masK.some(b => k1(b) === k1(m))) ? mas.filter(m => masK.some(b => k1(b) === k1(m))) : mas;
      const mitEndung = gewaehlt.map(m => {
        const formen = [];
        for (const x of (nachNackt.get(nackt(m)) || []).filter(x => x.pos === 'noun')) for (const f of x.tab || []) if (hat(f, 'indefinite', 'nominative', 'singular') && k1(f.f) === k1(m)) formen.push(f.f);
        return nimmWie([...formen, m], masK.find(b => k1(b) === k1(m)), formen[0] || m);
      });
      setze('masdar', mitEndung.join(trenner(karte.masdar)), wo('Verbalsubstantiv' + (mas.length > gewaehlt.length ? ` (die Quelle nennt ${mas.length})` : '')));
    }
  } else {
    // Nominal: unter den Formen, die die Quelle für dieses Wort nennt (Nominativ der Beugungstabelle mit Endung,
    // Kopfzeile ohne Endung), kommt die auf die Karte, die der bisherigen Schreibweise gleicht.
    const nomi = tab.filter(f => hat(f, 'nominative') && !f.t.includes('construct'));
    const arFormen = nomi.filter(f => k1(f.f) === k1(wort) || (artikelAb && f.t.includes('definite') && k1(ohneArtikel(f.f)) === k1(ziel)));
    const arStandard = (arFormen.find(f => f.t.includes(hatArtikel(wort) ? 'definite' : 'indefinite')) || arFormen[0] || {}).f;
    const arWahl = nimmWie([...arFormen.map(f => f.f), ...(kopf ? [kopf.f] : [])], wort, arStandard || (kopf && kopf.f));
    const ausTabelle = arFormen.some(f => f.f === arWahl);
    // nur wenn die Form der Quelle dasselbe Wort ist wie das gesuchte (auch der Artikel muss in der Quelle stehen)
    if (arWahl && (k1(arWahl) === k1(wort) || k2(arWahl) === k2(wort))) setze('ar', arWahl, wo(ausTabelle ? 'Beugungstabelle: Nominativ' : 'Kopfzeile (ohne Endvokal)'));
    if (v.ar && !ausTabelle && !arFormen.length) v.ar.ohneEndung = true;
    if (!v.ar || (voll(karte.sg) && k1(karte.sg) !== k1(wort))) {
      // die Karte nennt eine andere Einzahl als das Stichwort (das Stichwort ist dann selbst eine Mehrzahl oder Steigerung): Sache der Hand
    } else setze('sg', voll(karte.sg) ? nimmWie([...arFormen.map(f => f.f), ...(kopf ? [kopf.f] : [])], karte.sg, arWahl) : arWahl, v.ar && v.ar.wo);
    const g = kopf && (kopf.t.includes('masculine') ? 'masculine' : kopf.t.includes('feminine') ? 'feminine' : null);
    setze('gender', g, wo('Kopfzeile: Geschlecht'));
    // Trägt der Auszug kein Geschlecht, nennt es oft die Kopfvorlage der abgelegten Seite (ersatz-seiten.mjs) — es gilt,
    // wenn sie es an GENAU dieser Kopfform nennt und die Seite sich dabei nicht widerspricht.
    if (!g && kopf && pos !== 'adj') {
      const seite = WURZELSEITEN[e.w];
      const zeilen = seite ? [...(seite.geschlecht || []), ...seite.einheiten.flatMap(x => x.geschlecht || [])].filter(z => z.f.some(f => k1(f) === k1(kopf.f))) : [];
      const eins = [...new Set(zeilen.map(z => z.g))];
      if (eins.length === 1) setze('gender', eins[0], `en.wiktionary „${e.w}“, Kopfvorlage der Seite: Geschlecht (Fassung vom ${String(seite.zeit).slice(0, 10)})`);
    }
    const feld = (name, alle, zahl, was) => {
      if (!alle.length) return;
      const bisher = teileVon(karte[name]);
      const gw = bisher.length && alle.some(p => bisher.some(b => k1(b) === k1(p))) ? alle.filter(p => bisher.some(b => k1(b) === k1(p))) : alle;
      const fertig = gw.map(p => { const formen = nomi.filter(f => hat(f, 'indefinite', zahl) && k1(f.f) === k1(p)).map(f => f.f); return nimmWie([...formen, p], bisher.find(b => k1(b) === k1(p)), formen[0] || p); });
      setze(name, fertig.join(trenner(karte[name])), wo(was + (alle.length > gw.length ? ` (die Quelle nennt ${alle.length})` : '')));
    };
    // Nennt die Kopfzeile keine Mehrzahl, steht sie oft trotzdem in der Beugungstabelle: eine Mehrzahl, die auf langes i
    // endet, führt die Kopfzeile nur als Verbindungsform („construct"). Gemessen am 12.10.2026: bei 66 von 287 Karten ohne
    // Mehrzahl stand sie dort (Stuhl, Name, Hand …). Die Kopfzeile geht vor, wenn sie eine nennt.
    const plKopf = [...new Set(hf.filter(f => f.t.includes('plural') && !f.t.includes('feminine') && !f.t.includes('dual')).map(f => f.f))];
    const plTabelle = plKopf.length ? [] : [...new Set(nomi.filter(f => hat(f, 'indefinite', 'plural') && !f.t.includes('feminine') && !f.t.includes('dual')).map(f => f.f))];
    feld('pl', plKopf.length ? plKopf : plTabelle, 'plural', plKopf.length ? 'Mehrzahl' : 'Beugungstabelle: Mehrzahl, Nominativ');
    feld('femSg', [...new Set(hf.filter(f => f.t.includes('feminine') && !f.t.includes('plural') && !f.t.includes('dual')).map(f => f.f))], 'singular', 'weibliche Form');
    feld('femPl', [...new Set(hf.filter(f => f.t.includes('feminine') && f.t.includes('plural')).map(f => f.f))], 'plural', 'weibliche Mehrzahl');
  }
  const r = wurzelVon(e);
  // Schreibweise der App: das Hamza einer Wurzel steht auf dem Alif (die Quelle schreibt es ohne Träger)
  if (r) setze('root', r.w.replace(/ء/g, 'أ'), r.wo);
  v._en = (e.sinn || []).filter(s => s.g).slice(0, 6).map(s => s.g + ((s.t || []).length ? ' {' + s.t.slice(0, 4).join(',') + '}' : ''));
  return v;
}

/* ---------- Deutsch: Kandidaten aus den Quellen, und ob sie sich mit dem Sinn der Karte decken --------------- */
const deNorm = t => String(t || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ')
  .replace(/\b(der|die|das|ein|eine|einen|sich|etw\.?|etwas|jmd[mn]?\.?|jdn\.?|jdm\.?|jemand(en|em)?|zu)\b/g, ' ').replace(/[.!?:„“"‚‘'…]/g, ' ').replace(/\s+/g, ' ').trim();
const deTeile = t => String(t || '').split(/[,;\/]|\boder\b|\bbzw\.?\b/).map(deNorm).filter(Boolean);
/* Der Weg ÜBER DAS ENGLISCHE: der arabische Eintrag nennt die englische Bedeutung, der englische Eintrag nennt
 * dazu das Deutsch. Zwei Schritte, beide im Wiktionary; im Beleg stehen beide. */
const enDeutsch = new Map();
for (const e of ladeJsonl(path.join(AUSZUEGE, 'enwikt-deutsch.jsonl'))) { const s = String(e.w).toLowerCase(); (enDeutsch.get(s) || enDeutsch.set(s, []).get(s)).push(e); }
const EN_POS = { verb: ['verb'], noun: ['noun', 'name'], name: ['noun', 'name'], adj: ['adj'], adv: ['adv'] };
function ketteFuer(e) {
  const funde = [];
  for (const s of (e.sinn || [])) {
    if (!s.g || (s.t || []).includes('form-of')) continue;
    for (const roh of s.g.split(/[;,—]/)) {
      const kopf = roh.replace(/\([^)]*\)/g, ' ').replace(/^\s*(to|a|an|the)\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!kopf || kopf.split(' ').length > 3) continue;
      for (const en of enDeutsch.get(kopf) || []) {
        if (EN_POS[e.pos] && !EN_POS[e.pos].includes(en.pos)) continue;
        for (const k of en.k) for (const d of k.de) funde.push({ q: 'enwikt-kette', de: d, sicher: 'kette', sinn: k.sinn, wo: `en.wiktionary „${e.w}“ (${e.pos}): „${roh.trim()}“ → en.wiktionary „${en.w}“ (${en.pos}), Übersetzungen „${k.sinn}“` });
      }
    }
  }
  return funde;
}
const decktSich = (kandidat, teile) => { const k = deNorm(kandidat); return !!k && teile.some(t => t === k || t.startsWith(k + ' ') || k.startsWith(t + ' ')); };
/* Verweist ein Eintrag NUR auf seine Grundform („plural of …", „alternative form of …", „verbal noun of …"), steht die
 * Bedeutung dort. Das Deutsch der Grundform ist dann ein Kandidat, gekennzeichnet mit dem Verhältnis („gf"). Ob daraus
 * das Deutsch der Karte wird, entscheidet wie sonst der Vergleich mit dem Sinn der Karte — bei einer Mehrzahl oder
 * weiblichen Form trifft er selten, dann nennt die Hand das Wort als Teil („deTeile"). Beim Verbalsubstantiv steht die
 * deutsche Grundform des Verbs großgeschrieben da („Schreiben"); das ist von Claude so festgelegt und steht im Beleg. */
function grundformFuer(e) {
  const funde = [];
  if (!e.formVon) return funde;
  for (const s of e.sinn || []) for (const ziel of [...(s.fo || []), ...(s.ao || [])]) {
    const mitZeichen =/[ً-ْ]/.test(ziel);
    const lemmata = (nachNackt.get(nackt(ziel)) || []).filter(l => !l.formVon && l !== e && (!mitZeichen || (l.kopf || []).some(f => k1(f.f) === k1(ziel))));
    const masdar = /^verbal noun of /i.test(s.g || '');
    for (const l of lemmata) {
      const weg = `en.wiktionary „${e.w}“ (${e.pos}): „${s.g}“ → `;
      const dazu = [...ketteFuer(l), ...deutschFuer((l.kopf || [])[0] ? l.kopf[0].f : l.w, { de: '' }, []).alle.filter(f => f.sicher === 'vokalisiert' && !f.erkl && f.q !== 'arabdict')];
      for (const f of dazu) {
        const gross = masdar && l.pos === 'verb' && /^[a-zäöü]+$/.test(f.de);
        funde.push({ q: 'enwikt-kette', de: gross ? f.de[0].toUpperCase() + f.de.slice(1) : f.de, sicher: 'kette', sinn: f.sinn, gf: (s.g || '').replace(/\s*\([^)]*\)\s*$/, ''),
          wo: weg + f.wo + (gross ? ' — als Verbalsubstantiv großgeschrieben (von Claude)' : '') });
      }
    }
  }
  return funde;
}
function deutschFuer(wort, karte, eintraegeDazu) {
  const schl = new Set([ohneHamza(nackt(wort))]);
  if (hatArtikel(wort)) schl.add(ohneHamza(nackt(ohneArtikel(wort))));
  const alle = [];
  for (const s of schl) for (const f of deNachNackt.get(s) || []) {
    const vok = (f.vok || []).filter(Boolean);
    const vokForm = vok.find(x => k2(x) === k2(wort) || k2(x) === k2(ohneArtikel(wort)));
    const sicher = vokForm ? 'vokalisiert' : vok.length ? 'andere-vokale' : 'nur-schriftbild';
    alle.push({ ...f, sicher, vokForm });
  }
  const teile = deTeile(karte.de);
  const brauchbar = alle.filter(f => f.sicher !== 'andere-vokale');
  for (const f of brauchbar) f.deckt = !f.erkl && decktSich(f.de, teile);
  const kette = [];
  const gesehen = new Set();
  for (const e of eintraegeDazu || []) for (const f of [...ketteFuer(e), ...grundformFuer(e)]) {
    f.deckt = decktSich(f.de, teile);
    const schluessel = f.de + '|' + f.deckt;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    kette.push(f);
  }
  const ketteBehalten = [...kette.filter(f => f.deckt), ...kette.filter(f => !f.deckt && f.gf).slice(0, 10), ...kette.filter(f => !f.deckt && !f.gf).slice(0, 14)];
  return { teile, alle: [...brauchbar, ...ketteBehalten] };
}

/* ---------- Lauf --------------------------------------------------------------------------------------------- */
const FELDER = ['ar', 'type', 'gender', 'sg', 'pl', 'femSg', 'femPl', 'root', 'past', 'present', 'imperative', 'masdar'];
function vergleiche(feld, quelle, bestand) {
  const q = voll(quelle), b = voll(bestand);
  if (!q && !b) return 'beide-leer';
  if (q && !b) return 'nur-quelle';
  if (!q && b) return 'nur-bestand';
  const a = nfc(quelle), c = nfc(bestand);
  if (a === c) return 'gleich';
  if (['type', 'gender'].includes(feld)) return 'anders';
  if (feld === 'root') { const h = x => x.replace(/\s+/g, '').replace(/[أإآؤئ]/g, 'ء'); return a.replace(/\s+/g, '') === c.replace(/\s+/g, '') ? 'gleich' : h(a) === h(c) ? 'schreibweise' : 'anders'; }
  const m = x => x.split(/\s*[|\/]\s*/).filter(Boolean);
  const ma = m(a), mc = m(c);
  const gl = (x, y, f) => x.length === y.length && x.every(p => y.some(r => f(p) === f(r)));
  if (gl(ma, mc, x => x.replace(/ْ/g, ''))) return 'schreibweise';
  if (gl(ma, mc, k1)) return 'endung';
  if (gl(ma, mc, k2)) return 'schreibweise';
  if (ma.some(p => mc.some(r => k1(p) === k1(r)))) return 'teilweise';
  return 'anders';
}

const knapp = process.argv.includes('--knapp');
fs.mkdirSync(ARBEIT, { recursive: true });
const hand = {};
for (const buch of BUECHER) { const d = path.join(REPO, 'data-ersatz', 'hand', buch + '.json'); if (fs.existsSync(d)) hand[buch] = JSON.parse(fs.readFileSync(d, 'utf8')); }
const aus = [];
const zahlen = {};
for (const buch of BUECHER) {
  const karten = ladeBuch(buch);
  const z = zahlen[buch] = { karten: karten.length, stufe: {}, feld: {}, deutsch: {} };
  karten.forEach((karte, i) => {
    // Entscheidungen von Hand zu diesem Platz
    const h = (hand[buch] || {})[String(karte.id)] || {};
    // „trenne": [n, …] (Hand): die bisherige Karte schreibt mehrere Wörter ohne Leerzeichen zusammen — getrennt wird nach
    // dem n-ten Buchstaben (gezählt ohne Vokalzeichen); die Karte führt die Wörter dann getrennt.
    // „vorsilbe": [Wort, n] (Hand): am soundsovielten Wort (ab 0) hängt eine Vorsilbe aus n Buchstaben (bi-, wa-, fa-) —
    // gesucht wird getrennt, geschrieben zusammen. „..." in der Karte (Muster mit Auslassung) ist ein Trennzeichen.
    const wort = Array.isArray(h.trenne) ? trenneNach(nfc(karte.ar), h.trenne) : nfc(karte.ar);
    const fueg = wort.replace(/\.{3}|…/g, ' ... ').trim();
    const mehrteilig = /\s/.test(fueg) || Array.isArray(h.vorsilbe);
    const satz = { id: String(karte.id), buch, kap: karte.chapter, platz: i + 1, typ: karte.type, suche: { ar: nfc(karte.ar), de: karte.de } };
    let res = stufeFuer(wort, karte.type, karte);
    // Mehrere Einträge derselben Schreibung (gleichlautende Wörter): es zählt der, dessen Bedeutung den Sinn der Karte
    // trifft — gemessen am Deutsch, das der Weg über das Englische zu GENAU diesem Eintrag nennt. Nur wenn das bei
    // genau einem der Einträge so ist (Stufe „B1"); sonst bleibt die Wahl der Hand. Von Claude so festgelegt (11.10.2026):
    // ohne diese Wahl belegte eine Übersetzungstabelle nur Wort und Wortart, und die Formen des Eintrags fehlten der Karte.
    if (res.treffer.length > 1) {
      const sinnTeile = deTeile(karte.de);
      const mitSinn = res.treffer.filter(x => ketteFuer(x.e).some(f => decktSich(f.de, sinnTeile)));
      if (mitSinn.length === 1) res = { stufe: res.stufe.replace('B', 'B1'), treffer: mitSinn, alle: res.alle };
    }
    // Entscheidung von Hand: dieser Eintrag ist gemeint (Nummer = Zeile im Auszug enwikt-arabisch.jsonl, ab 0)
    // „form": true dazu — das Wort der Karte ist kein Stichwort, sondern eine FORM in der Tabelle dieses Eintrags
    // (Akkusativ, weibliche Form); belegt ist es nur, wenn die Tabelle die Form genau so führt.
    const handForm = Number.isInteger(h.eintrag) && eintraege[h.eintrag] && h.form === true ? formIn(eintraege[h.eintrag], wort) : null;
    if (Number.isInteger(h.eintrag) && eintraege[h.eintrag] && h.form !== true) {
      const e = eintraege[h.eintrag];
      res = { stufe: 'H', treffer: [{ e, artikelAb: hatArtikel(wort) && !nackt(e.w).startsWith('ال'), nimmQuelle: h.nimmQuelle === true }], alle: res.alle };
    }
    // „ohneEintrag" (Hand): der Eintrag gleicher Schreibung ist ein ANDERES Wort — dann zählt er nicht; ebenso wenn die
    // Hand das Wort als Fügung liest (trenne, vorsilbe) oder als Form eines anderen Eintrags (form)
    // (nennt die Hand zugleich einen Eintrag für das Ganze, gilt der)
    if (h.form === true || ((h.ohneEintrag === true || Array.isArray(h.trenne) || Array.isArray(h.vorsilbe)) && !Number.isInteger(h.eintrag))) res = { stufe: 'N', treffer: [], alle: res.alle };
    // Ein einzelnes Wort ohne eigenen Eintrag kann eine gebeugte Form sein (andere Person des Verbs, Zweizahl): dann
    // steht es in der vollständigen Tabelle seines Stichworts (Zusatzformen) — Stufe „F", behandelt wie eine Fügung aus einem Wort.
    // auch bei Stufe „C" (das Wörterbuch kennt die Buchstaben nur mit anderen Vokalzeichen): die Karte kann die Mehrzahl
    // eines dieser Wörter führen, und die steht in dessen vollständiger Tabelle
    // „ohneForm" (Hand): die Form in der Tabelle gehört zu einem ANDEREN Wort gleicher Schreibung — dann zählt sie nicht
    const formErlaubt = !mehrteilig && h.ohneForm !== true && h.form !== true;
    if (res.stufe === 'C' && formErlaubt && teilFund(wort).fund) res = { stufe: 'N', treffer: [], alle: res.alle };
    const einzelFund = handForm || (formErlaubt && res.stufe === 'N' ? teilFund(wort).fund : null);
    const einzelTags = einzelFund ? einzelFund.f.t || [] : [];
    // Eine finite Verbform (andere Person, Befehl) gilt nur für eine Karte, die einen Ausdruck führt. Bei einer Karte für
    // ein Verb, Nomen oder Adjektiv wäre es ein anderes, zufällig gleich geschriebenes Wort — gesehen am 11.10.2026:
    // „ashbaha" (Stamm IV, ähneln) ist buchstabengleich mit der 1. Person Konjunktiv von Stamm I.
    const finit = einzelTags.some(x => /-person$/.test(x)) && !einzelTags.includes('participle');
    const einzelOk = !!einzelFund && (!finit || ['expression', 'phrase', 'particle'].includes(karte.type));
    if (res.stufe === 'N' && (mehrteilig || einzelOk)) {
      // Fügung aus mehreren Wörtern: jedes Wort einzeln suchen, und zwar GENAU in der Form, in der es in der Fügung steht
      // (z. B. erstes Glied ohne Tanwin, zweites im Genitiv mit Artikel) — die Beugungstabelle der Quelle nennt diese Formen.
      // „|" oder „/" zwischen zwei Formen (männlich | weiblich) ist ein Trennzeichen, kein Wort
      const stuecke = [];
      fueg.split(/\s+/).forEach((t, nr) => {
        if (Array.isArray(h.vorsilbe) && h.vorsilbe[0] === nr) { const [vor, rest] = trenneNach(t, [h.vorsilbe[1]]).split(' '); stuecke.push({ t: vor, kleber: '' }, { t: rest || '', kleber: ' ' }); }
        else stuecke.push({ t, kleber: ' ' });
      });
      let teilNr = -1;
      const alleTeile = stuecke.map(({ t, kleber }) => {
        if (/^(?:[|\/]|\.{3})$/.test(t)) return { t, trenner: true, kleber };
        teilNr++;
        // „teilEintrag": {Wort ab 0: Eintragsnummer} (Hand): dieses Wort der Fügung schreibt die bisherige Karte mit anderen
        // Vokalzeichen, als ihr eigener Sinn verlangt („Baumeister" statt „Gebäude") — dann gilt die Stichwortform des
        // genannten Eintrags; sie kommt auf die Karte, und der Unterschied steht in der Liste.
        const eHand = h.teilEintrag && Number.isInteger(h.teilEintrag[teilNr]) ? eintraege[h.teilEintrag[teilNr]] : null;
        const kopfHand = eHand && (eHand.kopf || [])[0];
        const { r, fund } = kopfHand ? { r: { stufe: 'H', treffer: [{ e: eHand }] }, fund: { e: eHand, f: kopfHand, w: nfc(kopfHand.f), hinweis: 'die bisherige Karte schreibt dieses Wort mit anderen Vokalzeichen; die Hand hat diesen Eintrag gewählt' } }
          : handForm && !mehrteilig ? { r: { stufe: 'H', treffer: [] }, fund: handForm } : teilFund(t, mehrteilig);
        let de = kopfHand ? [] : [...new Set(deutschFuer(t, { de: '' }, []).alle.filter(d => d.sicher === 'vokalisiert' && !d.erkl).map(d => d.de))].slice(0, 8);
        // nennt keine Quelle Deutsch zu genau dieser Form, dann das Deutsch des Stichworts (Weg über das Englische)
        if (!de.length && fund) de = [...new Set(ketteFuer(fund.e).map(f => f.de))].slice(0, 8);
        return { t, kleber, stufe: r.stufe, ref: r.treffer.map(x => x.e.ref), fund, de };
      });
      const teile = alleTeile.filter(t => !t.trenner), paar = alleTeile.some(t => t.trenner && t.t !== '...');
      satz.stufe = mehrteilig ? 'M' : 'F';
      satz.teile = teile.map(t => ({ t: t.t, stufe: t.stufe, ref: t.ref, form: t.fund ? t.fund.f.t.join('+') : null, de: t.de, en: t.fund ? (t.fund.e.sinn || []).filter(s => s.g).slice(0, 2).map(s => s.g) : [] }));
      if (teile.every(t => t.fund)) {
        const kopfE = teile[0].fund.e, kopfPos = wortartVon(kopfE);
        const beleg = (paar ? 'zwei belegte Formen nebeneinander: ' : mehrteilig ? 'aus belegten Formen gefügt: ' : 'gebeugte Form laut der vollständigen Tabelle der Quelle: ') + teile.map(t => `en.wiktionary „${t.fund.e.w}“ (${t.fund.e.pos}), ${t.fund.f.t.length ? 'Form ' + t.fund.f.t.join(' ') : 'Kopfzeile'}${t.fund.hinweis ? ' [' + t.fund.hinweis + ']' : ''}`).join(' + ');
        const v = satz.vorschlag = { ar: { w: alleTeile.map((t, nr) => (t.trenner ? t.t : t.fund.w) + (nr < alleTeile.length - 1 ? t.kleber : '')).join(''), wo: beleg + (Array.isArray(h.trenne) ? ' — die bisherige Karte schreibt die Wörter ohne Leerzeichen zusammen; von der Hand getrennt' : '') + (Array.isArray(h.vorsilbe) ? ' — das erste dieser Stücke ist eine angehängte Vorsilbe; von der Hand so gelesen' : '') } };
        // ein Partizip oder Verbalsubstantiv aus der Tabelle eines Verbs ist ein Nomen: passt zu einer Karte „noun" oder „adjective"
        const nominalform = !mehrteilig && kopfPos === 'verb' && ['noun', 'adjective'].includes(karte.type) && (einzelTags.includes('participle') || einzelTags.includes('noun-from-verb'));
        if (['expression', 'phrase'].includes(karte.type) || (!mehrteilig && finit && karte.type === 'particle') || nominalform || (PASST[karte.type] || []).includes(kopfPos))
          v.type = { w: karte.type, wo: mehrteilig ? `Fügung aus ${teile.length} Wörtern; Wortart des ersten Wortes laut Quelle: ${kopfPos}` : `gebeugte Form; Wortart des Stichworts laut Quelle: ${kopfPos}` + (nominalform ? ' — die Form ist ein Partizip oder Verbalsubstantiv, also ein Nomen' : '') };
        // „artOk" (Hand): dasselbe Wort, das Stichwort hat nur eine andere Wortart als die bisherige Karte — dann gilt die der Quelle
        else if (!mehrteilig && h.artOk === true && ART[kopfPos]) v.type = { w: ART[kopfPos], wo: `gebeugte Form; Wortart des Stichworts laut Quelle: ${kopfPos} — weicht von der bisherigen Einteilung („${karte.type}“) ab; von der Hand zugelassen, es ist dasselbe Wort` };
        if (karte.type === 'noun' || karte.type === 'adjective') {
          const kf = (kopfE.kopf || [])[0];
          const g = kf && (kf.t.includes('masculine') ? 'masculine' : kf.t.includes('feminine') ? 'feminine' : null);
          if (g) v.gender = { w: g, wo: `en.wiktionary „${kopfE.w}“ (${kopfE.pos}), Kopfzeile: Geschlecht des ersten Wortes` };
          if (voll(karte.sg) && nfc(karte.sg) === wort) v.sg = { ...v.ar };
        }
        v._en = teile.map(t => (t.fund.e.sinn || []).filter(s => s.g).slice(0, 2).map(s => s.g).join(' ; '));
        satz.vergleich = {};
        for (const f of FELDER) satz.vergleich[f] = vergleiche(f, v[f] && v[f].w, karte[f]);
      }
    } else satz.stufe = res.stufe;
    if (res.treffer.length === 1) {
      const { e, artikelAb, nimmQuelle } = res.treffer[0];
      satz.ref = e.ref; satz.artikelAb = artikelAb || undefined; satz.formVon = e.formVon || undefined;
      // nimmQuelle: die Hand hat entschieden, dass die Schreibung der Quelle gilt, obwohl sie von der bisherigen abweicht —
      // dann wird mit der Form der Quelle weitergesucht statt mit der bisherigen.
      const kopfForm = (e.kopf || [])[0] && e.kopf[0].f;
      const v = satz.vorschlag = vorschlag(e, nimmQuelle && kopfForm ? kopfForm : wort, nimmQuelle ? false : artikelAb, nimmQuelle ? { ...karte, sg: null } : karte);
      if (nimmQuelle) satz.nimmQuelle = true;
      // nimmForm: die Karte führt nicht das Stichwort, sondern eine seiner Formen (etwa die Befehlsform als Ausruf) —
      // dann steht diese Form der Quelle als Arabisch auf der Karte
      if (h.nimmForm && v[h.nimmForm]) v.ar = { w: v[h.nimmForm].w.split(/\s*[|\/]\s*/)[0], wo: v[h.nimmForm].wo };
      satz.vergleich = {};
      for (const f of FELDER) { const erg = vergleiche(f, v[f] && v[f].w, karte[f]); satz.vergleich[f] = erg; if (erg !== 'beide-leer') { z.feld[f] ||= {}; z.feld[f][erg] = (z.feld[f][erg] || 0) + 1; } }
    } else if (res.treffer.length > 1) satz.wahl = res.treffer.map(x => ({ ref: x.e.ref, kopf: (x.e.kopf || []).map(f => f.f), en: (x.e.sinn || []).slice(0, 3).map(s => s.g) }));
    else if (res.alle.length) satz.andereVokale = res.alle.map(x => ({ ref: x.e.ref, kopf: (x.e.kopf || []).map(f => f.f), en: (x.e.sinn || []).slice(0, 2).map(s => s.g) }));
    // Der Schlüssel zum Lehrbuch: Zeilen, deren Stichwort (oder Nebenform) diesem Wort gleicht. Fürs Arabische zählt er,
    // wenn das Wörterbuch keinen eindeutigen Eintrag hat: die Zeile der GLEICHEN Lektion, sonst die einzige des Buches.
    // hat die Hand die Schreibung der Quelle gelten lassen (nimmQuelle), wird der Schlüssel mit DIESER Schreibung befragt
    const wortS = res.treffer.length === 1 && res.treffer[0].nimmQuelle && (res.treffer[0].e.kopf || [])[0] ? nfc(res.treffer[0].e.kopf[0].f) : wort;
    let sch = schluesselFuer(buch, wortS, karte.chapter);
    // Führt die Lektion dieselben Buchstaben mit ANDEREN Vokalzeichen, steht die Zeile nur auf dem Blatt. Die Hand kann
    // sie mit „schluessel": true (oder der Zeilennummer) gelten lassen — dann steht die Form des Buches auf der Karte,
    // und die Abweichung von der bisherigen Karte kommt in die Liste „Unterschiede".
    let schNah = [];
    if (schluessel[buch] && !sch.some(x => x.alsKopf)) {
      const nah = (schluessel[buch].nah.get(ohneHamza(nackt(wort))) || []).filter(x => x.zeile.lektion === karte.chapter);
      schNah = nah.slice(0, 3);
      if (nah.length) satz.schluesselNah = nah.slice(0, 3).map(x => ({ nr: x.zeile.nr, form: x.form, de: x.zeile.de }));
      const gewaehlt = h.schluessel ? nah.filter(x => h.schluessel === true || x.zeile.nr === h.schluessel) : [];
      if (gewaehlt.length === 1) sch = [{ ...gewaehlt[0], alsKopf: true, streng: true, lektionGleich: true, vonHand: true }, ...sch];
    }
    // dasselbe für eine Zeile der Lektion, die nur in der Schreibweise abweicht (Hamza-Träger, Dolchalif, Tanwin am Alif)
    if (h.schluessel) sch = sch.map(x => x.alsKopf && x.lektionGleich && !x.streng && (h.schluessel === true || x.zeile.nr === h.schluessel) ? { ...x, streng: true, vonHand: true } : x);
    if (sch.length) satz.schluessel = sch.slice(0, 5).map(x => ({ lektion: x.zeile.lektion, seite: x.zeile.seite, kopf: x.alsKopf, streng: x.streng, form: x.form, de: x.zeile.de, pl: x.zeile.mehrzahl, geg: x.zeile.geg, verb: x.zeile.verb }));
    const schKopf = sch.filter(x => x.alsKopf);
    const sWahl = schKopf.find(x => x.lektionGleich) || (schKopf.length === 1 ? schKopf[0] : null);
    // Ein eigener Eintrag des Wörterbuchs geht dem Schlüssel vor (er bringt Formen und Wurzel mit), ebenso eine Fügung,
    // deren Wörter alle in genau der Form der Karte belegt sind („M"). Ein einzelnes Wort, das nur als gebeugte Form in
    // einer Tabelle steht („F"), nicht: die Zeile des Lehrbuchs nennt genau dieses Wort samt Mehrzahl oder
    // Gegenwartsform (Rang 2 seiner Belege, das Wörterbuch ist Rang 3). Gemessen am 11.10.2026: gilt der Schlüssel
    // auch vor „M", wechseln 35 Plätze und einer verliert die Wortart (eine Fügung, die der Schlüssel als Nomen zeigt).
    const woerterbuchGilt = satz.vorschlag && satz.vorschlag.ar && satz.vorschlag.type && (!String(satz.stufe).includes('*') || h.artOk === true) && satz.stufe !== 'F';
    // fürs Arabische zählt die Zeile nur bei gleicher Schreibung (bis auf die Schlussendung) oder auf das Wort der Hand:
    // wo der Schlüssel knapper vokalisiert als die Karte, soll seine Form nicht von selbst auf die Karte kommen
    // Zu einer Fügung „Verb + Verhältniswort", die ganz aus dem Wörterbuch belegt ist („M"): führt die Zeile des Schlüssels
    // ihr Verb, bleibt das Arabische beim Wörterbuch (dort mit allen Zeichen, auch dem Sukun, das der Schlüssel oft
    // weglässt), und die Gegenwartsform des Verbs kommt aus der Zeile dazu — die Fügung allein brächte sie nicht mit.
    if (sWahl && sWahl.streng && sWahl.nurErstes && karte.type === 'verb' && satz.stufe === 'M' && woerterbuchGilt && !satz.vorschlag.present) {
      const vS = vorschlagAusSchluessel(sWahl, wort, karte, buch);
      if (vS.present) { satz.vorschlag.present = vS.present; satz.vergleich.present = vergleiche('present', vS.present.w, karte.present); }
    }
    if (sWahl && ((sWahl.streng && !woerterbuchGilt) || sWahl.vonHand) && !Number.isInteger(h.eintrag)) {
      const v = vorschlagAusSchluessel(sWahl, wort, karte, buch);
      if (sWahl.nurErstes && v.ar) {
        // die übrigen Wörter der Karte (Verhältniswort) einzeln im Wörterbuch suchen, genau in der Form der Karte
        const rest = wort.split(/\s+/).slice(1).map(t => ({ t, fund: teilFund(t, true).fund }));
        if (rest.every(x => x.fund)) {
          const dazu = rest.map(x => `en.wiktionary „${x.fund.e.w}“ (${x.fund.e.pos}), ${x.fund.f.t.length ? 'Form ' + x.fund.f.t.join(' ') : 'Kopfzeile'}${x.fund.hinweis ? ' [' + x.fund.hinweis + ']' : ''}`).join(' + ');
          v.ar = { w: [v.ar.w, ...rest.map(x => x.fund.w)].join(' '), wo: `${v.ar.wo} + ${dazu}`, q: 'buch' };
          if (v.past) v.past = { ...v.ar };
        } else delete v.ar;
      }
      if (v.ar) {
        satz.stufeWoerterbuch = satz.stufe;
        satz.stufe = 'S' + (sWahl.vonHand ? 'H' : sWahl.streng ? '' : '2');
        satz.vorschlag = { ...v, _en: (satz.vorschlag && satz.vorschlag._en) || [] };
        satz.vergleich = {};
        for (const f of FELDER) satz.vergleich[f] = vergleiche(f, v[f] && v[f].w, karte[f]);
      }
    }
    z.stufe[satz.stufe] = (z.stufe[satz.stufe] || 0) + 1;
    // arabdict nennt dieselben Buchstaben mit ANDEREN Vokalzeichen: das steht nur auf dem Blatt. Die Hand kann eine dieser
    // Formen mit „arabdict": true (oder der Nummer vom Blatt) gelten lassen — dann steht die Form von arabdict auf der
    // Karte, und die Abweichung von der bisherigen Karte kommt in die Liste „Unterschiede".
    const adSchl = new Set([ohneHamza(nackt(wort)), ...(hatArtikel(wort) ? [ohneHamza(nackt(ohneArtikel(wort)))] : [])]);
    const adAlle = [...adSchl].flatMap(s => deNachNackt.get(s) || []).filter(f => f.q === 'arabdict' && (f.vok || []).length);
    const adAnders = [...new Set(adAlle.filter(f => !f.vok.some(x => k2(x) === k2(wort) || k2(x) === k2(ohneArtikel(wort)))).map(f => nfc(f.vok[0])))];
    if (adAnders.length) satz.arabdictAnders = adAnders.slice(0, 5).map((form, i) => ({ nr: i + 1, form, de: [...new Set(adAlle.filter(f => nfc(f.vok[0]) === form).map(f => f.de))].slice(0, 6) }));
    const adHand = h.arabdict ? (h.arabdict === true ? (adAnders.length === 1 ? adAnders[0] : null) : adAnders[h.arabdict - 1] || null) : null;
    // Deutsch wird zu der Form gesucht, die auf die Karte kommt: zur Schreibung der Quelle, wenn die Hand sie gelten ließ
    const wortD = adHand || wortS;
    // „auch": weitere Einträge, deren Bedeutung ebenfalls auf der Karte steht (gleichlautendes zweites Wort)
    const d = deutschFuer(wortD, karte, [...res.treffer.map(x => x.e), ...(h.auch || []).map(n => eintraege[n]).filter(Boolean)]);
    // Stufe „F": das Wort ist eine gebeugte Form. Das Deutsch des Stichworts, in dessen Tabelle sie steht, ist ein Kandidat
    // (auf dem Blatt mit „°", wie bei einem Eintrag, der nur auf seine Grundform verweist) — bis zum 11.10.2026 stand es
    // nur beim Teil und dort auf acht Wörter gekürzt, sodass die Hand ein passendes neuntes nicht nennen konnte.
    if (satz.stufe === 'F' && einzelFund) {
      const dazu = ketteFuer(einzelFund.e).filter(f => !d.alle.some(x => x.de === f.de)).map(f => ({ ...f, gf: true, deckt: decktSich(f.de, d.teile) }));
      d.alle.push(...dazu.filter(f => f.deckt), ...dazu.filter(f => !f.deckt).slice(0, 14));
    }
    // arabdict-Zeilen mit denselben Buchstaben, aber ANDEREN (oder weniger) Vokalzeichen: ihr Deutsch ist ein Kandidat
    // „nur zum Schriftbild". Fürs Arabische zählen sie nicht, und von selbst gilt ihr Deutsch nie (oft ist es ein anderes
    // Wort); die Hand kann es nennen, wenn das Arabische anderswo belegt ist und der Sinn derselbe ist.
    for (const f of adAlle.filter(f => adAnders.includes(nfc(f.vok[0])))) if (!d.alle.some(x => x.de === f.de && x.q === 'arabdict'))
      d.alle.push({ q: 'arabdict', de: f.de, sicher: 'nur-schriftbild', wo: `${f.wo} — dort mit anderen Vokalzeichen geschrieben als auf der Karte`, deckt: decktSich(f.de, d.teile) || undefined });
    // das Deutsch des Schlüssels steht vorn; „sch" sagt, ob die Zeile das Wort als Stichwort führt, ob die Schreibung
    // bis auf die Schlussendung gleich ist und ob es die Lektion des Kapitels ist
    d.alle.unshift(...sch.map(x => ({ q: 'schluessel', de: x.zeile.de, sicher: 'vokalisiert',
      wo: schluesselOrt(buch, x.zeile) + (x.zeile.berichtigt ? ' (Schreibfehler oder englischer Rest der Vorlage berichtigt)' : '') + (x.alsKopf ? '' : ' — dort als Nebenform (Mehrzahl oder Variante) genannt'),
      deckt: deTeile(x.zeile.de).some(g => decktSich(g, d.teile)), sch: { kopf: x.alsKopf, streng: x.streng, lektion: x.lektionGleich, nurErstes: x.nurErstes || undefined } })));
    // Zeilen derselben Lektion mit denselben Buchstaben, aber ANDEREN Vokalzeichen (meist schreibt der Schlüssel knapper
    // als die Karte): ihr Deutsch ist ein Kandidat „nur zum Schriftbild". Fürs Arabische zählt die Zeile nicht; ist es
    // anderswo belegt, kann die Hand dieses Deutsch nennen — es stammt aus seinem Buch (Rang 2 seiner Belege).
    d.alle.push(...schNah.filter(x => !sch.some(y => y.zeile === x.zeile)).map(x => ({ q: 'schluessel', de: x.zeile.de, sicher: 'nur-schriftbild',
      wo: schluesselOrt(buch, x.zeile) + ` — dort mit anderen Vokalzeichen geschrieben als auf der Karte: ${x.form}`,
      deckt: deTeile(x.zeile.de).some(g => decktSich(g, d.teile)) })));
    // Hat das Wörterbuch keinen eigenen Eintrag, nennt aber eine Übersetzungstabelle das arabische Wort MIT Vokalzeichen in
    // genau dieser Schreibung, ist das ein Beleg fürs Arabische (ohne Schlussendung, wie eine Kopfzeile) — Stufe „T".
    // Dasselbe gilt für ein Wortpaar von arabdict — Stufe „D", wenn nur arabdict das Wort so nennt („DH": von der Hand
    // zugelassene Form mit anderen Vokalzeichen). arabdict darf auch eine ganze Fügung belegen, die Tabellen nicht.
    // Formen, die sich NUR in der Schlussendung unterscheiden, sind dieselbe Form: auf die Karte kommt die mit Endung;
    // nennen die Stellen verschiedene Endungen, dann die, die der bisherigen Schreibung gleicht — sonst keine.
    // Wortart: die Einteilung der Karte bleibt, wenn eine der Stellen eine dazu passende Wortart nennt. Passt keine,
    // gilt die Wortart der Quelle nur, wenn sie dort ausdrücklich steht und alle Stellen dieselbe nennen.
    // „ohneEintrag" (Hand): der einzige Eintrag des Wörterbuchs ist ein ANDERES Wort gleicher Schreibung (das Verbalsubstantiv
    // zur Karte, die das Verb führt) — dann sollen Übersetzungstabelle oder arabdict das Wort belegen.
    // bei arabdict genügt Gleichheit bis auf die Schreibweise (k2: Hamza-Träger, Fatha vor Ta marbuta), bei den Tabellen wie bisher k1
    const tabAlle = d.alle.filter(f => f.sicher === 'vokalisiert' && !f.sch && f.vokForm && (f.q === 'arabdict' ? (!adHand || nfc(f.vokForm) === adHand) : (k1(f.vokForm) === k1(wortD) && !!f.pos && !mehrteilig && !adHand)));
    // das französische Wiktionary zählt nur, wo sonst keine Stelle das Wort so nennt — so ändert es keinen Platz,
    // den eine Übersetzungstabelle oder arabdict schon belegt
    const tab = tabAlle.some(f => f.q !== 'frwikt') ? tabAlle.filter(f => f.q !== 'frwikt') : tabAlle;
    // Eine gebeugte Form aus einer Tabelle („F") belegt die Schreibung, nicht die Deutung: „regnerisch" gleicht Buchstabe
    // für Buchstabe dem Partizip Passiv von „fliegen" (gesehen am 11.10.2026, ebenso „Lehmarbeiter" = „hungrig"). Nennt
    // eine Übersetzungstabelle oder arabdict dieselbe Form MIT einem Deutsch, das den Sinn der Karte trifft, belegt diese
    // Stelle Wort und Sinn zusammen und geht vor.
    const tabMitSinn = satz.stufe === 'F' && tab.some(f => f.deckt);
    if (!satz.vorschlag || adHand || h.ohneEintrag === true || (satz.stufe === 'F' && !satz.vorschlag.type) || tabMitSinn) {
      const hatEndung = f => /[ً-ِ]$|ً[اى]$/.test(f);      // Tanwin oder kurzer Vokal am Schluss, auch Tanwin vor dem Schluss-Alif
      const formen = [...new Set(tab.map(f => nfc(f.vokForm)))], mitEndung = formen.filter(hatEndung);
      // Hat die Karte selbst eine Endung und nennen die Stellen nur ANDERE Endungen, ist es womöglich ein anderes Wort
      // (Verb auf -a gegen Partizip auf -in): dann gilt nur eine Form ohne Endung, sonst keine.
      const ohneEnd = formen.filter(f => !hatEndung(f));
      const form = nimmWie(formen, wortD, null) || (hatEndung(wortD) ? ohneEnd[0] || null : (mitEndung.length === 1 ? mitEndung[0] : ohneEnd[0] || null));
      if (form) {
        const beleg = tab.find(f => nfc(f.vokForm) === form);
        // vor dem Ta marbuta steht immer ein Fatha; schreibt die Quelle es nicht, wird es ergänzt (steht dann im Beleg)
        // ein Dehnungsstrich MITTEN im Wort ist Zierde der Quelle (arabdict streckt manche Wörter) und kein Buchstabe
        const ohneZier = form.replace(/(?<=[ء-ْ])ـ+(?=[ء-ي])/g, '');
        const mitTa = ohneZier.replace(/(.)([ً-ْٰ]*)ة/gu, (m, b, marken) => (b === 'ا' || marken.includes('َ')) ? m : b + marken + 'َة').normalize('NFC');
        // vor einem Dehnungs-Alif im Wortinnern steht immer ein Fatha; schreibt die Quelle es nicht, wird es ergänzt —
        // aber nur, wenn die Form danach der bisherigen Schreibung gleicht (bis auf die Schlussendung). Nicht am Lam des
        // Artikels und nicht vor einem Alif am Wortende (dort kann es das stumme Alif der Mehrzahl sein).
        const mitAlif = mitTa.replace(/([ب-ي])(ّ?)(?=ا[ء-ي])/gu, (m, b, schadda, ort) => (ort === 1 && mitTa[0] === 'ا') ? m : b + schadda + 'َ').normalize('NFC');
        const alifErgaenzt = mitAlif !== mitTa && k1(mitAlif) === k1(wortD);
        const ganz = alifErgaenzt ? mitAlif : mitTa;
        const arten = [...new Set(tab.map(f => f.pos).filter(Boolean))];
        const passt = tab.find(f => f.pos && (PASST[karte.type] || []).includes(f.pos));
        const fest = [...new Set(tab.filter(f => f.pos && f.posFest !== false).map(f => f.pos))];
        const wieGenannt = f => f.q === 'frwikt' ? `Wortart des Eintrags laut Quelle: ${f.pos}` : f.q === 'arabdict' ? `Wortart des deutschen Gegenstücks „${f.de}“: ${f.pos} (${f.posWie || 'laut Seite'})` : `Wortart des übersetzten Stichworts laut Quelle: ${f.pos}`;
        const v = { ar: { w: ganz, wo: `${beleg.wo}: das arabische Wort steht dort mit Vokalzeichen${hatEndung(form) ? '' : ' (ohne Schlussendung)'}` + (ohneZier !== form ? ' — die Dehnungsstriche, mit denen die Quelle das Wort streckt, sind weggelassen (reine Zierde)' : '') + (mitTa !== ohneZier ? ' — das Fatha vor dem Ta marbuta steht dort nicht und ist ergänzt (an dieser Stelle steht immer Fatha)' : '') + (alifErgaenzt ? ' — das Fatha vor dem Dehnungs-Alif steht dort nicht und ist ergänzt (an dieser Stelle steht immer Fatha)' : '') + (adHand ? ' — arabdict schreibt es mit anderen Vokalzeichen als die bisherige Karte; von der Hand zugelassen' : ''), q: beleg.q, ohneEndung: !hatEndung(form) || undefined }, _en: [] };
        if (passt) v.type = { w: karte.type, wo: `${passt.wo}: ${wieGenannt(passt)}`, q: passt.q };
        else if (fest.length === 1 && arten.length === 1 && ART[fest[0]]) { const f = tab.find(x => x.pos === fest[0]); v.type = { w: ART[fest[0]], wo: `${f.wo}: ${wieGenannt(f)}`, q: f.q }; }
        // „artOk" (Hand): dasselbe Wort, die Stelle nennt nur eine andere Wortart als die bisherige Karte (Adjektiv statt
        // Nomen) — dann gilt die Wortart der Stelle, wie bei einem Eintrag des Wörterbuchs; der Unterschied steht in der Liste
        else if (h.artOk === true) { const f = tab.find(x => x.pos && x.posFest !== false && ART[x.pos]) || tab.find(x => x.pos && ART[x.pos]); if (f) v.type = { w: ART[f.pos], wo: `${f.wo}: ${wieGenannt(f)} — weicht von der bisherigen Einteilung („${karte.type}“) ab; von der Hand zugelassen, es ist dasselbe Wort`, q: f.q }; }
        if (voll(karte.sg) && k1(karte.sg) === k1(wort)) v.sg = { w: v.ar.w, wo: v.ar.wo, q: beleg.q };
        const neu = adHand ? 'DH' : tab.every(f => f.q === 'frwikt') ? 'W' : tab.some(f => f.q !== 'arabdict') ? 'T' : 'D';
        if (neu === 'W') v._fr = beleg.fr || [];
        z.stufe[satz.stufe]--; satz.stufeWoerterbuch = satz.stufe; satz.stufe = neu; z.stufe[neu] = (z.stufe[neu] || 0) + 1;
        satz.vorschlag = v;
        satz.vergleich = {};
        for (const f of FELDER) satz.vergleich[f] = vergleiche(f, v[f] && v[f].w, karte[f]);
      }
    }
    // Vor dem Ta marbuta steht immer ein Fatha (außer nach Alif). Schreibt eine Quelle es nicht (gesehen am 11.10.2026 an
    // einer Kopfzeile des Wörterbuchs), wird es ergänzt und im Beleg genannt — sonst stünde das Wort unvollständig auf der Karte.
    if (satz.vorschlag) {
      let ergaenzt = false;
      for (const f of AR_FELD) {
        const x = satz.vorschlag[f];
        if (!x || !voll(x.w)) continue;
        const neu = nfc(x.w).replace(/([^اً-ْٰ\s|\/])(ّ?)ة/gu, (m, b, schadda) => b + schadda + 'َة').normalize('NFC');
        if (neu !== nfc(x.w)) { satz.vorschlag[f] = { ...x, w: neu, wo: `${x.wo} — das Fatha vor dem Ta marbuta steht dort nicht und ist ergänzt (an dieser Stelle steht immer Fatha)` }; ergaenzt = true; }
      }
      if (ergaenzt) { satz.vergleich = {}; for (const f of FELDER) satz.vergleich[f] = vergleiche(f, satz.vorschlag[f] && satz.vorschlag[f].w, karte[f]); }
    }
    satz.deutsch = d.alle.map(f => ({ de: f.de, q: f.q, wo: f.wo, sicher: f.sicher, deckt: f.deckt || undefined, erkl: f.erkl || undefined, sinn: f.sinn, unsicher: f.unsicher, sch: f.sch, gf: f.gf }));
    const dStufe = d.alle.some(f => f.sch && f.sch.kopf && f.sch.streng && (f.deckt || f.sch.lektion)) ? 'schluessel'
      : d.alle.some(f => f.deckt && f.sicher === 'vokalisiert') ? 'deckt-vokalisiert' : d.alle.some(f => f.deckt && f.sicher === 'kette') ? 'deckt-kette'
      : d.alle.some(f => f.deckt) ? 'deckt-schriftbild' : d.alle.length ? 'nur-andere-kandidaten' : 'keine-deutsche-quelle';
    satz.deStufe = dStufe;
    z.deutsch[dStufe] = (z.deutsch[dStufe] || 0) + 1;
    aus.push(satz);
  });
}
if (!knapp) {
  const ziel = path.join(ARBEIT, 'zuordnung.jsonl');
  fs.writeFileSync(ziel + '.neu', aus.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf8');
  fs.renameSync(ziel + '.neu', ziel);
}
const summe = { karten: 0, stufe: {}, feld: {}, deutsch: {} };
const zeig = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
for (const buch of BUECHER) {
  const z = zahlen[buch];
  summe.karten += z.karten;
  for (const [k, v] of Object.entries(z.stufe)) summe.stufe[k] = (summe.stufe[k] || 0) + v;
  for (const [k, v] of Object.entries(z.deutsch)) summe.deutsch[k] = (summe.deutsch[k] || 0) + v;
  for (const [f, o] of Object.entries(z.feld)) for (const [k, v] of Object.entries(o)) { summe.feld[f] ||= {}; summe.feld[f][k] = (summe.feld[f][k] || 0) + v; }
  console.log(`${buch} (${z.karten}): Stufe ${zeig(z.stufe)}\n    Deutsch: ${zeig(z.deutsch)}`);
}
console.log(`\nALLE (${summe.karten}): Stufe ${zeig(summe.stufe)}\n    Deutsch: ${zeig(summe.deutsch)}`);
console.log('\nFelder bei eindeutigem Treffer (Quelle gegen Bestand):');
for (const f of FELDER) if (summe.feld[f]) console.log(`    ${f}: ${zeig(summe.feld[f])}`);
console.log('\nÜbersetzungstabellen des englischen Wiktionary geladen: ' + (tabellenDa ? 'ja' : 'NEIN (Auszug fehlt noch)'));
console.log('Wortpaare von arabdict geladen: ' + arabdictPaare);
console.log('Einträge des französischen Wiktionary geladen: ' + frwiktEintraege);
console.log('Stufen: A eindeutig mit Vokalzeichen · A2 eindeutig, nur Schreibweise anders · B mehrere Einträge · B1 mehrere Einträge, nur einer mit dem Sinn der Karte · * andere Wortart · C nur das Schriftbild passt · N kein Eintrag · M mehrere Wörter · F gebeugte Form aus einer Formentabelle · S Schlüssel zum Lehrbuch · S2 Schlüssel, Zeile der Lektion in anderer Schreibweise · SH Schlüssel, Zeile von Hand gewählt ·T Übersetzungstabelle · D arabdict · DH arabdict mit anderen Vokalzeichen, von Hand · W nur das französische Wiktionary · H von Hand');
