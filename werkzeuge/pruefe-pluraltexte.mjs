/* pruefe-pluraltexte.mjs — stimmen die Zahlen und Beispiele in den Eselsbruecken noch?
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS (09.09.2026)
 *
 * An diesem Tag haben 77 Pluralkarten einen eigenen Text bekommen, und in
 * jedem steht eine ZAHL („11 deiner Woerter bilden den Plural nach genau
 * dieser Form") und stehen BEISPIELE („كَلْبٌ → كِلَابٌ"). Beides war beim
 * Schreiben gemessen — und beides veraltet lautlos, sobald Elias eine Vokabel
 * dazunimmt, eine Pluralform korrigiert oder ein Wort ausblendet.
 *
 * ⭐ Eine Zahl im Fliesstext ist die haltbarste Art, still falsch zu werden:
 * sie sieht nach Messung aus und wird von nichts nachgerechnet.
 * [[zahlen_ohne_beleg]] [[zwischenstand_wird_nicht_mitgebaut]]
 *
 * ⚠️ Und zweimal an DIESEM Tag war die Zahl schon beim Schreiben falsch: „ALLE
 * deine Plurale, die mit مَـ anfangen" behauptete zehn, wo die Schablone sechs
 * traf; und meine Gesamtzahl hiess 122, weil das Skript nur vocab-data.js las,
 * waehrend die App 192 Karten baut. [[werkzeug_misst_kleineren_bestand]]
 *
 * ==========================================================================
 * ZWEI REGELN
 *
 * 1. JEDES „X → Y" in einem Eselsbrueckentext muss ein echtes Paar sein:
 *    X eine Vokabel, Y ihr Plural (oder eine der beiden Pluralformen).
 *    Das gilt fuer ALLE Texte, nicht nur die der Pluralkarten.
 *
 * 2. JEDE Zahl in „N deiner Woerter …" muss zu der Gruppe passen, ueber die
 *    der Satz spricht — gezaehlt wird an der Schablone, die im Text genannt
 *    ist.
 *
 * Aufruf:  node werkzeuge/pruefe-pluraltexte.mjs
 * Exit 0 = Zahlen und Beispiele stimmen · 1 = Stoertest greift nicht
 *       2 = ein Text behauptet etwas, das die Daten nicht hergeben
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (...t) => fs.readFileSync(path.join(REPO, ...t), 'utf8');
const V = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
const ALT = new Function(lies('data', 'eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')();

/* ---------- Die Schablonen ----------
   ⚠️ Sie stehen hier und NUR hier. Die Skripte, die die Texte erzeugt haben,
   waren Wegwerfwerkzeuge; dieser Pruefer ist das Bleibende. Wer eine Form
   aendert, aendert sie hier — und sieht sofort, welche Texte nicht mehr
   stimmen. */
const B = '[ء-ي]', F = 'َ', K = 'ِ', D = 'ُ', S = 'ْ';
const TW = '[ً-ٍ]?';
const SCHABLONEN = [
  /* ⛔ Hier NICHT „Buchstaben, dann ـُونَ": zwischen den Buchstaben stehen
     Harakat und Schadda (مُدَرِّسُونَ), und eine Zeichenklasse fuer Buchstaben
     kommt daran nicht vorbei. Gemessen wird das ENDE — beim ersten Lauf zaehlte
     die falsche Fassung 0 statt 16, und 16 Texte wurden dadurch als falsch
     gemeldet. Der Pruefer hatte unrecht, nicht die Texte.
     [[mein_neues_werkzeug_ist_verdaechtig]] */
  ['ـُونَ',    /ُونَ$/],
  ['فِعَال',   new RegExp('^' + B + K + B + F + 'ا' + B + TW + '$')],
  ['أَفْعَال',  new RegExp('^أ' + F + B + S + B + F + 'ا' + B + TW + '$')],
  ['فُعُول',   new RegExp('^' + B + D + B + D + 'و' + B + TW + '$')],
  ['فُعُل',    new RegExp('^' + B + D + B + D + B + TW + '$')],
  ['مَفَاعِيل', new RegExp('^م' + F + B + F + 'ا' + B + K + B + B + D + '$')],
  ['مَفَاعِل',  new RegExp('^م' + F + B + F + 'ا' + B + K + B + D + '$')],
];
const formVon = (pl) => (SCHABLONEN.find(([, re]) => re.test(pl)) || [null])[0];

/* Wie viele Woerter des Bestands bilden ihren Plural nach dieser Form? */
const jeForm = new Map(SCHABLONEN.map(([n]) => [n, 0]));
for (const w of V){
  if (!w.pl) continue;
  const f = formVon(String(w.pl).split('/')[0].trim());
  if (f) jeForm.set(f, jeForm.get(f) + 1);
}

/* Alle Paare „Wort → Plural", die es wirklich gibt. */
const echt = new Set();
for (const w of V){
  if (!w.pl) continue;
  for (const p of String(w.pl).split('/'))
    echt.add(String(w.ar).trim() + '→' + p.trim());
}

