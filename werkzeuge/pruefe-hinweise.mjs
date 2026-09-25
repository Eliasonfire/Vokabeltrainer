/* pruefe-hinweise.mjs — bewacht, dass verräterische Satzmodus-Hinweise
 * verborgen bleiben, bis Elias geantwortet hat.
 * ==========================================================================
 *
 * Elias am 22.09.2026: „Satzmodus-Hinweise: nur die verräterischen erst nach
 * dem Versuch zeigen. Bau das bitte so, dass die Routinen es aktuell halten."
 *
 * ⛔ WARUM DAS VON SELBST VERFÄLLT
 *
 * `hinweisVerraet` ist ein Urteil über einen Text, und der Text ändert sich.
 * Wer morgen den Hinweis von Übung 9 um ein Beispielwort ergänzt, macht aus
 * einer Einordnung eine Lösung — und nichts meldet sich. Genauso still ist der
 * umgekehrte Fall: eine neue Übung bekommt einen Hinweis und kein Feld.
 * Deshalb prüft dieses Werkzeug DREIERLEI, und zwar zwei davon mechanisch am
 * echten Aufgabenbestand, nicht an einer Handliste. [[werkzeug_ohne_aufrufer]]
 *
 * ZUSICHERUNG 1 — Pflichtfeld
 *   Jede Übung mit `hinweis` trägt `hinweisVerraet` als true oder false.
 *   Fehlt es, ist der Lauf rot. Eine neue Übung fällt damit auf, statt still
 *   auf den bequemen Wert zu rutschen. [[vorgabewert_sieht_aus_wie_befund]]
 *
 * ZUSICHERUNG 2 — mechanischer Verrat
 *   Aus JEDER gebauten Aufgabe kommen die Wörter, um die es geht: das
 *   hervorgehobene Wort, die Antwortoptionen und eine Lösung, wenn sie
 *   arabisch ist. Steht eines davon im Hinweistext (ohne Taschkīl, NFC, ohne
 *   Artikel), dann verrät der Hinweis die Antwort und `hinweisVerraet` MUSS
 *   true sein. Der klarste Fall ist Übung 10: ihr Hinweis zählt يد, عين, أذن,
 *   رجل und بنت auf — genau die Wörter, nach denen sie fragt.
 *
 * ZUSICHERUNG 3 — die Anzeige zieht mit
 *   js/uebung.js muss den Hinweis wirklich verbergen. Ein Feld, das niemand
 *   liest, ist kein Verhalten. Geprüft wird am Quelltext von renderUebung().
 *
 * ⚠️ NICHT geprüft wird die Gegenrichtung: ein Hinweis, der nichts verrät und
 * trotzdem `true` trägt, bleibt stehen. Das ist Elias' Urteil über seinen
 * eigenen Lernweg (Übungen 1–5 stehen auf true, ohne dass die Mechanik dort
 * etwas findet), und ein Werkzeug hat darüber nicht zu befinden.
 * [[regeln_selbst_auswerten]]
 *
 * Aufruf:
 *   node werkzeuge/pruefe-hinweise.mjs              alle Befunde
 *   node werkzeuge/pruefe-hinweise.mjs --knapp      nur die Zählung
 *   node werkzeuge/pruefe-hinweise.mjs --stoertest  Übung 10 künstlich auf
 *                                                   false — MUSS rot werden
 *   node werkzeuge/pruefe-hinweise.mjs --stoertest-feld
 *                                                   Übung 1 ohne Pflichtfeld
 *                                                   — MUSS rot werden
 *
 * Exitcode 0 = alles in Ordnung
 *          1 = Befund (oder Werkzeugfehler; die letzte Zeile sagt, was)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...t) => path.join(REPO, ...t);
const knapp = process.argv.includes('--knapp');
const stoertest = process.argv.includes('--stoertest');
const stoertestFeld = process.argv.includes('--stoertest-feld');
const require_ = createRequire(import.meta.url);

/* ---------- Normalisieren ----------
   ⛔ NFC ZUERST. Ohne das steht عَيْنٌ je nach Quelle als zerlegte Folge da und
   trifft sich selbst nicht. [[arabisch_immer_nfc]]
   Entfernt werden: Taschkīl, Tatweel, der Artikel am Wortanfang und die
   Hamza-Sitze auf Alif — im Hinweis steht أُذُنٌ, im Satz kann اَلْأُذُنُ
   stehen, und ein Vergleich, der das nicht ausgleicht, findet gar nichts. */
