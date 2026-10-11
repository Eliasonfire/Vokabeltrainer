/* ersatz-zuordnen.mjs -- sucht zu jedem Platz des Bestands die Einträge in den Wörterbuch-Auszügen und
 * schreibt einen VORSCHLAG je Platz: jede Angabe aus der Quelle, mit Fundstelle, und daneben der Vergleich
 * mit dem Bestand. Der Bestand (data/vokabeln-<buch>.js) dient nur als SUCHLISTE und zum Vergleich —
 * kein Feld wird von dort abgeschrieben (Elias, 11.10.2026: „wo anders suchst nach den selben begriffen").
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
    .replace(/ً(?=[اي](?: |$))/g, '');
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
export function ladeBuch(buch) {
  const datei = path.join(REPO, 'data', 'vokabeln-' + buch + '.js');
  const fenster = {};
  vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei });
  return fenster.VOKABELN[buch];
}
function ladeJsonl(datei) {
  if (!fs.existsSync(datei)) return [];
  return fs.readFileSync(datei, 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
}
const eintraege = ladeJsonl(path.join(AUSZUEGE, 'enwikt-arabisch.jsonl'));
const nachNackt = new Map(), nachOhneHamza = new Map();
eintraege.forEach((e, i) => {
  e.ref = `${e.w}#${e.pos}#${e.n || 1}@${i}`;
  e.formVon = (e.sinn || []).every(s => (s.t || []).includes('form-of') || (s.t || []).includes('alt-of')) && (e.sinn || []).length > 0;
  const schluessel = new Set([nackt(e.w), ...(e.kopf || []).map(f => nackt(f.f))]);
  for (const s of schluessel) {
    (nachNackt.get(s) || nachNackt.set(s, []).get(s)).push(e);
    const h = ohneHamza(s);
    (nachOhneHamza.get(h) || nachOhneHamza.set(h, []).get(h)).push(e);
  }
});

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

/* Der deutsche Schlüssel zum Lehrbuch (Auszug von ersatz-schluessel.py): je Tabellenzeile die arabische Zelle
 * (Stichwort, bei Verben Vergangenheit und Gegenwart, die Mehrzahl in Klammern hinter „ج") und die deutsche.
 * Er ist Elias' eigenes Buch — in seiner Rangfolge der Belege an zweiter Stelle, über dem Wörterbuch — und gilt
 * nur für das Buch, zu dem er gehört. Von Claude stammt: eine Zeile zählt nur bei GLEICHER Schreibung mit
 * Vokalzeichen (das Auslesen aus dem PDF macht Fehler; eine Zeile, die nicht passt, bleibt der Hand). */
const SCHLUESSEL_NAME = { 'madina-3': 'Schlüssel zu Madina Buch 3, deutsche Fassung (PDF)' };
const DE_KORREKTUR = (() => { const d = path.join(REPO, 'data-ersatz', 'hand', 'schluessel-korrektur.json'); return fs.existsSync(d) ? JSON.parse(fs.readFileSync(d, 'utf8')) : {}; })();
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
    let de = z.de.replace(VERBKLASSE, ' ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
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
  const einheit = seite.einheiten.find(x => x.nr === nr) || (seite.einheiten.length === 1 ? seite.einheiten[0] : null);
  const eine = liste => { const k = [...new Set(liste.filter(x => x.art === 'ar-rootbox').map(x => x.w))], a = [...new Set(liste.map(x => x.w))]; return k.length === 1 ? k[0] : a.length === 1 ? a[0] : null; };
  let w = einheit ? eine(einheit.w) : null, ort = einheit && einheit.nr ? ', Herkunft ' + einheit.nr : '';
  if (!w && (!einheit || !einheit.w.length)) { w = eine(seite.vorspann); ort = ', Seitenanfang'; }
  return w ? { w, wo: `en.wiktionary „${e.w}“${ort}: Wurzelangabe (Fassung vom ${String(seite.zeit).slice(0, 10)})` } : null;
}
const wurzelVon = (e, tiefe = 0) => {
  const ausSeite = wurzelAusSeite(e);
  if (ausSeite) return ausSeite;
  if (e.wurzel) return { w: e.wurzel, wo: `en.wiktionary „${e.w}“ (${e.pos}), Wurzelangabe` };
  for (const k of e.wk || []) { const m = String(k).match(/root\s+([ء-ي](?:\s+[ء-ي])+)/); if (m) return { w: m[1].replace(/\s+/g, ' '), wo: `en.wiktionary „${e.w}“ (${e.pos}), Kategorie` }; }
  if (tiefe < 2) for (const a of e.abl || []) {
    if (!a.a) continue;
    const ziel = (nachNackt.get(nackt(a.a)) || []).filter(x => (x.kopf || []).some(f => k1(f.f) === k1(a.a)));
    for (const z of ziel) { const r = wurzelVon(z, tiefe + 1); if (r) return { w: r.w, wo: `en.wiktionary „${e.w}“ (${e.pos}): ${a.n.replace(/^ar-/, '')} von „${z.w}“; ${r.wo}` }; }
  }
  // dieselbe Seite: steht die Wurzel bei einem anderen Eintrag derselben Schreibung mit derselben Herkunftsnummer?
  if (tiefe === 0) { const nb = (nachNackt.get(nackt(e.w)) || []).filter(x => x !== e && x.wurzel && (x.n || 1) === (e.n || 1)); if (nb.length) return { w: nb[0].wurzel, wo: `en.wiktionary „${e.w}“, Wurzelangabe am Eintrag (${nb[0].pos}) derselben Herkunft` }; }
  return null;
};

