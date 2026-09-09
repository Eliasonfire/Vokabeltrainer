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
 * ⚠️ WAS ER NICHT SAH — und wie die Luecke geschlossen wurde:
 *
 * Abschnitt 2 prueft, dass jede erzeugte Klasse isoliert ist. Er prueft NICHT,
 * ob ein Text ueberhaupt durch `arabischHervorheben()` laeuft. Genau daran lag
 * der Fehler im Regel-Aufklapper: dort stand `escapeHtml(text)` als reiner
 * Text, ohne Span — und ohne Span gibt es nichts zu isolieren.
 *
 * ⛔ Und genau dieser Fall kam am selben Tag ein zweites Mal: der Knopf
 * „Hier gilt auch:" zeigte `rule.name` weiter roh, waehrend der Titel darueber
 * seit einer Stunde verpackt war. Deshalb steht unten Abschnitt 4 — er fragt
 * vom BESTAND her: welches Feld traegt das Muster, und wer setzt es ein?
 *
 * ⭐ Die zweite Gegenprobe ist der Browser, und sie steht inzwischen in
 * pruefe-oberflaeche.js — ZWEIMAL: einmal an der Funktion selbst („Arabisch:
 * „X → Y" steht richtig herum") und einmal am echten Aufklapper („Aufklapper:
 * „Hier gilt auch:" steht richtig herum"), der `zeigeGrammatikPopover()` mit
 * einer verschachtelten Markierung aufruft und die beiden
 * `getBoundingClientRect().left` misst. Die erste haette den zweiten Fund
 * NICHT gefunden — sie prueft einen Nachbau, nicht den Weg.
 * [[gruener_pruefer_beweist_nur_geprueftes]] [[testvorlage_selbst_nachgebaut]]
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

/* ---------- 4. WELCHES FELD traegt das Muster — und wer setzt es ein? ------
 *
 * ⭐⭐ Abschnitt 2 prueft die Klassen, die es GIBT. Das ist die eine Haelfte.
 * Die andere stand oben im Kopf als das, was dieser Pruefer NICHT sieht: ein
 * Text, der gar nicht erst durch `arabischHervorheben()` laeuft, hat keine
 * Klasse, an der man etwas pruefen koennte.
 *
 * ⛔ Und genau das war am 09.09.2026 noch offen, eine Stunde nach dem Fund:
 * `rule.name` stand ZWEIMAL im selben Aufklapper — im Titel verpackt
 * (`mitAr`), im Knopf „Hier gilt auch:" roh (`escapeHtml`). Elf der 103
 * Regelnamen tragen das Muster. Der Fehler war angelegt und nur deshalb nicht
 * zu sehen, weil keine der vier heute verschachtelten Markierungen eine dieser
 * elf Regeln betrifft. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * Deshalb hier andersherum gefragt: nicht „ist die Klasse isoliert?", sondern
 * „welches Feld im Bestand traegt ueberhaupt zwei arabische Laeufe mit einem
 * neutralen Zeichen dazwischen — und was passiert damit?"
 *
 * Der Bestand wird VOLLSTAENDIG durchgegangen: jede Zeichenkette in jedem Feld
 * jeder Datenquelle, auch verschachtelt. Kein Feld rutscht durch, weil niemand
 * daran gedacht hat. Was gefunden wird, MUSS unten in ORTE stehen — sonst wird
 * dieser Pruefer rot und verlangt eine Einordnung.
 *
 * ⚠️ Was auch er nicht sieht: ob der eingetragene Weg der EINZIGE ist. Baut
 * jemand eine zweite Anzeige fuer dasselbe Feld, faellt das hier nicht auf.
 * Dagegen hilft nur die Messung im Browser (pruefe-oberflaeche.js).
 */