const TASCHKIL = /[ً-ْٰٓ-ٕـ]/g;
function nackt(s){
  return String(s == null ? '' : s).normalize('NFC')
    .replace(TASCHKIL, '')
    .replace(/[آأإ]/g, 'ا')
    .replace(/^(?:و|ف|ب|ل|ك)?ال/, '')
    .trim();
}
const ARABISCH = /[ء-ي]/;
function brauchbar(s){
  const n = nackt(s);
  return n.length >= 3 && ARABISCH.test(n) ? n : null;
}

/* ---------- Die App in einer Kiste laden ----------
   ⛔ Der Aufgabenbestand wird GEBAUT, nicht beschrieben. Eine Handliste
   „diese Wörter kommen in Übung 10 vor" läuft auseinander, sobald ein Satz
   dazukommt — und niemand merkt es. [[handliste_neben_echter_quelle]] */
const irab = require_(p('js', 'irab.js'));
const kiste = { console, window:{}, navigator:{ userAgent:'pruefer' } };
kiste.globalThis = kiste;
/* ⛔ `getElementById` darf NICHT null liefern. js/uebung.js haengt beim Laden
   Horcher an seine Knoepfe (`document.getElementById('…').addEventListener`) —
   mit null bricht die Datei ab, und der Prueflauf meldet „laesst sich nicht
   laden", obwohl nichts kaputt ist. Ein stummes Element laesst alles durch. */
const stummesElement = () => {
  const el = {
    style:{}, dataset:{}, children:[], value:'', textContent:'', innerHTML:'',
    hidden:false, checked:false,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(){}, removeEventListener(){}, appendChild(){}, remove(){},
    setAttribute(){}, removeAttribute(){}, getAttribute(){ return null; },
    querySelector(){ return stummesElement(); }, querySelectorAll(){ return []; },
    closest(){ return null; }, focus(){}, select(){}, scrollIntoView(){}, click(){}
  };
  return el;
};
kiste.document = {
  getElementById: stummesElement,
  querySelector: stummesElement,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: stummesElement,
  body: stummesElement(),
  documentElement: stummesElement()
};
vm.createContext(kiste);
Object.keys(irab).forEach(k => { kiste[k] = irab[k]; });

const geladen = [];
const hol_ = (name) =>
  vm.runInContext('typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined', kiste);
function laden(rel, pflicht = true){
  const datei = p(rel);
  if (!fs.existsSync(datei)){
    if (pflicht){ console.error('  FEHLT: ' + rel); process.exit(1); }
    return false;
  }
  vm.runInContext(fs.readFileSync(datei, 'utf8'), kiste, { filename: rel });
  geladen.push(rel);
  return true;
}
/* ⛔ VIER Satzquellen, nicht eine. Die App hängt Sätze aus drei weiteren
   Dateien an die Wörter; ein Prüfer, der nur vocab-data.js liest, sieht
   WENIGER als die App und meldet trotzdem grün.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] */
laden('vocab-data.js');
laden('grammar-data.js');
laden('lehrbuch-saetze.js');
/* Seit 24.09.2026 lesen Übung 11, 14 und 15 ihre Wörter aus seinen Regelkarten
   (FOLGE19_KARTEN) — ohne diese Datei baut Übung 11 null Aufgaben. */
