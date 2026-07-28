/* pruefe-transkripte.js -- jede Regel gegen zwei unabhaengige Lesarten halten
 *
 * Aufruf:  node pruefe-transkripte.js [Fenster in Sekunden, Standard 90]
 *          node pruefe-transkripte.js 90 <regel-id>     (nur eine Regel, mit Text)
 *
 * Warum das noetig ist: die 73 Regeln in grammar-data.js sind aus den
 * YouTube-Untertiteln der Unterrichtsfolgen abgeleitet. Die sind maschinell
 * erzeugt und verstuemmeln ausgerechnet die arabischen Fachbegriffe - belegt:
 * "H nicht" statt هذا, "Trebote" statt تاء مربوطة, "hell hell h beon" statt
 * هَلْ. Eine Regel, die nur an so einer Stelle haengt, steht auf einem
 * Transkript, das man an genau der entscheidenden Stelle nicht lesen kann.
 *
 * Deshalb eine zweite, unabhaengige Lesart: ein vollstaendiger Whisper-Durchlauf
 * (large-v3-turbo, arabische Begriffsliste als Prompt) unter
 * transcripts/whisper-voll/folge-NN.srt. Dazu kommt als dritte Spur die
 * Sprechertrennung unter transcripts/sprecher/ - die beantwortet nicht "was
 * wurde gesagt", sondern "wer hat es gesagt" (siehe pruefe-sprecher.js).
 *
 * Dieses Skript legt die Spuren je Regel uebereinander und meldet:
 *   - Regeln, deren arabische Kernform in KEINER der beiden Lesarten im
 *     Zeitfenster auftaucht  -> die Stelle sollte man selbst nachhoeren
 *   - Regeln, die nur eine der beiden Lesarten stuetzt -> schwaecherer Beleg
 *   - Regeln, die beide stuetzen -> belastbar
 *
 * Das ist ein Suchwerkzeug, kein Urteil: approxTimestamp ist ausdruecklich
 * ungefaehr, und eine Regel entsteht aus einer Passage, nicht aus einem
 * Augenblick. Kein Exitcode-Gate.
 *
 * transcripts/ ist per .gitignore lokal - fehlt der Ordner, sagt das Skript
 * das und endet ohne Fehler. */
const fs = require('fs');
const path = require('path');

const REPO = __dirname;
const T = path.join(REPO, 'transcripts');
const WHISPER = path.join(T, 'whisper-voll');
const YOUTUBE = path.join(T, 'raw');
const SPRECHER = path.join(T, 'sprecher');
const FENSTER = Number(process.argv[2]) || 90;
const NUR = process.argv[3] || null;

if (!fs.existsSync(WHISPER) && !fs.existsSync(YOUTUBE)) {
  console.log(`Keine Transkripte unter ${T} - nichts zu pruefen.`);
  console.log('Der Ordner bleibt bewusst lokal (.gitignore, Kursmaterial des Lehrers).');
  process.exit(0);
}

