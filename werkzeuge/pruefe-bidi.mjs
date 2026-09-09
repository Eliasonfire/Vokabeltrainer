/* pruefe-bidi.mjs — steht „X → Y" auf dem Schirm auch in dieser Reihenfolge?
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS (09.09.2026)
 *
 * „مَدْرَسَةٌ → مَدَارِسُ" stand in den Eselsbruecken RUECKWAERTS. Im Browser
 * gemessen: erstes Wort x=93, Pfeil x=73, zweites Wort x=0 — gelesen wurde
 * also Plural → Singular, bei Texten, deren ganzer Zweck die Richtung ist.
 *
 * Der Grund ist der Bidi-Algorithmus: ein Pfeil (oder /, ·, =) ist ein
 * NEUTRALES Zeichen. Steht es zwischen zwei arabischen Laeufen, bekommt es
 * deren Richtung, und der ganze Ausdruck kippt. Zwischen Arabisch und Deutsch
 * passiert das NICHT — dort nimmt das Zeichen die Absatzrichtung.
 * [[rtl_richtung_physisch]]
 *
 * Betroffen waren 94 von 848 Eselsbruecken und 3 Regelfelder — auch solche,
 * die es seit Wochen gab. Niemand meldet so etwas, weil man es fuer arabische
 * Schreibrichtung haelt.
 *
 * ⭐⭐ UND DIE LOESUNG STAND SCHON IM HAUS. `.ar-wort` (Uebungsmodus) trug
 * `unicode-bidi:isolate` bereits — ohne ein Wort der Erklaerung, mitten in
 * einer Zeile mit Schriftgroessen. Dieselbe Entscheidung, drei Orte, und zwei
 * davon hatten sie nicht. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ==========================================================================
 * DIE REGEL
 *
 *   Jede Klasse, die `arabischHervorheben(text, klasse)` erzeugen kann, MUSS
 *   in index.html eine CSS-Regel mit `unicode-bidi: isolate` haben.
 *
 * Das ist die enge, pruefbare Fassung: die Funktion ist die EINZIGE Stelle,
 * die arabische Laeufe in deutschem Text verpackt. Was sie erzeugt, ist der
 * vollstaendige Satz der Orte, an denen das Problem auftreten kann.
 *
 * Aufruf:  node werkzeuge/pruefe-bidi.mjs
 * Exit 0 = jede Klasse ist isoliert · 1 = Stoertest greift nicht
 *       2 = eine Klasse ohne Isolation — dort steht „X → Y" verkehrt herum
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (...t) => fs.readFileSync(path.join(REPO, ...t), 'utf8');

/* ---------- 1. Welche Klassen kann arabischHervorheben() erzeugen? ---------- */
const KERN = lies('js', 'kern.js');
const klassen = new Set();
/* der Vorgabewert: `const k = klasse || 'mn-ar';` */
const vorgabe = KERN.match(/klasse\s*\|\|\s*['"]([\w-]+)['"]/);
if (vorgabe) klassen.add(vorgabe[1]);
/* und jede mitgegebene Klasse an den Aufrufstellen.

   ⛔ Das erste Argument darf KLAMMERN enthalten. Die erste Fassung stand hier
   mit `[^,()]*` und fand deshalb `arabischHervorheben(String(s ?? ''), 'gp-ar')`
   in js/saetze.js NICHT — ausgerechnet die Klasse, die eine Stunde zuvor wegen
   genau dieses Fehlers angelegt worden war. Der Pruefer meldete gruen ueber
   zwei von drei Klassen. [[mein_neues_werkzeug_ist_verdaechtig]] */
for (const datei of fs.readdirSync(path.join(REPO, 'js')).filter(f => f.endsWith('.js'))){
  const maske = ohneKommentareUndTexte(lies('js', datei), { texte: false });
  for (const m of maske.matchAll(/arabischHervorheben\s*\([\s\S]{0,120}?,\s*['"]([\w-]+)['"]\s*\)/g))
    klassen.add(m[1]);
}

console.log('--- Bidi-Isolation der arabischen Laeufe ---\n');
if (klassen.size < 2){
  console.log('⛔ Nur ' + klassen.size + ' Klasse(n) gefunden — das Suchmuster passt nicht mehr.');
  console.log('   Erwartet werden der Vorgabewert in js/kern.js und die Aufrufe mit Klassenname.');
  process.exit(2);
}

/* ---------- 2. Traegt jede von ihnen die Isolation? ---------- */
const HTML = lies('index.html');
const hatIsolation = (k) => {
  /* Alle Regelbloecke, deren Selektor die Klasse nennt. */
  const re = new RegExp('(^|[,}])\\s*[^{}]*\\.' + k + '\\b[^{}]*\\{([^}]*)\\}', 'gm');
  let m;
  while ((m = re.exec(HTML))) if (/unicode-bidi\s*:\s*isolate/.test(m[2])) return true;
  return false;
};
let befunde = 0;
for (const k of [...klassen].sort()){
  const ok = hatIsolation(k);
  if (!ok) befunde++;
  console.log('  ' + (ok ? 'ok  ' : '⛔  ') + '.' + k
    + (ok ? '  trägt unicode-bidi:isolate' : '  OHNE Isolation — „X → Y" steht dort verkehrt herum'));
}

/* ---------- 3. Wie viele Texte haengen daran? (Einordnung, kein Urteil) ---- */
const PAAR = /[ء-ْ][^ء-ْ\n]{0,4}[→←/·=][^ء-ْ\n]{0,4}[ء-ْ]/;
const zaehle = (name, texte) => {
  const n = texte.filter(t => PAAR.test(String(t))).length;
  console.log('  ' + String(n).padStart(4) + ' von ' + String(texte.length).padStart(4)
    + '  ' + name);
  return n;
};
console.log('');
console.log('  Texte mit zwei arabischen Laeufen und einem Zeichen dazwischen:');
let alle = 0;
try {
  const V = new Function(lies('vocab-data.js') + '; return VOCAB_DATA;')();
  const A = new Function(lies('data', 'eselsbruecken-alt.js') + '; return ESELSBRUECKEN_ALT;')();
  const { GRAMMAR_RULES } = (new Function(lies('grammar-data.js') + ';return {GRAMMAR_RULES};'))();
  alle += zaehle('Merkhaken an der Vokabel (mnemo)', V.map(w => w.mnemo || ''));
  alle += zaehle('weitere Eselsbruecken', Object.values(A).flat());
  alle += zaehle('Grammatikregeln (Name und Erklaerung)',
    GRAMMAR_RULES.flatMap(r => [r.name || '', r.shortExplanation || '']));
} catch (e){
  console.log('  ⚠️ Bestand nicht lesbar (' + e.message + ') — die Einordnung fehlt.');
}
console.log('  ' + alle + ' Stellen haengen an dieser einen CSS-Eigenschaft.');

/* ---------- ⛔ STOERTEST ---------- */
console.log('');
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  sProbe('eine Klasse ohne CSS-Regel faellt auf', hatIsolation('gibt-es-nicht'), false);
  const eine = [...klassen][0];
  sProbe('eine echte Klasse wird erkannt', hatIsolation(eine), true);
  /* Und das Erkennungsmuster fuer die Texte. */
  sProbe('„A → B" gilt als Paar', PAAR.test('مُسْلِمٌ → مُسْلِمَةٌ'), true);
  sProbe('„A / B" auch', PAAR.test('اَلْقَمَر / اَلشَّمْس'), true);
  sProbe('Arabisch — Deutsch NICHT', PAAR.test('حَرْف جَرّ — Genitivpräposition'), false);
  sProbe('reiner deutscher Text NICHT', PAAR.test('Erst das eine, dann das andere.'), false);
  /* ⛔ Die drei, die es heute wirklich gibt — namentlich. „mehrere gefunden"
     war zu lasch: die erste Fassung fand zwei von drei und meldete gruen.
     Kommt eine vierte dazu, faellt sie durch die Aufrufsuche auf; verschwindet
     eine der drei, faellt es hier auf. [[sammelaussage_einzeln_belegen]] */
  for (const k of ['mn-ar', 'ar-wort', 'gp-ar'])
    sProbe('die Klasse .' + k + ' wird gefunden', klassen.has(k), true);
  sProbe('es wurden mehrere Klassen gefunden (>= 3)', klassen.size >= 3, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht.');
  process.exit(1);
}

console.log('');
if (befunde){
  console.log('⛔ ' + befunde + ' Klasse(n) ohne `unicode-bidi: isolate`.');
  console.log('   In index.html ergaenzen. KEIN `dir="rtl"` dazu — das zieht die');
  console.log('   Klammer hinter قَرِيبٌ auf die falsche Seite (siehe js/kern.js).');
  process.exit(2);
}
console.log('✅ Jede Klasse für arabische Läufe ist isoliert — „X → Y" steht richtig herum.');