laden('regelsammlung-data.js');
laden('data/beispielsaetze.js', false);
laden('data/fachbegriffe.js', false);
/* ⛔⛔ js/saetze.js MUSS mit. `baue()` von Uebung 10 ruft `wortKern()`, und die
   Funktion steht dort, nicht in js/uebung.js. Ohne sie wirft der Aufbau, der
   try/catch schluckt es, und Uebung 10 baut STILL NULL Aufgaben — der Prueflauf
   meldet gruen und hat nichts gemessen. Genau daran ist dieser Prueferam
   22.09.2026 beim ersten Lauf gescheitert; gefunden nur, weil Elias
   ausdruecklich geschrieben hatte, die Mechanik muesse Uebung 10 fangen.
   Die Gegenprobe dazu steht unten: jede Uebung MUSS Aufgaben bauen.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] */
/* ⚠️ js/saetze.js verdrahtet am Ende Bedienelemente und braucht dafuer
   `SETTINGS` aus js/kern.js. Die ganze Kette nachzuladen waere teuer und
   brächte weitere Abhaengigkeiten; deshalb ein Stellvertreter und ein
   kontrollierter Abbruch. Funktionsdeklarationen stehen zu dem Zeitpunkt
   schon im Kontext — `wortKern` ist da, auch wenn die letzte Zeile wirft.
   ⛔ Darauf wird nicht vertraut, sondern es wird GEPRUEFT. */
/* ⛔ KEIN Stellvertreter für `SETTINGS`, `SENT` und Co. Die App deklariert sie
   selbst mit `const`, und ein `var` daneben ist ein SyntaxError — der schlägt
   beim Übersetzen zu, also bevor irgendeine Funktion gehoben wird. Der Abbruch
   sah dann aus wie „wortKern fehlt". Richtig ist, js/kern.js zu laden: dort
   stehen `SETTINGS`, `shuffle()` und der halbe Rest, den die Übungen brauchen.
   ⚠️ kern.js greift auf `localStorage` zu — ein stummer Speicher reicht. */
const speicher = new Map();
kiste.localStorage = {
  getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => { speicher.set(k, String(v)); },
  removeItem: (k) => { speicher.delete(k); },
  clear: () => speicher.clear(),
  key: () => null, get length(){ return speicher.size; }
};
kiste.matchMedia = () => ({ matches:false, addEventListener(){}, addListener(){} });
kiste.location = { href:'', search:'', hash:'', pathname:'/' };
kiste.setTimeout = () => 0; kiste.clearTimeout = () => {};
kiste.setInterval = () => 0; kiste.clearInterval = () => {};
kiste.requestAnimationFrame = () => 0;
kiste.fetch = () => Promise.reject(new Error('kein Netz im Pruefer'));
/* ⚠️ Jede dieser Dateien bricht am Ende an Bedienelementen ab, die es hier
   nicht gibt. Das ist in Ordnung: Funktionsdeklarationen stehen zu dem
   Zeitpunkt schon im Kontext. ⛔ Darauf wird nicht vertraut, sondern gleich
   darunter GEPRUEFT — und die Gegenprobe „jede Uebung baut Aufgaben" faengt
   den Rest. */
let saetzeFehler = null;
for (const rel of ['js/kern.js', 'js/saetze.js', 'js/regeln.js']){
  try { laden(rel); }
  catch (e){
    geladen.push(rel + ' (Teil)');
    if (rel === 'js/saetze.js') saetzeFehler = e.message;
  }
}
for (const n of ['wortKern', 'regelAusgeblendet', 'shuffle']){
  if (typeof hol_(n) !== 'function'){
    console.error('  `' + n + '` fehlt nach dem Laden — betroffene Uebungen koennten keine Aufgabe bauen.'
      + (saetzeFehler ? '\n  Abbruch beim Laden von js/saetze.js: ' + saetzeFehler : ''));
    process.exit(1);
  }
}
const hol = (name) =>
  vm.runInContext('typeof ' + name + ' !== "undefined" ? ' + name + ' : null', kiste);