const ORTE = {
  'ESELSBRUECKEN_ALT[][]': {
    wo: 'js/lernen.js — der Merkhaken auf der Lernkarte',
    datei: 'js/lernen.js', ausdruecke: ['arabischHervorheben(notiz || vorschlag'] },
  'VOCAB_DATA[].mnemo': {
    wo: 'js/lernen.js — derselbe Weg, `mnemo` ist Vorschlag Nr. 0',
    datei: 'js/lernen.js', ausdruecke: ['arabischHervorheben(notiz || vorschlag'] },
  'FACHBEGRIFF_VOKABELN[].mnemo': {
    wo: 'js/lernen.js — Fachbegriffe sind Karteikarten mit demselben Feld',
    datei: 'js/lernen.js', ausdruecke: ['arabischHervorheben(notiz || vorschlag'] },
  'GRAMMAR_RULES[].name': {
    wo: 'js/saetze.js — Titel des Aufklappers UND der Knopf „Hier gilt auch:"',
    datei: 'js/saetze.js', ausdruecke: ['mitAr(rule.name)', 'mitAr(r.name)'],
    /* ⛔ Die Rueckfallsperre. Genau diese Zeile war der Fehler vom 09.09.2026:
       derselbe String, zweimal im selben Aufklapper, einmal verpackt und
       einmal roh. `ausdruecke` merkt, wenn der richtige Weg verschwindet;
       `verboten` merkt, wenn der falsche zurueckkommt. */
    verboten: ['escapeHtml(r.name)', 'escapeHtml(rule.name)'] },
  'GRAMMAR_RULES[].shortExplanation': {
    wo: 'js/saetze.js — Kernsatz und ausfuehrlicher Teil des Aufklappers',
    datei: 'js/saetze.js', ausdruecke: ['mitAr(kern)', 'mitAr(rest)'] },
  'SENTENCE_TAGS[][].bedeutung': {
    wo: 'js/saetze.js — die Glosse ueber der Regel',
    datei: 'js/saetze.js', ausdruecke: ['mitAr(span.dataset.bedeutung)'] },
  'VOCAB_DATA[].pl': {
    wo: 'js/lernen.js und js/kategorien.js — beide in `.wf-ar`',
    ausnahme: 'Zwei gleichwertige Plurale, mit " / " getrennt. Der Kasten '
      + 'enthaelt NUR Arabisch — dort ist rechts-nach-links die richtige '
      + 'Lesung, und beide Kaesten zeigen dasselbe Bild (der eine setzt '
      + 'direction:rtl, der andere nicht; bei reinem Arabisch gleichwertig). '
      + 'Verpacken wuerde die Reihenfolge UMDREHEN, nicht richten. Der Fehler '
      + 'entsteht erst, wenn deutscher Text im selben Ausdruck steht.' },
};

/* Jede Zeichenkette in jeder Quelle, mit ihrem Pfad. */
function feldpfade(quellen){
  const gefunden = new Map();
  const sieh = (pfad, wert) => {
    if (typeof wert === 'string'){
      const e = gefunden.get(pfad) || { n: 0, gesamt: 0 };
      e.gesamt++;
      if (PAAR.test(wert)) e.n++;
      gefunden.set(pfad, e);
    } else if (Array.isArray(wert)){
      for (const v of wert) sieh(pfad + '[]', v);
    } else if (wert && typeof wert === 'object'){
      for (const [k, v] of Object.entries(wert))
        if (typeof v !== 'function' && !(v instanceof RegExp)) sieh(pfad + '.' + k, v);
    }
  };
  for (const [name, q] of Object.entries(quellen))
    sieh(name, Array.isArray(q) ? q : Object.values(q));
  return gefunden;
}

