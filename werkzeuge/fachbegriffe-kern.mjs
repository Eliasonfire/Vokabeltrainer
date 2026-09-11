/* fachbegriffe-kern.mjs — was fachbegriffe-finden.mjs und fachbegriffe-setzen.mjs gemeinsam brauchen
 * ==========================================================================
 *
 * ⚠️ EINE Stelle für die Vergleichsform, den Taschkīl-Test und das Laden der
 * Daten. Stünden sie in beiden Werkzeugen, fände das eine einen Begriff „neu",
 * den das andere als Dublette abweist. [[dieselbe_frage_zwei_antworten]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const lies = (f) => fs.readFileSync(path.isAbsolute(f) ? f : path.join(REPO, f), 'utf8');

const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export const BUCHSTABE = '\\u0621-\\u064A\\u0671';
const MARKE = '\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640';

/* Vergleichsform: NFC, ohne Vokalzeichen, Alif-Formen vereinheitlicht, ohne
   Artikel. „اَلْإِعْراب" und „إِعْرَاب" sind derselbe Begriff. */
export function nackt(s){
  let b = String(s || '').normalize('NFC').replace(HARAKAT, '').replace(/[ٱآأإ]/g, 'ا').trim();
  b = b.split(/\s+/).map(w => (w.startsWith('ال') && w.length > 3) ? w.slice(2) : w).join(' ');
  return b;
}

/* ⛔ TASCHKĪL VOLLSTÄNDIG — konservativ. Jeder Buchstabe trägt ein Zeichen,
   AUSSER: Alif (Dehnung, Waṣl), das lām des Artikels, ein Dehnungs-wāw nach
   Ḍamma, ein Dehnungs-yāʾ nach Kasra — und der letzte Buchstabe eines Wortes
   (Zitierform ohne Endung). Lieber ein richtiges Wort zu viel abweisen als ein
   halb vokalisiertes eintragen: „Ein geratenes Taschkīl wäre hier schlimmer
   als eine sichtbare Lücke, weil er es auswendig lernen würde" (17.08.2026).
   Gibt die fehlenden Stellen zurück, leer = vollständig. */
export function taschkilLuecken(text){
  const luecken = [];
  for (const wort of String(text || '').normalize('NFC').split(/\s+/).filter(Boolean)){
    const b = [];
    for (const c of wort){
      if (new RegExp('[' + BUCHSTABE + ']').test(c)) b.push({ z: c, m: '' });
      else if (new RegExp('[' + MARKE + ']').test(c) && b.length) b[b.length - 1].m += c;
    }
    b.forEach((x, i) => {
      if (x.m) return;
      if ('اىٱآ'.includes(x.z)) return;
      /* das lām des Artikels bleibt nur vor einem Sonnenbuchstaben ohne
         Zeichen — dann trägt der nächste Buchstabe die Shadda (التَّنْوِينُ).
         Vor einem Mondbuchstaben gehört ein Sukūn darauf (الْوَصْل). */
      if (i === 1 && b[0].z === 'ا' && x.z === 'ل' && b[2] && b[2].m.includes('ّ')) return;
      const vor = i > 0 ? b[i - 1].m : '';
      if (x.z === 'و' && vor.includes('ُ')) return;
      if (x.z === 'ي' && vor.includes('ِ')) return;
      if (i === b.length - 1) return;
      luecken.push(wort + ': ' + x.z + ' (Buchstabe ' + (i + 1) + ') ohne Zeichen');
    });
  }
  return luecken;
}

/* Kommt `form` als eigenes Wort (nicht als Teil eines längeren) im Text vor? */
export function stehtWoertlich(text, form){
  const f = String(form).normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^' + BUCHSTABE + MARKE + '])' + f + '(?=$|[^' + BUCHSTABE + MARKE + '])', 'u').test(String(text).normalize('NFC'));
}

/* Wie oft steht der Begriff ohne Vokalzeichen als ganzes Wort in einem Text —
   die Zählung `belegt` wie am 17.08.2026. */
export function zaehleNackt(text, begriff){
  const t = nackt(String(text).replace(/[^؀-ۿ\s]/g, ' '));
  const f = nackt(begriff).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (t.match(new RegExp('(^|\\s)(?:ال)?' + f + '(?=\\s|$)', 'gu')) || []).length;
}

/* Die Kandidaten aus den Regeln — hier und nicht im Finder, weil das
   Eintragwerkzeug mit DERSELBEN Rechnung festhält, welche Regeln einen
   zurückgestellten Begriff bei der Entscheidung schon nannten. Zwei Rechnungen
   würden sich um eine Regel unterscheiden, und der Begriff käme bei jedem Lauf
   „wieder". [[dieselbe_frage_zwei_antworten]] */