let UEBUNGEN;
try {
  vm.runInContext(fs.readFileSync(p('js', 'uebung.js'), 'utf8'), kiste,
                  { filename: 'js/uebung.js' });
  UEBUNGEN = hol('UEBUNGEN');
} catch (e){
  console.error('  js/uebung.js liess sich nicht laden: ' + e.message);
  process.exit(1);
}
if (!Array.isArray(UEBUNGEN) || !UEBUNGEN.length){
  console.error('  UEBUNGEN ist leer — der Prueflauf waere bedeutungslos.');
  process.exit(1);
}

/* ---------- Störtest ----------
   Elias hat ihn ausdrücklich mitbestellt: „Störtest: hinweisVerraet bei Übung
   10 auf false -> muss rot werden." Er läuft im Arbeitsspeicher; die Datei
   wird nicht angefasst. */
if (stoertest){
  const zehn = UEBUNGEN.find(m => m.nr === 10);
  if (!zehn){ console.error('  Uebung 10 gibt es nicht mehr — Stoertest unmoeglich.'); process.exit(1); }
  zehn.hinweisVerraet = false;
  console.log('  ⚠️ STOERTEST: Uebung 10 steht auf hinweisVerraet:false. Erwartet wird ROT.\n');
}
/* ⛔ Zusicherung 1 braucht eine EIGENE Eichung. Ein Stoertest, der nur die
   Mechanik kippt, belegt nichts ueber das Pflichtfeld — und ein Pruefer, der
   nur an einer Stelle rot werden kann, bewacht auch nur diese eine.
   [[ein_gruener_pruefer_beweist_nur_geprueftes]] */
if (stoertestFeld){
  const eins = UEBUNGEN.find(m => m.nr === 1);
  if (!eins){ console.error('  Uebung 1 gibt es nicht mehr — Stoertest unmoeglich.'); process.exit(1); }
  delete eins.hinweisVerraet;
  console.log('  ⚠️ STOERTEST FELD: Uebung 1 hat kein hinweisVerraet mehr. Erwartet wird ROT.\n');
}

/* ---------- Sätze sammeln ---------- */
const VOCAB = hol('VOCAB_DATA') || [];
/* ⛔ Die BESTELLTEN Fachbegriffe gehören dazu (v612, 25.09.2026) — in der App
   hängt js/kern.js sie in VOCAB_DATA ein; hier kam das nie an (171 Einträge,
   nur vocab-data.js). Übung 15 (Endungen) baute deshalb 0 Aufgaben: ihre
   Auswahl SIND diese Karten. Gegenprobe unten („jede Übung baut Aufgaben")
   hat es gefunden. */
{ const FV = hol('FACHBEGRIFF_VOKABELN') || [], FA = hol('FACHBEGRIFF_AUFTRAG') || {};
  const da = new Set(VOCAB.map(w => String(w.id)));
  for (const w of FV) if (Object.prototype.hasOwnProperty.call(FA, String(w.id)) && !da.has(String(w.id))) VOCAB.push(w); }
const LEHR = hol('LEHRBUCH_SAETZE') || [];
const BEISP = hol('BEISPIELSAETZE') || {};
const FACH = hol('FACHBEGRIFFE') || [];

/* ⛔ DAS GANZE OBJEKT, nicht nur der Satztext. Uebung 9 schlaegt mit
   `SENTENCE_TAGS[satz.id]` nach — ein selbstgebautes `{ sentAr, sentDe }` ohne
   `id` laesst sie still 0 Aufgaben bauen. Gefunden von der Gegenprobe unten,
   nicht von mir. [[vorgabewert_sieht_aus_wie_befund]] */