let roh = 0;
let mitMuster = [];
console.log('');
console.log('--- Welches Datenfeld traegt das Muster, und wer setzt es ein? ---');
try {
  const G = (new Function(lies('grammar-data.js')
    + ';return {GRAMMAR_RULES, SENTENCE_TAGS, SATZ_THEMEN};'))();
  const QUELLEN = {
    VOCAB_DATA:          (new Function(lies('vocab-data.js') + ';return VOCAB_DATA;'))(),
    GRAMMAR_RULES:       G.GRAMMAR_RULES,
    SENTENCE_TAGS:       G.SENTENCE_TAGS,
    SATZ_THEMEN:         G.SATZ_THEMEN,
    LEHRBUCH_SAETZE:     (new Function(lies('lehrbuch-saetze.js') + ';return LEHRBUCH_SAETZE;'))(),
    ESELSBRUECKEN_ALT:   (new Function(lies('data', 'eselsbruecken-alt.js') + ';return ESELSBRUECKEN_ALT;'))(),
    BEISPIELSAETZE:      (new Function(lies('data', 'beispielsaetze.js') + ';return BEISPIELSAETZE;'))(),
    FACHBEGRIFF_VOKABELN:(new Function(lies('data', 'fachbegriffe.js') + ';return FACHBEGRIFF_VOKABELN;'))(),
  };
  const felder = feldpfade(QUELLEN);
  mitMuster = [...felder.entries()].filter(([, e]) => e.n > 0).sort((a, b) => b[1].n - a[1].n);
  console.log('  ' + felder.size + ' Textfelder durchgesehen, '
    + mitMuster.length + ' tragen das Muster:');
  for (const [p, e] of mitMuster){
    const ort = ORTE[p];
    const marke = !ort ? '⛔' : (ort.ausnahme ? '~ ' : 'ok');
    console.log('  ' + marke + '  ' + String(e.n).padStart(4) + ' von '
      + String(e.gesamt).padStart(5) + '  ' + p);
    if (!ort){
      roh++;
      console.log('        steht in KEINEM Eintrag. Nachsehen, wo das Feld angezeigt');
      console.log('        wird, und es oben in ORTE eintragen — mit dem Ausdruck, der');
      console.log('        es verpackt, oder mit einer Begruendung, warum roh richtig ist.');
    } else if (ort.ausnahme){
      console.log('        bewusst roh (' + ort.wo + '):');
      console.log('        ' + ort.ausnahme);
    } else {
      console.log('        ' + ort.wo);
    }
  }
} catch (e){
  console.log('  ⚠️ Bestand nicht lesbar (' + e.message + ') — dieser Abschnitt faellt aus.');
  roh++;
}

/* Und die eingetragenen Wege selbst: steht der Ausdruck ueberhaupt noch da?
   Ohne das waere ORTE eine Behauptung. Faellt `mitAr(r.name)` auf
   `escapeHtml(r.name)` zurueck, muss es hier knallen — das ist der ganze
   Zweck. [[zusicherung_im_kommentar_ist_keine_pruefung]] */
console.log('');
console.log('  Die eingetragenen Wege, am Quelltext nachgesehen:');
/* ⛔ OHNE KOMMENTARE. Der Kommentar ueber der reparierten Zeile in
   js/saetze.js nennt beide Fassungen beim Namen — „oben steht `mitAr(...)`,
   hier stand `escapeHtml(...)`". Auf dem Rohtext haette dieser Abgleich also
   die ABSICHT gelesen statt der Wirkung, und die Rueckfallprobe im Stoertest
   schlug sofort an. Gefunden hat es der Stoertest, nicht das Nachdenken.
   ⚠️ `texte: false`: die Ausdruecke stehen in Template-Literalen
   (`${mitAr(rule.name)}`) — wer die Texte mitmaskiert, loescht sie.
   [[kommentar_beschreibt_absicht_markup_wirkung]] */
