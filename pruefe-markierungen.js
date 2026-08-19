/* pruefe-markierungen.js -- mechanische Pruefung der SENTENCE_TAGS.
 *
 * Aufruf:  node pruefe-markierungen.js
 *
 * validate.js prueft, ob eine Markierung technisch aufloesbar ist (Vokabel da,
 * Regel da, matchText kommt im Satz vor). Es prueft NICHT, ob die markierte
 * Stelle die zugeordnete Regel ueberhaupt zeigt. Genau dafuer ist diese Datei.
 *
 * Beruecksichtigt werden nur Regeln, deren Bedingung sich eindeutig am
 * Schriftbild ablesen laesst: ein bestimmter Buchstabe, eine bestimmte
 * Endung, ein bestimmtes Wort. Regeln ueber grammatische Rollen (mubtada,
 * marfu, nat, idafa ...) sind bewusst NICHT dabei - welches Wort das Subjekt
 * ist, steht nicht im Zeichen, das braucht eine inhaltliche Pruefung.
 *
 * Anlass (28.07.2026): Ein Audit fand zwei systematische Fehlmarkierungen, die
 * genau von dieser Art waren - possessiv-ya-01 hing achtmal an der Praeposition
 * فِي, weil dort zufaellig ein ي steht, und taschkil-kontext-01 an Adjektiven
 * ohne jedes Homographen-Paar. Beide haetten hier sofort aufgeschlagen.
 *
 * Ausgabe: nur Markierungen, die ihre eigene Bedingung verletzen. Kein
 * Exitcode-Gate - das Skript ist ein Suchwerkzeug, keine Pflichtpruefung. */