const saetze = [];
const sieh = (o, ar, de) => {
  if (!ar) return;
  saetze.push(Object.assign({}, o, { sentAr: ar, sentDe: (o && o.sentDe) || de || '' }));
};
VOCAB.forEach(w => sieh(w, w.sentAr, w.sentDe));
FACH.forEach(w => sieh(w, w.sentAr, w.sentDe));
(Array.isArray(LEHR) ? LEHR : Object.values(LEHR || {}).flat())
  .forEach(s => s && sieh(s, s.ar || s.sentAr, s.de || s.sentDe));
Object.values(BEISP).forEach(v => {
  (Array.isArray(v) ? v : [v]).forEach(s => {
    if (typeof s === 'string') return sieh({}, s, '');
    if (s) sieh(s, s.ar || s.sentAr, s.de || s.sentDe);
  });
});
if (!saetze.length){
  console.error('  0 Saetze geladen — dann prueft Zusicherung 2 nichts. [[leere_liste_ist_keine_messung]]');
  process.exit(1);
}
if (typeof kiste.setzeLexikon === 'function') kiste.setzeLexikon(VOCAB);

/* ---------- Zusicherung 1: Pflichtfeld ---------- */
const befunde = [];
const mitHinweis = UEBUNGEN.filter(m => m.hinweis);
const mitAufgabe = UEBUNGEN.filter(m => m.aufgabe);
mitHinweis.forEach(m => {
  if (typeof m.hinweisVerraet !== 'boolean')
    befunde.push(`Uebung ${m.nr} (${m.id}): hat einen \`hinweis\`, aber kein \`hinweisVerraet\`. `
      + 'Pflichtfeld ohne Vorgabewert — entscheide, ob der Text die Antwort verraet.');
});
/* ⛔ `aufgabe` und `hinweis` schliessen einander aus. Wer beides setzt, hat
   zwei Texte fuer dasselbe Feld und sieht nur einen davon. */
UEBUNGEN.forEach(m => {
  if (m.aufgabe && m.hinweis)
    befunde.push(`Uebung ${m.nr} (${m.id}): traegt \`aufgabe\` UND \`hinweis\` — es wird nur einer gezeigt.`);
  if (m.aufgabe && typeof m.hinweisVerraet === 'boolean')
    befunde.push(`Uebung ${m.nr} (${m.id}): \`aufgabe\` ist immer sichtbar, \`hinweisVerraet\` wirkt dort nicht.`);
});

/* ---------- Zusicherung 2: mechanischer Verrat ---------- */
const analysiere = kiste.analysiereSatz || irab.analysiereSatz;
const zeilenJeSatz = saetze.map(s => {
  try { return { satz: s, zeilen: analysiere(s.sentAr) }; }
  catch (e){ return null; }
}).filter(Boolean);

let gebaut = 0;
const verrat = new Map();          /* uebung.id -> Map(wort -> Anzahl Aufgaben) */
const jeUebung = new Map();        /* uebung.id -> Anzahl Aufgaben */
const fehler = new Map();          /* uebung.id -> erste Fehlermeldung */
UEBUNGEN.forEach(m => { verrat.set(m.id, new Map()); jeUebung.set(m.id, 0); });

