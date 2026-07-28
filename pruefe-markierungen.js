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

const satz = {};
for (const v of VOCAB_DATA) satz[v.id] = v;
const roh = x => x.replace(/[\u064B-\u0652\u0670\u0640]/g, '');   // Taschkil + Tatweel weg
const blank = x => roh(x).replace(/[.،؟«»:]/g, '').trim();

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
  'fragepartikel-hal-01':   w => /^هل$/.test(blank(w)),
  'adjektive-an-ohne-tanwin-01': w => /ان$/.test(blank(w)),
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
console.log(`\n=== ${geprueft} von ${Object.values(SENTENCE_TAGS).flat().length} Markierungen mechanisch pruefbar, ${verdacht} verletzen ihre eigene Bedingung ===`);
for (const [id, v] of Object.entries(proRegel)) if (v.schlecht) console.log(`  ${id}: ${v.schlecht}/${v.n}`);