const fs = require('fs');
const P = __dirname + '/';
const { GRAMMAR_RULES, SENTENCE_TAGS } =
  (new Function(fs.readFileSync(P + 'grammar-data.js', 'utf8') + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
const { VOCAB_DATA } =
  (new Function(fs.readFileSync(P + 'vocab-data.js', 'utf8') + ';return {VOCAB_DATA};'))();
/* Zweite Satzquelle: die Saetze aus dem Lehrwerk. Ohne sie faenden die
   Pruefungen unten die Haelfte der Markierungen gar nicht erst. */
const { LEHRBUCH_SAETZE } =
  (new Function(fs.readFileSync(P + 'lehrbuch-saetze.js', 'utf8') + ';return {LEHRBUCH_SAETZE};'))();

const satz = {};
for (const v of VOCAB_DATA.concat(LEHRBUCH_SAETZE)) satz[v.id] = v;
const roh = x => x.replace(/[\u064B-\u0652\u0670\u0640]/g, '');   // Taschkil + Tatweel weg
/* Satzzeichen raus, sonst scheitert jede Bedingung mit $ still. Am 18.08.2026
   nachgemessen: von 371 matchText-Werten trugen 53 ein Satzzeichen. 52 davon
   fing diese Liste ab, eines nicht — das Ausrufezeichen in يَا وَلَدُ!
   (ya-nida-01). Dessen Bedingung prueft nur den Wortanfang, deshalb war es
   folgenlos; bei der naechsten Bedingung mit $ waere es das nicht. */
const blank = x => roh(x).replace(/[.،؟!«»:؛]/g, '').trim();

// Sonnenbuchstaben nach der Lehrerliste
const SONNE = 'تثدذرزسشصضطظلن';

const PRUEFUNG = {
  'ta-marbuta-fem-01':      w => /ة$/.test(blank(w)),
  'alif-maqsura-01':        w => /ى$/.test(blank(w)),
  'alif-maqsura-unveraenderlich-01': w => /ى$/.test(blank(w)),
  'madd-tabii-01':          w => /[اوي]/.test(blank(w)),
  'hamzatul-wasl-01':       w => /^ال/.test(blank(w)) || /^ا/.test(blank(w)),
  'schams-qamar-01':        w => /^ال/.test(blank(w)),
  'schams-qamar-merkhilfe-01': w => /^ال/.test(blank(w)),
  'al-gesamtheit-01':       w => /^ال/.test(blank(w)),
  'mina-al-01':             w => /من\s*ال/.test(blank(w)),
  'harf-jarr-fi-ala-01':    w => /^(في|على)(\s|$)/.test(blank(w)),
  'harf-jarr-min-ila-01':   w => /^(من|إلى|الى)(\s|$)/.test(blank(w)),
  'harf-jarr-li-01':        w => /^ل/.test(blank(w)),
  'li-al-lil-01':           w => /^لل/.test(blank(w)),
  'lil-vs-li-01':           w => /^ل/.test(blank(w)),
  'li-eigenname-01':        w => /^ل/.test(blank(w)),
  'harf-jarr-01':           w => /^(في|على|من|إلى|الى|ل)/.test(blank(w)),
  'ismul-isara-hadha-01':   w => /^ه?ذا$/.test(blank(w)),
  'hadha-stummes-alif-01':  w => /^ه?ذا$/.test(blank(w)),
  'hadha-dies-nicht-das-01':w => /^ه?ذا$/.test(blank(w)),
  'ismul-isara-hadhihi-01': w => /^هذه$/.test(blank(w)),
  'ismul-isara-dhalika-01': w => /ذلك/.test(blank(w)),
  'ismul-isara-tilka-01':   w => /^تلك$/.test(blank(w)),
  'istifham-ma-01':         w => /^ما$/.test(blank(w)),
  'istifham-men-01':        w => /^من$/.test(blank(w)),
  'istifham-ayna-01':       w => /^أين$/.test(blank(w)),
  'istifham-liman-01':      w => /^لمن$/.test(blank(w)),
  'min-ayna-01':            w => /من\s*أين/.test(blank(w)),
  'fragepartikel-alif-01':  w => /^أ/.test(blank(w)),
  /* Die Regel heisst nach هَلْ, handelt aber ausdruecklich von BEIDEN
     Fragepartikeln ("Es gibt im Arabischen zwei Fragepartikeln: أَ und هَلْ").
     Madina Buch 1 benutzt in den fruehen Lektionen durchgehend das
     angeschriebene أ - أَذَلِكَ قِطٌّ؟ - und kein هل. Die Pruefung laesst
     deshalb beide Formen zu, sonst schlaegt sie auf einen richtigen Beleg an. */
  'fragepartikel-hal-01':   w => /^هل$/.test(blank(w)) || /^أ./.test(blank(w)),
  /* ⛔ Die Bedingung war bis zum 18.08.2026 nur /ان$/ - und liess damit
     الْحِصَانُ durch, "das Pferd" aus هَذَا الْحِصَانُ سَرِيعٌ. Kein Adjektiv,
     und sein fehlendes Tanwin kommt vom ARTIKEL, nicht vom Schema فَعْلان.
     Die Markierung war die einzige dieser Regel und hat den Markierungs-Audit
     vom 28.07.2026 ueberlebt: mechanisch stimmte sie, inhaltlich war sie das
     Gegenteil dessen, was die Regel lehrt.
     Ein bestimmtes Wort kann diese Regel NIE zeigen. */
  'adjektive-an-ohne-tanwin-01': w => /ان$/.test(blank(w)) && !/^ال/.test(blank(w)),
  'huwa-hiya-01':           w => /^(هو|هي)$/.test(blank(w)),
  'possessiv-ya-01':        w => /ي$/.test(blank(w)) && !/^في$/.test(blank(w)),
  'mutabaqa-genus-01':      w => /ة$/.test(blank(w)),
  'nat-fem-01':             w => /ة$/.test(blank(w)),
  'fem-ohne-ta-marbuta-01': w => !/ة$/.test(blank(w)),
  'ya-nida-01':             w => /^يا(\s|$)/.test(blank(w)),
};

let geprueft = 0, verdacht = 0;
const proRegel = {};
for (const k of Object.keys(SENTENCE_TAGS)) {
  for (const t of SENTENCE_TAGS[k]) {
    const p = PRUEFUNG[t.ruleId];
    if (!p) continue;
    geprueft++;
    proRegel[t.ruleId] = proRegel[t.ruleId] || { n: 0, schlecht: 0 };
    proRegel[t.ruleId].n++;
    if (!p(t.matchText)) {
      verdacht++;
      proRegel[t.ruleId].schlecht++;
      const r = GRAMMAR_RULES.find(x => x.id === t.ruleId);
      console.log(`${t.ruleId} | ${r.name}\n   markiert: >>${t.matchText}<<  (Satz ${k}: ${(satz[k] || {}).sentAr})`);
    }
  }
}
console.log(`\n=== Regelbedingung: ${geprueft} von ${Object.values(SENTENCE_TAGS).flat().length} Markierungen pruefbar, ${verdacht} verletzen sie ===`);
for (const [id, v] of Object.entries(proRegel)) if (v.schlecht) console.log(`  ${id}: ${v.schlecht}/${v.n}`);

// --- Pruefung 1b: Regeln ueber FEHLENDES Tanwin an bestimmten Woertern? ---
//
// Neu am 18.08.2026, aus dem Fall الْحِصَانُ heraus verallgemeinert. Diese
// Regeln erklaeren alle, warum ein UNBESTIMMTES Wort ausnahmsweise kein Tanwin
// traegt. Ein Wort mit اَلْ traegt nie eines - es kann die Regel also nicht
// zeigen, sondern nur einen ganz anderen Grund vortaeuschen.
//
// ⚠️ Bewusst eine kurze, benannte Liste statt einer Textsuche nach "Tanwin".
// Der erste Versuch suchte in Namen und Erklaerungen danach und meldete elf
// Stellen - alle falsch, weil al-gesamtheit-01 und idafa-zweitglied-01 das
// Wort nur nebenbei erwaehnen und zu Recht an bestimmten Woertern haengen.
// Eine Kandidatenliste ist keine Fehlerliste.
const OHNE_TANWIN = ['adjektive-an-ohne-tanwin-01', 'tanwin-eigennamen-01',
  'tanwin-maennername-ta-01', 'eigennamen-fem-ohne-tanwin-01',
  'tanwin-nach-harf-jarr-01', 'mamnu-min-as-sarf-01', 'mudaf-ohne-al-01'];
let bestimmt = 0, gesehen = 0;
for (const k of Object.keys(SENTENCE_TAGS)) {
  for (const t of SENTENCE_TAGS[k]) {
    if (!OHNE_TANWIN.includes(t.ruleId)) continue;
    gesehen++;
    if (!/^و?ال/.test(blank(t.matchText))) continue;
    bestimmt++;
    console.log(`${t.ruleId} | markiert ein BESTIMMTES Wort: >>${t.matchText}<<`
      + `\n   (Satz ${k}: ${(satz[k] || {}).sentAr}) — mit اَلْ faellt das Tanwin ohnehin weg,`
      + `\n   die Stelle zeigt also nicht, was die Regel behauptet.`);
  }
}
console.log(`\n=== Regeln ueber fehlendes Tanwin: ${gesehen} Markierungen, ${bestimmt} an einem bestimmten Wort ===`);

// --- Pruefung 2: sitzt die Markierung an Wortgrenzen? --------------------
// Am 28.07.26 hingen acht Markierungen von harf-jarr-li-01 an Buchstaben aus
// der Wortmitte: >>لِبُ<< stammte aus الطَّالِبُ und hat mit der Praeposition
// لِ nichts zu tun. In der App unterstreicht das die halbe Wortmitte.
// Ausnahmen, die richtig sind: vorangestellte Partikeln, die mit dem Wort
// zusammengeschrieben werden - أَ (Frage), وَ und فَ (Anknuepfung).
const TRENNER = /[\s.،؟!«»:]/;
const TASCHKIL = /[ً-ْٰ]/;
let schief = 0;
for (const k of Object.keys(SENTENCE_TAGS)) {
  for (const t of SENTENCE_TAGS[k]) {
    const s = (satz[k] || {}).sentAr;
    if (!s) continue;
    const i = s.indexOf(t.matchText);
    if (i < 0) continue;                       // faengt validate.js ab
    // Manche Markierungen SIND ein Satzzeichen - fragepartikel-erforderlich-01
    // zeigt auf das Fragezeichen selbst. Da gibt es keine Wortgrenze zu pruefen.
    // U+061F ؟ liegt selbst im arabischen Block - deshalb auf Buchstaben
    // pruefen, nicht auf den Block.
    if (!/[ء-ي]/.test(t.matchText)) continue;
    const j = i + t.matchText.length;
    const davor = i === 0 ? ' ' : s[i - 1];
    const danach = j >= s.length ? ' ' : s[j];
    // Links: Trenner, oder eine angeschriebene Partikel davor.
    const linksOk = TRENNER.test(davor) || TASCHKIL.test(davor) && /[وفأ]/.test(s[i - 2] || '')
                    || /[وفأ]/.test(davor);
    // Rechts: Trenner, Taschkil - oder die Markierung IST eine solche Partikel.
    const rechtsOk = TRENNER.test(danach) || TASCHKIL.test(danach)
                     || blank(t.matchText).length <= 1;
    if (!linksOk || !rechtsOk) {
      schief++;
      console.log(`${t.ruleId} | >>${t.matchText}<< ${linksOk ? '' : '[links mitten im Wort] '}${rechtsOk ? '' : '[rechts mitten im Wort]'}\n   Satz ${k}: ${s}`);
    }
  }
}
console.log(`\n=== Wortgrenzen: ${schief} Markierungen sitzen mitten in einem Wort ===`);

// --- Pruefung 3: ueberschneiden sich zwei Markierungen? ------------------
// buildSentenceHtml() setzt die Unterstreichungen positionsbasiert und
// ueberspringt Ueberschneidungen still. Eine Regel waere dann in der App
// unsichtbar, ohne dass es irgendwo auffaellt - deshalb hier melden.
let kollision = 0;
for (const k of Object.keys(SENTENCE_TAGS)) {
  const s = (satz[k] || {}).sentAr;
  if (!s) continue;
  const sp = SENTENCE_TAGS[k]
    .map(t => ({ t, von: s.indexOf(t.matchText) }))
    .filter(x => x.von >= 0)
    .map(x => ({ ...x, bis: x.von + x.t.matchText.length }))
    .sort((a, b) => a.von - b.von);
  for (let i = 1; i < sp.length; i++) {
    if (sp[i].von < sp[i - 1].bis) {
      kollision++;
      console.log(`Satz ${k}: >>${sp[i - 1].t.matchText}<< (${sp[i - 1].t.ruleId}) und >>${sp[i].t.matchText}<< (${sp[i].t.ruleId}) ueberschneiden sich`);
    }
  }
}
console.log(`=== Ueberschneidungen: ${kollision} ===`);

// --- Pruefung 4: wie trennscharf sind die Bedingungen ueberhaupt? --------
//
// Neu am 18.08.2026. Anlass war الْحِصَانُ: die Bedingung /ان$/ hat eine
// falsche Markierung durchgelassen, weil sie zu weit war. Die Frage
// dahinter ist allgemeiner - eine Bedingung, die fast jedes Wort erfuellt,
// meldet nie etwas und sieht trotzdem nach Pruefung aus.
//
// Gemessen wird gegen die Woerter, die in den Saetzen wirklich vorkommen:
// welcher Anteil davon erfuellt die Bedingung? Ueber 25 % heisst, dass die
// Bedingung kaum trennt und die betroffenen Markierungen praktisch von Hand
// nachgesehen werden muessen.
//
// Gemessen beim ersten Lauf: madd-tabii-01 77,6 % (die Bedingung ist nur
// /[اوي]/) und fem-ohne-ta-marbuta-01 77,3 %. Beide wurden daraufhin von
// Hand geprueft und waren inhaltlich in Ordnung - die Zahl ist also kein
// Fehler, sondern eine Ansage, wo die Maschine aufhoert zu helfen.
const woerterImBestand = new Set();
for (const s of VOCAB_DATA.concat(LEHRBUCH_SAETZE)) {
  if (!s.sentAr) continue;
  for (const w of s.sentAr.split(TRENNER)) if (/[\u0621-\u064A]/.test(w)) woerterImBestand.add(w);
}
const alleW = [...woerterImBestand];
const stumpf = [];
for (const [id, p] of Object.entries(PRUEFUNG)) {
  if (!proRegel[id] || !proRegel[id].n) continue;      // nur benutzte Bedingungen
  let treffer = 0;
  for (const w of alleW) { try { if (p(w)) treffer++; } catch (e) { /* egal */ } }
  const anteil = 100 * treffer / alleW.length;
  if (anteil >= 25) stumpf.push({ id, anteil, n: proRegel[id].n });
}
/* Was beim Nachsehen von Hand herauskam (19.08.2026).
   Eine stumpfe Bedingung ist kein Fehler an sich — sie heisst nur, dass
   das Werkzeug diese Markierungen nicht gegenlesen kann. Ob sie richtig
   sitzen, entscheidet ein Mensch. Hier steht, was der Mensch gefunden hat,
   damit die Meldung beim naechsten Lauf nicht wie eine offene Aufgabe
   aussieht, die sie nicht mehr ist. */
const HANDGEPRUEFT = {
  'fem-ohne-ta-marbuta-01':
    '19.08.2026 — FEHLER GEFUNDEN. Die drei Markierungen sassen auf أُذُنٌ, '
    + 'عَيْنٌ und يَدُ, also auf PAARIGEN Koerperteilen. Genau diese Woerter '
    + 'nennt der Lehrer sechs Minuten spaeter in koerperteile-genus-01 '
    + '(F09 48:32). Diese Regel hier ist fuer Woerter, die OHNE Grund '
    + 'weiblich sind — ihre eigenen Beispiele sind اَلنَّار und قِدْرٌ. Die '
    + 'drei sind umgehaengt; die Regel steht jetzt auf قِدْرٌ (45854), wo '
    + 'هَذِهِ und ثَقِيلَةٌ die Weiblichkeit zeigen, obwohl das Wort kein '
    + 'Taʾ marbuta hat. Bedingung bleibt stumpf: die Regel heisst '
    + 'ausdruecklich "muss man auswendig lernen", es GIBT kein Merkmal.',
  'madd-tabii-01':
    '19.08.2026 — kein Fehler, aber gegenstandslos geworden: Elias hat die '
    + 'Regel von den Karteikarten genommen (nichtAufKarteikarten). Im '
    + 'Satzmodus bleibt sie auf seinen Wunsch. Die Bedingung ist stumpf, '
    + 'weil fast jedes arabische Wort einen langen Vokal enthaelt.',
  'hamzatul-wasl-01':
    '19.08.2026 — ebenfalls von den Karteikarten genommen. Bedingung stumpf, '
    + 'weil jedes Wort mit اَلْ die Bedingung erfuellt.',
};

stumpf.sort((a, b) => b.anteil - a.anteil);
for (const s of stumpf)
  console.log(`${s.id}: die Bedingung erfuellen ${s.anteil.toFixed(1)} % aller `
    + `${alleW.length} Woerter — sie prueft die ${s.n} Markierung(en) kaum`
    + (HANDGEPRUEFT[s.id] ? `\n    ✔ von Hand geprueft: ${HANDGEPRUEFT[s.id]}` : `, von Hand ansehen`));
console.log(`\n=== Trennschaerfe: ${stumpf.length} von ${Object.keys(PRUEFUNG).filter(id => proRegel[id] && proRegel[id].n).length} `
  + `benutzten Bedingungen lassen ueber ein Viertel aller Woerter durch ===`);