for (const { satz, zeilen } of zeilenJeSatz){
  for (const m of UEBUNGEN){
    let aufgaben = [];
    /* ⚠️ Der Fehler wird FESTGEHALTEN, nicht geschluckt. Ein stiller catch hat
       diesen Pruefer beim ersten Lauf wertlos gemacht. */
    try { aufgaben = m.baue(zeilen, satz) || []; }
    catch (e){ aufgaben = []; if (!fehler.has(m.id)) fehler.set(m.id, e.message); }
    for (const a of aufgaben){
      if (!a) continue;
      gebaut++;
      jeUebung.set(m.id, jeUebung.get(m.id) + 1);
      const kandidaten = [];
      if (Number.isInteger(a.wortIdx) && zeilen[a.wortIdx])
        kandidaten.push(zeilen[a.wortIdx].rein || zeilen[a.wortIdx].wort);
      if (Array.isArray(a.wortIdxe)) a.wortIdxe.forEach(i =>
        zeilen[i] && kandidaten.push(zeilen[i].rein || zeilen[i].wort));
      if (Array.isArray(a.optionen)) a.optionen.forEach(o => {
        kandidaten.push(o && o.text); kandidaten.push(o && o.wert); });
      if (typeof a.loesung === 'string') kandidaten.push(a.loesung);
      for (const k of kandidaten){
        const n = brauchbar(k);
        if (!n) continue;
        const karte = verrat.get(m.id);
        karte.set(n, (karte.get(n) || 0) + 1);
      }
    }
  }
}
if (!gebaut){
  console.error('  0 Aufgaben gebaut — Zusicherung 2 haette nichts gemessen. [[leere_liste_ist_keine_messung]]');
  process.exit(1);
}
/* ⛔⛔ DIE WICHTIGSTE GEGENPROBE DIESES WERKZEUGS.
   Eine Uebung, die 0 Aufgaben baut, wird von Zusicherung 2 nicht geprueft —
   und weil ein leeres Ergebnis wie ein sauberes aussieht, meldet der Lauf
   trotzdem gruen. Genau so ist Uebung 10 am 22.09.2026 durchgerutscht: eine
   fehlende Datei im Lader, ein stiller catch, 0 Aufgaben, alles gruen.
   Eine leere Liste ist keine Messung. [[leere_liste_ist_keine_messung]] */
const leer = UEBUNGEN.filter(m => jeUebung.get(m.id) === 0);
if (leer.length){
  leer.forEach(m => console.error('  WERKZEUGFEHLER: Uebung ' + m.nr + ' (' + m.id
    + ') baut 0 Aufgaben — sie wird nicht geprueft.'
    + (fehler.has(m.id) ? ' Ursache: ' + fehler.get(m.id) : ' Kein Fehler geworfen, der Bestand gibt nichts her.')));
  console.error('\n  ' + leer.length + ' Uebung(en) ungeprueft — der Lauf waere eine Scheinmessung. Exit 1.');
  process.exit(1);
}

/* ---------- Die eine Ausnahme, und sie gehört Elias ----------
   Der mechanische Teil meldet Uebung 8 (wortart): ihr Hinweis nennt die
   Antwortoption اِسْمٌ und dazu تَحْتَ und هُنَا — beides Woerter, nach denen
   sie fragt. Nach der Mechanik muesste sie also `true` tragen.

   Elias hat am 22.09.2026 aber ausdruecklich das Gegenteil angeordnet:
     „false: 8 wortart, 9 regel, 11 isara, 12 fem-form"
   Seine Anweisung ist genauer als seine allgemeine Regel, deshalb gilt sie.
   Der Grund ist auch nachvollziehbar: die Aussage „im Arabischen zaehlen auch
   Adjektive, Adverbien und Ortsangaben als اِسْمٌ" ist der Unterrichtsstoff
   selbst (`wortarten-01`, Folge 08 ca. 24:41) und nicht die Loesung EINER
   Aufgabe — ohne sie waere die Uebung ein Ratespiel.

   ⛔ Die Ausnahme ist auf DIESE DREI WOERTER begrenzt. Kommt ein viertes in
   den Hinweis, wird der Lauf rot — denn dann hat jemand den Text geaendert,
   und Elias' Urteil galt dem alten. Eine Ausnahme, die ganze Uebungen
   freistellt, schaltet die Pruefung ab. [[wirkung_an_der_quelle_stilllegen]] */
const AUSNAHMEN = {
  wortart: {
    woerter: ['اسم', 'تحت', 'هنا'],
    grund: 'Elias am 22.09.2026: „false: 8 wortart" — der Satz ist Unterrichtsstoff, nicht die Loesung einer Aufgabe.'
  }
};