const quelltext = (datei) => ohneKommentareUndTexte(lies(...datei.split('/')), { texte: false });
for (const [p, ort] of Object.entries(ORTE)){
  if (ort.ausnahme) continue;
  const quelle = quelltext(ort.datei);
  for (const a of ort.ausdruecke){
    const da = quelle.includes(a);
    if (!da) roh++;
    console.log('  ' + (da ? 'ok  ' : '⛔  ') + ort.datei + ':  ' + a
      + (da ? '' : '   FEHLT — wird ' + p + ' noch verpackt?'));
  }
  for (const v of (ort.verboten || [])){
    const da = quelle.includes(v);
    if (da) roh++;
    console.log('  ' + (da ? '⛔  ' : 'ok  ') + ort.datei + ':  ' + v
      + (da ? '   IST ZURUECK — dort steht ' + p + ' wieder verkehrt herum.'
            : '   steht nicht mehr da (Rueckfallsperre)'));
  }
}

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

  /* --- Abschnitt 4: die Feldsuche ---
     ⛔ Die Probetexte werden aus CODEPUNKTEN gebaut, nicht aus abgeschriebenen
     arabischen Zeichen. Ein von Hand kopierter Buchstabe kann eine Ḥarakah
     verlieren oder in einer anderen Normalform stehen — dann prueft die Probe
     etwas anderes, als sie sagt, und niemand sieht es der Zeile an.
     [[zeichenklasse_nie_sichtbar_kopieren]] */
  const M = String.fromCharCode(0x645);   // Mim
  const K = String.fromCharCode(0x643);   // Kaf
  const tief = feldpfade({ P: [{ a: { b: M + ' → ' + K } }] });
  sProbe('das Muster wird auch zwei Ebenen tief gefunden',
    tief.get('P[].a.b') && tief.get('P[].a.b').n, 1);
  const flach = feldpfade({ P: [{ a: { b: M + ' und deutscher Text' } }] });
  sProbe('ein einzelner arabischer Lauf ist KEIN Befund',
    flach.get('P[].a.b') && flach.get('P[].a.b').n, 0);
  sProbe('ein unbekannter Feldpfad steht nicht in ORTE',
    Object.prototype.hasOwnProperty.call(ORTE, 'P[].a.b'), false);
  /* ⛔ Hier stand „mitMuster.length === 6". Die Fehlereinspritzung hat es
     widerlegt: baut man ein SIEBTES Feld mit dem Muster ein — also genau den
     Fall, den dieser Abschnitt melden soll —, scheitert die Probe, und der
     Pruefer meldet „misst nicht" (Exit 1) statt „Befund" (Exit 2). Eine
     Sammelzahl als Zusicherung macht jeden echten Fund zum Werkzeugfehler.
     Deshalb jetzt einzeln, und ohne Obergrenze.
     [[sammelaussage_einzeln_belegen]] */
  const pfade = mitMuster.map(([p]) => p);
  for (const p of ['ESELSBRUECKEN_ALT[][]', 'GRAMMAR_RULES[].name',
                   'GRAMMAR_RULES[].shortExplanation', 'VOCAB_DATA[].mnemo',
                   'VOCAB_DATA[].pl', 'FACHBEGRIFF_VOKABELN[].mnemo'])
    sProbe('das Feld ' + p + ' wird gefunden', pfade.includes(p), true);
  /* Der Ausdrucksabgleich muss in BEIDE Richtungen koennen — und er sieht
     denselben kommentarfreien Text wie der Abschnitt oben. */
  const S = quelltext('js/saetze.js');
  sProbe('ein erfundener Ausdruck wird NICHT gefunden', S.includes('mitAr(gibt-es-nicht)'), false);
  sProbe('der echte Ausdruck wird gefunden',            S.includes('mitAr(rule.name)'), true);
  /* Die Rueckfallsperre selbst ist ein Befund, kein Stoertest — sie steht
     oben in ORTE unter `verboten` und faellt mit Exitcode 2 auf. Hier wird
     nur belegt, dass ihr Handgriff ueberhaupt etwas messen kann: eine Zeile,
     die es wirklich gibt, wird gefunden. Sonst waere „steht nicht mehr da"
     auch dann gruen, wenn die Suche gar nicht laeuft.
     [[stoertest_muss_wirkung_nachweisen]] */
  sProbe('die Rueckfallsperre kann ueberhaupt fuendig werden',
    S.includes('escapeHtml(quelle.join'), true);
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
}
if (roh){
  console.log('⛔ ' + roh + ' Feld/Weg ohne Verpackung — dort steht „X → Y" verkehrt herum.');
  console.log('   Die Stelle geht durch `arabischHervorheben(text, klasse)`, nicht durch');
  console.log('   `escapeHtml`: die Funktion maskiert selbst UND verpackt jeden Lauf');
  console.log('   einzeln. Ein CSS-`isolate` am aeusseren Kasten reicht NICHT — es');
  console.log('   trennt ihn von der Umgebung, nicht die beiden Laeufe voneinander.');
}
if (befunde || roh) process.exit(2);
console.log('✅ Jede Klasse für arabische Läufe ist isoliert, und jedes Feld mit dem');
console.log('   Muster wird verpackt — „X → Y" steht richtig herum.');