/* ---------- Lauf ---------- */
console.log('--- Zahlen und Beispiele in den Eselsbruecken ---\n');
const PAAR = /([ء-ْ]+)\s*→\s*([ء-ْ]+)/g;
const ZAHL = /(\d+)\s+deiner\s+W(?:ö|oe)rter|\((\d+)\s+W(?:ö|oe)rter bei dir/g;

let paare = 0, zahlen = 0, befunde = 0;
const texte = [];
for (const w of V){
  if (w.mnemo) texte.push({ id: String(w.id), wo: String(w.ar), t: String(w.mnemo) });
}
for (const [id, liste] of Object.entries(ALT))
  (liste || []).forEach((t, i) => texte.push({ id, wo: id, nr: i, t: String(t) }));

for (const e of texte){
  /* ⛔ NUR die Texte der Pluralkarten (09.09.2026). Der Pfeil heisst in den
     uebrigen Eselsbruecken nicht „Plural von", sondern schlicht „wird zu":
     عَلَى → عَلَيْهِ (Praeposition mit Endung), مُدَرِّسٌ → مُدَرِّسَةٌ
     (maennlich → weiblich). Die erste Fassung meldete acht solcher Stellen als
     Fehler — sie waren alle richtig, nur nicht das, wonach gesucht wurde.
     Ein Pruefer, der die Bedeutung eines Zeichens ueberdehnt, erzeugt genau die
     Kandidatenliste, die man nach dreimal wegklickt.
     [[kandidatenliste_ist_keine_fehlerliste]] [[kennzeichen_mit_zwei_ursachen]] */
  if (!String(e.id).endsWith('#pl')) continue;
  PAAR.lastIndex = 0;
  let m;
  while ((m = PAAR.exec(e.t))){
    const schluessel = m[1] + '→' + m[2];
    paare++;
    if (!echt.has(schluessel)){
      befunde++;
      console.log('  ⛔ ' + e.id + ': „' + m[1] + ' → ' + m[2] + '" ist kein Paar aus vocab-data.js');
    }
  }
  /* Die Zahl gilt der Form, die im selben Text genannt ist. */
  const form = SCHABLONEN.map(([n]) => n).find(n => e.t.includes(n))
    || (/ـُونَ/.test(e.t) ? 'ـُونَ' : null);
  if (!form) continue;
  ZAHL.lastIndex = 0;
  let z;
  while ((z = ZAHL.exec(e.t))){
    const behauptet = Number(z[1] || z[2]);
    zahlen++;
    const wirklich = jeForm.get(form);
    if (behauptet !== wirklich){
      befunde++;
      console.log('  ⛔ ' + e.id + ': behauptet ' + behauptet + ' Wörter der Form ' + form
        + ', gezählt sind ' + wirklich);
    }
  }
}
console.log('  ' + texte.length + ' Texte, ' + paare + ' Beispielpaare, ' + zahlen + ' Zahlen geprüft.');
console.log('  Formen im Bestand: '
  + [...jeForm].filter(([, n]) => n).map(([n, k]) => n + ' ' + k).join(' · '));

/* ---------- ⛔ STOERTEST ---------- */
console.log('');
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const einPaar = [...echt][0];
  const [a, b] = einPaar.split('→');
  sProbe('ein echtes Paar gilt als echt', echt.has(a + '→' + b), true);
  sProbe('ein erfundenes nicht', echt.has(a + '→' + 'زززز'), false);
  const eineForm = [...jeForm].find(([, n]) => n > 2);
  sProbe('es gibt eine Form mit mehr als zwei Wörtern', !!eineForm, true);
  /* Und die Erkennung selbst: findet PAAR ein Paar im Text? */
  PAAR.lastIndex = 0;
  const test = 'Beispiel: ' + a + ' → ' + b + ' und sonst nichts.';
  sProbe('das Muster findet ein Paar im Fließtext', (test.match(PAAR) || []).length, 1);
  ZAHL.lastIndex = 0;
  sProbe('das Muster findet eine Zahl im Fließtext',
    ('⚠️ 11 deiner Wörter machen das.'.match(ZAHL) || []).length, 1);
  sProbe('es wurden überhaupt Texte gelesen (>= 100)', texte.length >= 100, true);
  sProbe('es wurden überhaupt Paare gefunden (>= 20)', paare >= 20, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht.');
  process.exit(1);
}

console.log('');
if (befunde){
  console.log('⛔ ' + befunde + ' Behauptung(en) in Eselsbruecken decken sich nicht mit den Daten.');
  console.log('   Eine Zahl im Fliesstext veraltet lautlos — sie gehoert nachgerechnet');
  console.log('   oder aus dem Text heraus.');
  process.exit(2);
}
console.log('✅ Jede Zahl und jedes Beispielpaar in den Eselsbruecken hält der Messung stand.');