const treffer = [];
const ausnahmen = [];
mitHinweis.forEach(m => {
  const text = nackt(m.hinweis);
  const drin = [...verrat.get(m.id).entries()]
    .filter(([w]) => text.includes(w))
    .sort((a, b) => b[1] - a[1]);
  if (!drin.length) return;
  treffer.push({ m, drin });
  if (m.hinweisVerraet === true) return;
  const a = AUSNAHMEN[m.id];
  const erlaubt = a ? a.woerter.map(nackt) : [];
  const neu = drin.filter(([w]) => !erlaubt.includes(w));
  if (a && !neu.length){ ausnahmen.push({ m, a, drin }); return; }
  befunde.push(`Uebung ${m.nr} (${m.id}): der Hinweis nennt ${neu.length} Wort/Woerter, `
    + `nach denen sie fragt (${neu.slice(0, 6).map(([w, n]) => w + '×' + n).join(', ')}) `
    + '— `hinweisVerraet` muss true sein.'
    + (a ? ' Die Ausnahme von Elias deckt nur ' + a.woerter.join(', ') + '.' : ''));
});

/* ---------- Zusicherung 3: die Anzeige zieht mit ---------- */
const quelle = fs.readFileSync(p('js', 'uebung.js'), 'utf8');
if (!/m\.hinweisVerraet/.test(quelle) || !/UEB\.beantwortet/.test(quelle)
    || !/const\s+nochVerbergen\s*=/.test(quelle))
  befunde.push('js/uebung.js: renderUebung() verbirgt den Hinweis nicht mehr ueber '
    + '`hinweisVerraet` und `UEB.beantwortet` — das Feld waere dann Zierde.');
if (!/m\.aufgabe\b/.test(quelle))
  befunde.push('js/uebung.js: renderUebung() liest `m.aufgabe` nicht mehr — '
    + 'Uebung 7 stuende ohne Fragestellung da.');

/* ---------- Ausgabe ---------- */
const verraeterisch = mitHinweis.filter(m => m.hinweisVerraet === true).length;
if (!knapp && treffer.length){
  console.log('  Mechanisch gefunden — diese Hinweise nennen Woerter aus ihren eigenen Aufgaben:');
  treffer.forEach(({ m, drin }) => console.log('    Uebung ' + m.nr + ' (' + m.id + '): '
    + drin.slice(0, 8).map(([w, n]) => w + ' ×' + n).join(', ')
    + (m.hinweisVerraet === true ? '   [verborgen, richtig]' : '   [SICHTBAR]')));
  console.log('');
}
console.log('  ' + UEBUNGEN.length + ' Uebungen, ' + mitHinweis.length + ' mit Hinweis ('
  + verraeterisch + ' verraeterisch, ' + (mitHinweis.length - verraeterisch) + ' einordnend), '
  + mitAufgabe.length + ' mit Aufgabenstellung');
console.log('  ' + saetze.length + ' Saetze aus ' + geladen.length + ' Dateien, '
  + gebaut + ' Aufgaben gebaut');
/* ⛔ Die Ausnahme wird bei JEDEM Lauf genannt. Eine stille Ausnahme ist nach
   drei Monaten eine unsichtbare Luecke — und dann weiss niemand mehr, dass sie
   auf einem Satz von Elias beruht und nicht auf einem Versehen. */
ausnahmen.forEach(({ m, a, drin }) =>
  console.log('  Ausnahme  Uebung ' + m.nr + ' (' + m.id + ') bleibt sichtbar: '
    + drin.map(([w]) => w).join(', ') + ' — ' + a.grund));

if (befunde.length){
  console.log('');
  befunde.forEach(b => console.log('  ROT  ' + b));
  console.log('\n  ' + befunde.length + ' Befund(e). Exit 1.');
  process.exit(1);
}
console.log('  ok   jeder Hinweis mit Verrat ist verborgen, jedes Pflichtfeld steht.');
process.exit(0);