/* Ein einzelnes Wort einer Fügung im Wörterbuch suchen, GENAU in der Form, in der es dasteht (erstes Glied ohne Tanwin,
 * zweites im Genitiv mit Artikel) — die Beugungstabelle der Quelle nennt diese Formen. Ist der gefundene Eintrag selbst
 * nur eine gebeugte Form (weibliche Form, Mehrzahl), steht die Tabelle beim Stichwort, auf das er verweist. */
function teilFund(t) {
  const r = stufeFuer(t, 'noun', {});
  const mitStichwort = [];
  for (const x of r.treffer) {
    mitStichwort.push(x.e);
    if (x.e.formVon) for (const s of x.e.sinn || []) for (const ziel of s.fo || []) for (const l of nachNackt.get(nackt(ziel)) || []) if (!l.formVon && !mitStichwort.includes(l)) mitStichwort.push(l);
  }
  for (const e of mitStichwort) {
    const formen = [...(e.tab || []), ...(e.kopf || []), ...(e.hf || [])];
    // die Quelle schreibt angehängte Verhältniswörter mit Dehnungsstrich („bi" + Strich); der Strich ist kein Buchstabe
    const ohneStrich = s => ohneSukun(s).replace(/ـ/g, '');
    const f = formen.find(f => nfc(f.f) === t) || formen.find(f => ohneStrich(f.f) === ohneStrich(t));
    if (f) return { r, fund: { e, f, w: nfc(f.f) === t || t.includes('ـ') ? nfc(f.f) : nfc(f.f).replace(/ـ/g, '') } };
  }
  return { r, fund: null };
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
  const kopf = (e.kopf || [])[0];
  const ziel = artikelAb ? ohneArtikel(wort) : wort;
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
    const feld = (name, alle, zahl, was) => {
      if (!alle.length) return;
      const bisher = teileVon(karte[name]);
      const gw = bisher.length && alle.some(p => bisher.some(b => k1(b) === k1(p))) ? alle.filter(p => bisher.some(b => k1(b) === k1(p))) : alle;
      const fertig = gw.map(p => { const formen = nomi.filter(f => hat(f, 'indefinite', zahl) && k1(f.f) === k1(p)).map(f => f.f); return nimmWie([...formen, p], bisher.find(b => k1(b) === k1(p)), formen[0] || p); });
      setze(name, fertig.join(trenner(karte[name])), wo(was + (alle.length > gw.length ? ` (die Quelle nennt ${alle.length})` : '')));
    };
    feld('pl', [...new Set(hf.filter(f => f.t.includes('plural') && !f.t.includes('feminine') && !f.t.includes('dual')).map(f => f.f))], 'plural', 'Mehrzahl');
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
  for (const e of eintraegeDazu || []) for (const f of ketteFuer(e)) {
    f.deckt = decktSich(f.de, teile);
    const schluessel = f.de + '|' + f.deckt;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    kette.push(f);
  }
  const ketteBehalten = [...kette.filter(f => f.deckt), ...kette.filter(f => !f.deckt).slice(0, 14)];
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
    const wort = nfc(karte.ar);
    const mehrteilig = /\s/.test(wort);
    const satz = { id: String(karte.id), buch, kap: karte.chapter, platz: i + 1, typ: karte.type, suche: { ar: wort, de: karte.de } };
    let res = stufeFuer(wort, karte.type, karte);
    // Entscheidung von Hand: dieser Eintrag ist gemeint (Nummer = Zeile im Auszug enwikt-arabisch.jsonl, ab 0)
    const h = (hand[buch] || {})[String(karte.id)] || {};
    if (Number.isInteger(h.eintrag) && eintraege[h.eintrag]) {
      const e = eintraege[h.eintrag];
      res = { stufe: 'H', treffer: [{ e, artikelAb: hatArtikel(wort) && !nackt(e.w).startsWith('ال'), nimmQuelle: h.nimmQuelle === true }], alle: res.alle };
    }
    if (mehrteilig && res.stufe === 'N') {
      // Fügung aus mehreren Wörtern: jedes Wort einzeln suchen, und zwar GENAU in der Form, in der es in der Fügung steht
      // (z. B. erstes Glied ohne Tanwin, zweites im Genitiv mit Artikel) — die Beugungstabelle der Quelle nennt diese Formen.
      const teile = wort.split(/\s+/).map(t => {
        const { r, fund } = teilFund(t);
        const de = [...new Set(deutschFuer(t, { de: '' }, []).alle.filter(d => d.sicher === 'vokalisiert' && !d.erkl).map(d => d.de))].slice(0, 8);
        return { t, stufe: r.stufe, ref: r.treffer.map(x => x.e.ref), fund, de };
      });
      satz.stufe = 'M';
      satz.teile = teile.map(t => ({ t: t.t, stufe: t.stufe, ref: t.ref, form: t.fund ? t.fund.f.t.join('+') : null, de: t.de, en: t.fund ? (t.fund.e.sinn || []).filter(s => s.g).slice(0, 2).map(s => s.g) : [] }));
      if (teile.every(t => t.fund)) {
        const kopfE = teile[0].fund.e, kopfPos = wortartVon(kopfE);
        const beleg = 'aus belegten Formen gefügt: ' + teile.map(t => `en.wiktionary „${t.fund.e.w}“ (${t.fund.e.pos}), ${t.fund.f.t.length ? 'Form ' + t.fund.f.t.join(' ') : 'Kopfzeile'}`).join(' + ');
        const v = satz.vorschlag = { ar: { w: teile.map(t => t.fund.w).join(' '), wo: beleg } };
        if (['expression', 'phrase'].includes(karte.type) || (PASST[karte.type] || []).includes(kopfPos)) v.type = { w: karte.type, wo: `Fügung aus ${teile.length} Wörtern; Wortart des ersten Wortes laut Quelle: ${kopfPos}` };
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
    if (schluessel[buch] && !sch.some(x => x.alsKopf)) {
      const nah = (schluessel[buch].nah.get(ohneHamza(nackt(wort))) || []).filter(x => x.zeile.lektion === karte.chapter);
      if (nah.length) satz.schluesselNah = nah.slice(0, 3).map(x => ({ nr: x.zeile.nr, form: x.form, de: x.zeile.de }));
      const gewaehlt = h.schluessel ? nah.filter(x => h.schluessel === true || x.zeile.nr === h.schluessel) : [];
      if (gewaehlt.length === 1) sch = [{ ...gewaehlt[0], alsKopf: true, streng: true, lektionGleich: true, vonHand: true }, ...sch];
    }
    // dasselbe für eine Zeile der Lektion, die nur in der Schreibweise abweicht (Hamza-Träger, Dolchalif, Tanwin am Alif)
    if (h.schluessel) sch = sch.map(x => x.alsKopf && x.lektionGleich && !x.streng && (h.schluessel === true || x.zeile.nr === h.schluessel) ? { ...x, streng: true, vonHand: true } : x);
    if (sch.length) satz.schluessel = sch.slice(0, 5).map(x => ({ lektion: x.zeile.lektion, seite: x.zeile.seite, kopf: x.alsKopf, streng: x.streng, form: x.form, de: x.zeile.de, pl: x.zeile.mehrzahl, geg: x.zeile.geg, verb: x.zeile.verb }));
    const schKopf = sch.filter(x => x.alsKopf);
    const sWahl = schKopf.find(x => x.lektionGleich) || (schKopf.length === 1 ? schKopf[0] : null);
    const woerterbuchGilt = satz.vorschlag && satz.vorschlag.ar && satz.vorschlag.type && (!String(satz.stufe).includes('*') || h.artOk === true);
    // fürs Arabische zählt die Zeile nur bei gleicher Schreibung (bis auf die Schlussendung) oder auf das Wort der Hand:
    // wo der Schlüssel knapper vokalisiert als die Karte, soll seine Form nicht von selbst auf die Karte kommen
    if (sWahl && ((sWahl.streng && !woerterbuchGilt) || sWahl.vonHand) && !Number.isInteger(h.eintrag)) {
      const v = vorschlagAusSchluessel(sWahl, wort, karte, buch);
      if (sWahl.nurErstes && v.ar) {
        // die übrigen Wörter der Karte (Verhältniswort) einzeln im Wörterbuch suchen, genau in der Form der Karte
        const rest = wort.split(/\s+/).slice(1).map(t => ({ t, fund: teilFund(t).fund }));
        if (rest.every(x => x.fund)) {
          const dazu = rest.map(x => `en.wiktionary „${x.fund.e.w}“ (${x.fund.e.pos}), ${x.fund.f.t.length ? 'Form ' + x.fund.f.t.join(' ') : 'Kopfzeile'}`).join(' + ');
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
    // „auch": weitere Einträge, deren Bedeutung ebenfalls auf der Karte steht (gleichlautendes zweites Wort)
    const d = deutschFuer(wort, karte, [...res.treffer.map(x => x.e), ...(h.auch || []).map(n => eintraege[n]).filter(Boolean)]);
    // das Deutsch des Schlüssels steht vorn; „sch" sagt, ob die Zeile das Wort als Stichwort führt, ob die Schreibung
    // bis auf die Schlussendung gleich ist und ob es die Lektion des Kapitels ist
    d.alle.unshift(...sch.map(x => ({ q: 'schluessel', de: x.zeile.de, sicher: 'vokalisiert',
      wo: schluesselOrt(buch, x.zeile) + (x.zeile.berichtigt ? ' (Schreibfehler oder englischer Rest der Vorlage berichtigt)' : '') + (x.alsKopf ? '' : ' — dort als Nebenform (Mehrzahl oder Variante) genannt'),
      deckt: deTeile(x.zeile.de).some(g => decktSich(g, d.teile)), sch: { kopf: x.alsKopf, streng: x.streng, lektion: x.lektionGleich, nurErstes: x.nurErstes || undefined } })));
    // Hat das Wörterbuch keinen eigenen Eintrag, nennt aber eine Übersetzungstabelle das arabische Wort MIT Vokalzeichen in
    // genau dieser Schreibung, ist das ein Beleg fürs Arabische (ohne Schlussendung, wie eine Kopfzeile) — Stufe „T".
    // Nur wenn alle solchen Stellen dieselbe Form und dieselbe Wortart nennen.
    if (!satz.vorschlag && !mehrteilig) {
      const tab = d.alle.filter(f => f.sicher === 'vokalisiert' && !f.sch && f.vokForm && f.pos && k1(f.vokForm) === k1(wort));
      const formen = [...new Set(tab.map(f => nfc(f.vokForm)))], arten = [...new Set(tab.map(f => f.pos))];
      if (formen.length === 1 && arten.length === 1) {
        const pos = arten[0], typ = (PASST[karte.type] || []).includes(pos) ? karte.type : (ART[pos] || null);
        const v = { ar: { w: formen[0], wo: `${tab[0].wo}: das arabische Wort steht dort mit Vokalzeichen (ohne Schlussendung)`, ohneEndung: true }, _en: [] };
        if (typ) v.type = { w: typ, wo: `${tab[0].wo}: Wortart des übersetzten Stichworts laut Quelle: ${pos}` };
        if (voll(karte.sg) && k1(karte.sg) === k1(wort)) v.sg = { w: v.ar.w, wo: v.ar.wo };
        z.stufe[satz.stufe]--; satz.stufeWoerterbuch = satz.stufe; satz.stufe = 'T'; z.stufe.T = (z.stufe.T || 0) + 1;
        satz.vorschlag = v;
        satz.vergleich = {};
        for (const f of FELDER) satz.vergleich[f] = vergleiche(f, v[f] && v[f].w, karte[f]);
      }
    }
    satz.deutsch = d.alle.map(f => ({ de: f.de, q: f.q, wo: f.wo, sicher: f.sicher, deckt: f.deckt || undefined, erkl: f.erkl || undefined, sinn: f.sinn, unsicher: f.unsicher, sch: f.sch }));
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
console.log('Stufen: A eindeutig mit Vokalzeichen · A2 eindeutig, nur Schreibweise anders · B mehrere Einträge · * andere Wortart · C nur das Schriftbild passt · N kein Eintrag · M mehrere Wörter');