const ZEICHEN_RE = '\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640';
export const WORTGRUPPE_RE = () => new RegExp('[' + BUCHSTABE + '][' + ZEICHEN_RE + BUCHSTABE + ']*(?:\\s+[' + BUCHSTABE + '][' + ZEICHEN_RE + BUCHSTABE + ']*)*', 'g');
export const WORT_RE = () => new RegExp('[' + BUCHSTABE + '][' + ZEICHEN_RE + BUCHSTABE + ']*', 'g');
export function kandidatenAusRegeln(G){
  const kand = new Map();
  const merke = (form, regel, wie) => {
    const f = form.trim().replace(/^و(?=[ء-ي]{3})/, '');
    const k = nackt(f);
    if (!k || [...k.replace(/\s/g, '')].length < 2) return;
    if (!kand.has(k)) kand.set(k, { formen: new Map(), regeln: new Map(), imNamen: false });
    const x = kand.get(k);
    x.formen.set(f, (x.formen.get(f) || 0) + 1);
    if (!x.regeln.has(regel.id)) x.regeln.set(regel.id, regel);
    if (wie === 'name') x.imNamen = true;
  };
  for (const r of G){
    /* Wortgruppen im Namen, an einem angehängten „wa" getrennt: „مُبْتَدَأ وخَبَر" */
    for (const g of r.name.match(WORTGRUPPE_RE()) || []) for (const t of g.split(/\s+(?=و[ء-ي]{3})/)) merke(t, r, 'name');
    for (const w of (r.name + ' ' + r.shortExplanation).match(WORT_RE()) || []) merke(w, r, 'text');
    /* Zwei-Wort-Begriffe (اِسْمُ الْإِشَارَة, حُرُوفُ الْجَرِّ) stehen fast nie
       im Namen. Ohne Wortpaare fand die Eichung nur „إشارة" allein, nicht den
       Begriff, der seit dem 17.08. in der App steht. */
    for (const g of (r.name + ' ' + r.shortExplanation).match(WORTGRUPPE_RE()) || []){
      const w = g.split(/\s+/);
      for (let i = 0; i + 1 < w.length; i++) merke(w[i] + ' ' + w[i + 1], r, 'text');
    }
  }
  return kand;
}

/* ⛔⛔ WIRD DER EINTRAG BEIM START GETAUSCHT? (11.09.2026, v470 → v471)
   Fachbegriffe tragen chapter:'personal' und gelten damit als SEINE Wörter.
   tauscheDubletten() in js/kern.js ersetzt jedes eigene Wort, das mit gleicher
   Bedeutung im Buch steht, beim Start durch die Buchvokabel und schaltet diese
   einzeln frei (Elias' Regel vom 07.09.2026). Gemessen im Browser-Pane nach
   v470: gram-mansub und gram-harf verschwanden, 50471 und 45954 standen danach
   einzeln frei — bei حَرْف mit der FALSCHEN Bedeutung („Buchstabe"), weil die
   deutsche Angabe „(auch: Buchstabe)" enthielt.
   Deshalb fragt das Eintragwerkzeug mit dem ECHTEN Code der App — ausgeschnitten
   aus js/kern.js, nicht nachgebaut — ob ein Tausch käme.
   [[testvorlage_selbst_nachgebaut]] */
let BUCH_CACHE = null;
function buchVokabeln(){
  if (BUCH_CACHE) return BUCH_CACHE;
  const raus = [];
  const V = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
  for (const v of V) if (v && v.chapter !== 'personal') raus.push(v);
  for (const f of fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f))){
    const w = {};
    new Function('window', lies(path.join('data', f)))(w);
    for (const v of Object.values(w)) for (const x of (Array.isArray(v) ? v : Object.values(v || {}).flat())) if (x && x.ar && x.chapter !== 'personal') raus.push(x);
  }
  return (BUCH_CACHE = raus);
}
export function buchDublette(eintrag){
  const src = lies(path.join('js', 'kern.js'));
  const von = src.indexOf('const DUB_HARAKA_ENDE');
  const bis = src.indexOf('/* Der Tausch selbst.');
  if (von < 0 || bis < von) throw new Error('dubletteImBuch() in js/kern.js nicht gefunden — der Tausch-Test kann nicht laufen');
  const VOCAB_DATA = [...buchVokabeln(), eintrag];
  return new Function('VOCAB_DATA', src.slice(von, bis) + '; return dubletteImBuch;')(VOCAB_DATA)(eintrag);
}

export function ladeDaten(opt = {}){
  const G = new Function(lies('grammar-data.js') + '; return GRAMMAR_RULES;')();
  const kartenText = lies('regelsammlung-data.js');
  const listen = [...kartenText.matchAll(/const\s+(FOLGE\d+_KARTEN)\s*=/g)].map(m => m[1]);
  const K = listen.length ? new Function(kartenText + '; return [' + listen.join(',') + '].flat();')() : [];
  const fachDatei = opt.fachDatei || path.join(REPO, 'data', 'fachbegriffe.js');
  const F = new Function(lies(fachDatei) + '; return FACHBEGRIFF_VOKABELN;')();
  const V = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
  const entscheidungenDatei = opt.entscheidungenDatei || path.join(REPO, 'werkzeuge', 'fachbegriffe-entscheidungen.json');
  let E = { entscheidungen: {} };
  if (fs.existsSync(entscheidungenDatei)) E = JSON.parse(lies(entscheidungenDatei));
  return { G, K, F, V, E, grammarText: lies('grammar-data.js'), kartenText, fachDatei, entscheidungenDatei };
}