const { GRAMMAR_RULES } = (new Function(
  fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8') + ';return {GRAMMAR_RULES};'))();

function sekunden(stempel) {
  const teile = String(stempel || '').trim().split(':').map(Number);
  if (teile.some(isNaN) || !teile.length) return null;
  return teile.reduce((a, b) => a * 60 + b, 0);
}

/* ---------- Whisper-SRT ---------- */
function ladeSrt(datei) {
  if (!fs.existsSync(datei)) return null;
  const bloecke = fs.readFileSync(datei, 'utf8').split(/\r?\n\r?\n/);
  const out = [];
  for (const b of bloecke) {
    const z = b.split(/\r?\n/).filter(Boolean);
    if (z.length < 2) continue;
    const m = z[1].match(/(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),/);
    if (!m) continue;
    out.push({
      von: +m[1] * 3600 + +m[2] * 60 + +m[3],
      bis: +m[5] * 3600 + +m[6] * 60 + +m[7],
      text: z.slice(2).join(' ').trim()
    });
  }
  return out;
}

/* ---------- YouTube-Rohtranskript ("0:09 Text") ---------- */
function ladeYoutube(datei) {
  if (!fs.existsSync(datei)) return null;
  const zeilen = fs.readFileSync(datei, 'utf8').split(/\r?\n/);
  const out = [];
  for (const z of zeilen) {
    const m = z.match(/^(\d+):(\d+)(?::(\d+))?\s+(.*)$/);
    if (!m) continue;
    const sek = m[3] !== undefined
      ? +m[1] * 3600 + +m[2] * 60 + +m[3]
      : +m[1] * 60 + +m[2];
    out.push({ von: sek, bis: sek + 8, text: m[4].trim() });
  }
  return out;
}

function segmenteImFenster(spur, mitte) {
  if (!spur) return [];
  return spur.filter(s => s.bis >= mitte - FENSTER && s.von <= mitte + FENSTER);
}
function imFenster(spur, mitte) {
  return segmenteImFenster(spur, mitte).map(s => s.text).join(' ');
}

/* Whisper haengt gelegentlich in einer Schleife und wiederholt denselben Satz
   dutzendfach ("Die Lektion haben wir bereits in der Sprache." x50). Ein
   solches Fenster enthaelt faktisch nichts und darf nicht als "hier stand die
   Regel nicht" durchgehen - es ist schlicht keine brauchbare Lesart. */
function hatWiederholungsschleife(segmente) {
  if (segmente.length < 8) return false;
  const zaehler = {};
  for (const s of segmente) {
    const k = s.text.trim().toLowerCase();
    if (k.length < 8) continue;
    zaehler[k] = (zaehler[k] || 0) + 1;
  }
  const haeufigste = Math.max(0, ...Object.values(zaehler));
  return haeufigste / segmente.length > 0.4;
}

/* ---------- Kernform einer Regel ----------
   Aus Name und Erklaerung die arabischen Woerter ziehen, an denen die Regel
   haengt. Reine Metabegriffe fliegen raus: dass in einer Erklaerung das Wort
   "اِسْم" vorkommt, sagt nichts darueber, ob der Lehrer an dieser Stelle die
   Regel behandelt hat - die Woerter kommen in fast jeder Erklaerung vor. */
const METABEGRIFFE = new Set([
  'اسم','فعل','حرف','كلمة','جملة','مبتدأ','خبر','مرفوع','مجرور','منصوب',
  'الاسم','الفعل','الحرف','الكلمة','الجملة','تنوين','اعراب','إعراب','لا','ما','و'
]);
const ohneTaschkil = s => (s || '').replace(/[ً-ْٰـ]/g, '');

function kernformen(regel) {
  /* Erst die Taschkil weg, dann Woerter suchen. Andersherum zerfaellt jedes
     vokalisierte Wort in Einzelbuchstaben: اِسْم ist ا + Kasra + س + Sukun + م,
     und eine Zeichenklasse fuer Buchstaben findet darin nie zwei am Stueck. */
  const text = ohneTaschkil(`${regel.name} ${regel.shortExplanation}`);
  const roh = text.match(/[ء-ي]{2,}/g) || [];
  const gesehen = new Set();
  const out = [];
  for (const w of roh) {
    const k = ohneTaschkil(w);
    if (k.length < 2 || METABEGRIFFE.has(k) || gesehen.has(k)) continue;
    gesehen.add(k);
    out.push(k);
  }
  /* Die ersten Formen stehen im Regelnamen und sind die eigentliche Sache;
     weiter hinten stehen Nebenbeispiele. Fuenf reichen. */
  return out.slice(0, 5);
}

/* ---------- Arabisch in lateinischer Umschrift wiederfinden ----------
   Der Lehrer unterrichtet auf Deutsch und spricht die arabischen Woerter
   dazwischen. Whisper schreibt sie deshalb meistens lateinisch aus, nicht in
   arabischer Schrift: "Hal ataka Hadithu Musa", "Hel hatha Beiton". Eine
   Suche nach هل faende davon nichts.

   Darum je Kernform ein grobes Lautmuster: Konsonanten in ihre ueblichen
   Umschriften uebersetzt, dazwischen beliebige kurze Vokalfolgen. Das ist
   absichtlich grosszuegig - hier wird gesucht, nicht bewiesen, und ein
   Fehltreffer kostet nur einen Blick, ein uebersehener Beleg dagegen eine
   Regel ohne Grundlage. Formen unter drei Buchstaben bekommen kein Muster:
   ein zweibuchstabiges h-l traefe in einem deutschen Text staendig. */
const UMSCHRIFT = {
  'ا':'[aeiou]','أ':'[aeiou]','إ':'[aeiou]','آ':'[aeiou]','ء':"['aeiou]?",
  'ب':'b','ت':'t','ث':'(?:th|s)','ج':'(?:j|g|dsch)','ح':'h','خ':'(?:kh|ch)',
  'د':'d','ذ':'(?:dh|th|z)','ر':'r','ز':'z','س':'s','ش':'(?:sh|sch)',
  'ص':'s','ض':'d','ط':'t','ظ':'(?:z|dh)','ع':"['`]?",'غ':'(?:gh|g)',
  'ف':'f','ق':'(?:q|k)','ك':'k','ل':'l','م':'m','ن':'n','ه':'h',
  'و':'(?:w|u|o)','ي':'(?:y|i|e)','ى':'(?:a|e)','ة':'(?:ah|at|a|e)'
};
function lautMuster(form){
  if (form.length < 3) return null;
  const teile = [...form].map(c => UMSCHRIFT[c]).filter(Boolean);
  if (teile.length < 3) return null;
  /* Zwischen den Konsonanten stehen in der Umschrift Vokale, die die
     arabische Schrift nicht schreibt - beitun, Bayton, baytin. */
  try { return new RegExp('\\b' + teile.join('[aeiou’\']{0,2}'), 'i'); }
  catch { return null; }
}

function enthaelt(text, formen) {
  const t = ohneTaschkil(text);
  return formen.filter(f => {
    if (t.includes(f)) return true;              // arabisch geschrieben
    const m = lautMuster(f);                     // oder lateinisch umschrieben
    return m ? m.test(t) : false;
  });
}

/* ---------- Sprecherspur ---------- */
function ladeSprecher() {
  const map = {};
  if (!fs.existsSync(SPRECHER)) return map;
  for (const f of fs.readdirSync(SPRECHER)) {
    const m = f.match(/^folge-(\d+)\.json$/);
    if (!m) continue;
    const meta = JSON.parse(fs.readFileSync(path.join(SPRECHER, f), 'utf8'));
    map[Number(m[1])] = meta.redeanteil[meta.vermutlichLehrer];
  }
  return map;
}
const lehrerAnteil = ladeSprecher();

/* ---------- Auswertung ---------- */
const spuren = {};
function spurFuer(folge) {
  const n = String(folge).padStart(2, '0');
  if (!spuren[n]) {
    spuren[n] = {
      whisper: ladeSrt(path.join(WHISPER, `folge-${n}.srt`)),
      youtube: ladeYoutube(path.join(YOUTUBE, `folge-${n}.txt`))
    };
  }
  return spuren[n];
}

const ergebnis = [];
for (const r of GRAMMAR_RULES) {
  if (NUR && r.id !== NUR) continue;
  const t = sekunden(r.source.approxTimestamp);
  const spur = spurFuer(r.source.folge);
  const formen = kernformen(r);
  const wSeg  = t === null ? [] : segmenteImFenster(spur.whisper, t);
  const wText = wSeg.map(x=>x.text).join(" ");
  const schleife = hatWiederholungsschleife(wSeg);
  const yText = t === null ? '' : imFenster(spur.youtube, t);
  ergebnis.push({
    regel: r.id, folge: r.source.folge, zeit: r.source.approxTimestamp,
    formen,
    /* Formen unter drei Buchstaben (أ, هل, ما) lassen sich in einem deutschen
       Text nicht sicher wiederfinden - solche Regeln gelten als nicht
       mechanisch pruefbar, nicht als unbelegt. */
    pruefbar: formen.some(f => lautMuster(f)),
    inWhisper: enthaelt(wText, formen),
    inYoutube: enthaelt(yText, formen),
    hatWhisper: !!spur.whisper, schleife,
    hatYoutube: !!spur.youtube,
    wText, yText
  });
}

if (NUR) {
  const e = ergebnis[0];
  if (!e) { console.log(`Regel "${NUR}" gibt es nicht.`); process.exit(0); }
  console.log(`${e.regel}  (Folge ${e.folge}, ca. ${e.zeit}, Fenster +/-${FENSTER}s)`);
  console.log(`Kernformen: ${e.formen.join(', ') || '(keine arabische Form im Regeltext)'}`);
  console.log(`\n--- Whisper (eigener Durchlauf) ---\n${e.wText || '(keine Spur)'}`);
  console.log(`\n--- YouTube (maschinelle Untertitel) ---\n${e.yText || '(keine Spur)'}`);
  process.exit(0);
}

const mitWhisper = ergebnis.filter(e => e.hatWhisper);
const beide   = mitWhisper.filter(e => e.inWhisper.length && e.inYoutube.length);
const nurW    = mitWhisper.filter(e => e.inWhisper.length && !e.inYoutube.length);
const nurY    = mitWhisper.filter(e => !e.inWhisper.length && e.inYoutube.length);
const keine   = mitWhisper.filter(e => !e.inWhisper.length && !e.inYoutube.length && e.pruefbar);
const schleifen = mitWhisper.filter(e => e.schleife);
const ohneForm= mitWhisper.filter(e => !e.pruefbar && !e.inWhisper.length && !e.inYoutube.length);

const folgenMitWhisper = [...new Set(mitWhisper.map(e => e.folge))].sort((a,b)=>a-b);
console.log(`Zweite Lesart liegt vor fuer Folge ${folgenMitWhisper.join(', ') || '(noch keine)'}`);
console.log(`${mitWhisper.length} von ${ergebnis.length} Regeln pruefbar | Fenster +/- ${FENSTER}s\n`);

console.log(`  ${String(beide.length).padStart(3)}  beide Lesarten belegen die Kernform  (belastbar)`);
console.log(`  ${String(nurW.length).padStart(3)}  nur der eigene Whisper-Lauf          (YouTube hat sie verstuemmelt)`);
console.log(`  ${String(nurY.length).padStart(3)}  nur die YouTube-Untertitel           (ungewoehnlich - nachsehen)`);
console.log(`  ${String(keine.length).padStart(3)}  keine von beiden                     (selbst nachhoeren)`);
console.log(`  ${String(ohneForm.length).padStart(3)}  Kernform zu kurz zum Suchen         (nicht mechanisch pruefbar)`);
if (schleifen.length) console.log(`  ${String(schleifen.length).padStart(3)}  davon mit Whisper-Wiederholungsschleife im Fenster (Lesart dort unbrauchbar)`);

const zeile = e => `  F${String(e.folge).padStart(2)} ${e.zeit.padStart(6)}  ${e.regel.padEnd(34)} ${e.formen.join(' ')}`;

if (nurW.length){
  console.log(`\n--- Nur der eigene Durchlauf belegt sie ---`);
  console.log(`Genau der Fall, fuer den er gemacht ist: YouTube kann arabische Woerter nicht.\n`);
  nurW.forEach(e => console.log(zeile(e)));
}
if (nurY.length){
  console.log(`\n--- Nur die YouTube-Untertitel belegen sie ---`);
  nurY.forEach(e => console.log(zeile(e)));
}
if (keine.length){
  console.log(`\n--- Keine der beiden Lesarten findet die Kernform im Fenster ---`);
  console.log(`Das heisst nicht "falsch": der Zeitstempel ist ungefaehr, und der Lehrer`);
  console.log(`spricht vieles deutsch aus, ohne es arabisch zu schreiben. Aber hier lohnt`);
  console.log(`sich das Nachhoeren am meisten. Einzeln ansehen mit:`);
  console.log(`  node pruefe-transkripte.js 90 <regel-id>\n`);
  keine.forEach(e => {
    const anteil = lehrerAnteil[e.folge];
    console.log(zeile(e) + (anteil ? `   (Lehreranteil der Folge ${anteil}%)` : ''));
  });
}
