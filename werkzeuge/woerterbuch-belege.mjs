/* woerterbuch-belege.mjs — Wortart und Plural bei arabdict und Reverso belegen,
 * DORT wo en.wiktionary nichts hat.
 *
 * ================== WOZU ===================================================
 *
 * Elias am 20.08.2026, zu den fehlenden Feldangaben:
 *
 *   „ich weiß die ganzen sachen nicht. entweder stehen sie bei arabic roots
 *    oder wir müssen eine andere quelle oder seite finden in der es steht.
 *    solch eine seite musst du dann suchen, testen und gucken ob man das
 *    verwenden kann und wenn sie gut ist dann all diese punkte machen"
 *
 * `aussenbelege.mjs` hat dafür en.wiktionary erschlossen. Es bleibt eine Lücke:
 * am 07.09.2026 gemessen fehlte bei **19** Wörtern die Wortart, und
 * en.wiktionary belegte davon **10**. Für die anderen neun gibt es seit
 * derselben Nacht zwei weitere Quellen — arabdict und Reverso, beide als MCP
 * unter `G:\1. Workspace\MCP-Servers\arabdict\`.
 *
 * ⛔⛔ ES TRÄGT NICHTS EIN. Es schreibt kein Feld in `vocab-data.js`. Es legt
 * Belege ab, die auf der Wartungsfragen-Seite neben der Frage erscheinen —
 * Elias entscheidet. Goal E.1 verbietet Erfundenes.
 *
 * ================== ⛔ WARUM DIE FILTERUNG STRENG IST =======================
 *
 * Weil beide Quellen bei zusammengesetzten Formen **Rauschen** liefern, nicht
 * Belege. Am 07.09.2026 an den neun offenen Wörtern gemessen:
 *
 *   مهندس  → arabdict „صيغة فاعل" .................... brauchbar
 *   اثنان  → Reverso „num." .......................... brauchbar
 *   خرج    → Reverso „v." ............................ brauchbar
 *
 *   بَعْدَ   → Reverso nennt FÜNF Wortarten (adv., conj., nm., prep., v.),
 *             arabdict findet بَعَد und بُعْد — andere Wörter ..... unbrauchbar
 *   حَالُكْ  → arabdict findet حالّ, das Partizip von حلَّ ...... unbrauchbar
 *   لِمَن   → sechs Wortarten für مَن; die Zusammensetzung
 *             لِ + مَن kennt keine der beiden Quellen ....... unbrauchbar
 *
 * Ein Beleg, der sechs Wortarten nennt, ist keiner — er sieht nur aus wie
 * einer. Und ein Beleg zum falschen Wort ist schlimmer als gar keiner: er
 * stünde neben der Frage und sähe geprüft aus. Deshalb gilt hier:
 *
 *   1. Die gefundene Form muss NACKT dem gesuchten Wort entsprechen.
 *   2. Die Quelle muss GENAU EINE Wortart nennen.
 *   3. Zusammengesetzte Wörter (Präposition + Suffix) werden gar nicht erst
 *      gefragt — die Grundform beantwortet eine andere Frage als die gestellte.
 *
 * [[kandidatenliste_ist_keine_fehlerliste]] [[bild_ohne_fehlermeldung_falsch]]
 *
 * ================== ⛔ EIGENE DATEI, NICHT aussenbelege.json ================
 *
 * `aussenbelege.mjs` schreibt seine Datei bei jedem Lauf **neu**. Was hier
 * hineingeschrieben würde, wäre beim nächsten Lauf spurlos weg — und das
 * Werkzeug meldete Erfolg. Deshalb `data/woerterbuch-belege.json`, und
 * `vorrat.mjs` liest beide. [[angleichen_loescht_handarbeit]]
 *
 * ================== DRITTE QUELLE: LANGENSCHEIDT, NUR FÜR `pl` ============
 *
 * Seit dem 07.09.2026 beantwortet **Langenscheidt** das Feld `pl` — die
 * größte offene Feldlücke (**25** Wörter, `node werkzeuge/vorrat.mjs`).
 * Elias hatte es angestoßen: „ja mach das mit langenscheidt für die plurale".
 *
 * ⛔ Es beantwortet NUR `pl`. Die Wortart bleibt bei arabdict und Reverso —
 * eine Quelle, die drei Fragen beantwortet, ist bei einer falschen Antwort
 * dreifach falsch, und die Filter sind je Feld verschieden.
 *
 * ⛔ Und es sagt NIE „hat keinen Plural". Gemessen schweigt Langenscheidt bei
 * مهندس (Plural مهندسون) und سيارة (سيارات) genauso wie bei سكر (Zucker, der
 * wirklich keinen hat). Null Treffer hat zwei Ursachen, die die Quelle nicht
 * trennt. Der Kopf von `langenscheidt.mjs` führt das aus.
 *
 * Aufruf:
 *   node werkzeuge/woerterbuch-belege.mjs            fragen und ablegen
 *   node werkzeuge/woerterbuch-belege.mjs --pruefen  nur zeigen
 *   node werkzeuge/woerterbuch-belege.mjs --nur-pl   nur die Pluralfrage
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { schlageNach as ausLangenscheidt } from './langenscheidt.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(WURZEL, 'data', 'woerterbuch-belege.json');
const MCP = 'G:/1. Workspace/MCP-Servers/arabdict/src/';

const nurZeigen = process.argv.includes('--pruefen');
/* ⭐ Reverso startet je Wort ein echtes Browserfenster. Wer nur die Plurale
   nachfragen will, soll dafür nicht 25 Fenster öffnen müssen. */
const nurPlural = process.argv.includes('--nur-pl');

/* ---------- Die Quellen ---------- */
let ausArabdict, ausReverso, nackt;
try {
  const a = await import(pathToFileURL(MCP + 'arabdict.mjs').href);
  const r = await import(pathToFileURL(MCP + 'reverso.mjs').href);
  ausArabdict = a.schlageNach; nackt = a.nackt; ausReverso = r.schlageNach;
} catch (e) {
  console.log('⛔ Der arabdict-MCP ist nicht erreichbar: ' + e.message);
  console.log('   Erwartet unter ' + MCP);
  process.exitCode = 1;
}

/* ---------- Bestand laden ---------- */
/* ⛔ `const VOCAB_DATA = …` legt KEINE Eigenschaft auf dem vm-Kontext an —
   `const` und `let` sind auf oberster Ebene nicht am globalen Objekt sichtbar.
   Ein Lauf ohne die Zeile darunter meldete „0 Wörter" und sah aus wie ein
   Befund: nichts zu tun. Die Zuweisung am Ende holt den Wert heraus, so wie
   test-p8.mjs es auch macht. [[leere_liste_ist_keine_messung]] */
const c = { window: {} }; vm.createContext(c); c.window = c;
const holen = (datei, name) => {
  const p = path.join(WURZEL, datei);
  if (!fs.existsSync(p)) return [];
  try {
    vm.runInContext(fs.readFileSync(p, 'utf8')
      + ';globalThis.__ = (typeof ' + name + ' !== "undefined") ? ' + name + ' : [];', c);
    return Array.isArray(c.__) ? c.__ : [];
  } catch { return []; }
};

const BESTAND = []
  .concat(holen('vocab-data.js', 'VOCAB_DATA'))
  .concat(holen('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN'))
  .concat(holen('data/vokabeln-eigene.js', 'EIGENE_VOKABELN'))
  /* Die in der App angelegten Wörter — ein Objekt mit `woerter`, kein Array. */
  .concat((() => {
    const p = path.join(WURZEL, 'data', 'eigene-woerter.json');
    if (!fs.existsSync(p)) return [];
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(j) ? j : (j.woerter || []);
    } catch { return []; }
  })());

/* ⛔⛔ EIN LEERES FELD IST NICHT DASSELBE WIE EINE LÜCKE.
   مَجْرُور hat kein Geschlecht, das man abfragen könnte — es ist Metasprache,
   kein Ding. `data/feld-ausnahmen.js` sagt das in `FELD_REGELN`, und diese
   Datei ist die QUELLE dafür. Eine eigene Liste hier wäre eine zweite
   Wahrheit, die beim ersten Widerspruch niemand mehr auflöst.

   Am 07.09.2026 gemessen, was der Unterschied ausmacht: ohne die Regeln zählte
   ich **33** Nomen ohne Geschlecht, `vorrat.mjs` zählte **8**. Die 25
   Differenz waren Fachbegriffe und Zahlwörter — allesamt erklärte Fälle.
   [[kandidatenliste_ist_keine_fehlerliste]] [[dieselbe_frage_zwei_antworten]] */
const REGELN = (() => {
  const p = path.join(WURZEL, 'data', 'feld-ausnahmen.js');
  if (!fs.existsSync(p)) return {};
  try {
    const k = { window: {} }; vm.createContext(k); k.window = k;
    vm.runInContext(fs.readFileSync(p, 'utf8')
      + ';globalThis.__ = (typeof FELD_REGELN !== "undefined") ? FELD_REGELN : {};', k);
    return k.__ || {};
  } catch { return {}; }
})();

/* Woher ein Wort stammt — die Regeln sprechen von „quellen". */
function quelleVon(w) {
  if (w && w.chapter === 'grammar') return 'fachbegriffe';
  if (w && String(w.id || '').startsWith('gram-')) return 'fachbegriffe';
  if (w && w.source === 'fachbegriff') return 'fachbegriffe';
  return 'vocab';
}

function erklaert(w, feld) {
  const r = REGELN[feld];
  if (!r) return false;
  if (Array.isArray(r.typen) && r.typen.includes(w.type)) return true;
  if (Array.isArray(r.quellen) && r.quellen.includes(quelleVon(w))) return true;
  return false;
}

/* Was en.wiktionary schon belegt — das wird nicht noch einmal gefragt. */
let SCHON = {};
try {
  const p = path.join(WURZEL, 'data', 'aussenbelege.json');
  if (fs.existsSync(p)) SCHON = JSON.parse(fs.readFileSync(p, 'utf8')).belege || {};
} catch { /* fehlt sie, wird eben alles gefragt */ }

/* ---------- Was fehlt ---------- */
const leer = (v) => v == null || String(v).trim() === '' || String(v).trim() === 'other';

/* ⛔⛔ DER NACKTVERGLEICH REICHT NICHT — er wirft genau das weg, worauf es
   ankommt. Am 07.09.2026 lieferte ein Lauf mit `nackt()` vier falsche Belege:

     بَعْدَ („nach", ein ظَرْف)   → arabdict fand بَعِدَ („fern sein") → „Verb"
     عِنْدَ („bei", ein ظَرْف)    → arabdict fand عانِد            → „Nomen"

   Nackt sind بعد und بعد dasselbe, vokalisiert sind es zwei Wörter. Genau
   deshalb steht im Gedächtnis, dass مِنْ und مَنْ nicht gleich sind.
   [[skelettvergleich_wirft_information_weg]]

   Verglichen wird deshalb MIT Ḥarakāt — aber ohne die Schlussendung, denn
   arabdict zitiert mit Tanwīn und Reverso ohne. Trägt Elias' Wort selbst kein
   Taschkīl, bleibt nur der Nacktvergleich; dann ist der Beleg schwächer, und
   das ist hier hinnehmbar, weil er ohnehin nur neben der Frage steht. */
function ohneEndung(s) {
  const t = String(s || '').normalize('NFC');
  let letzter = -1;
  for (let i = 0; i < t.length; i++) if (/[ء-ي]/.test(t[i])) letzter = i;
  if (letzter < 0) return t;
  /* Schadda (0651) bleibt — sie verdoppelt den Buchstaben, sie endet nicht. */
  return t.slice(0, letzter + 1) + t.slice(letzter + 1).replace(/[ً-ِْٰ]/g, '');
}
const hatTaschkil = (s) => /[ً-ْٰ]/.test(String(s || ''));

function formPasstZu(gefunden, gesuchtesWort) {
  if (!gefunden) return false;
  if (hatTaschkil(gesuchtesWort) && hatTaschkil(gefunden))
    return ohneEndung(gefunden) === ohneEndung(gesuchtesWort);
  return nackt(gefunden) === nackt(gesuchtesWort);
}

/* ⛔ Zusammengesetzte Formen gar nicht erst fragen. Erkennungszeichen: ein
   angehängtes Personalsuffix oder eine vorangestellte Präposition, die mit
   dem Rest verschmilzt. Die Grundform beantwortet dann eine ANDERE Frage. */
const SUFFIX = /(?:هَا|ها|هُمْ|هم|كُمْ|كم|هُ|ه|كِ|كَ|ك|ي|ْ?ه)$/;
const PRAEFIX = /^(?:لِ|بِ|فِ|كَ|وَ)/;
function zusammengesetzt(w) {
  const roh = String(w.ar || '').normalize('NFC');
  const bloss = nackt(roh);
  /* ⛔⛔ WORTGRUPPEN GAR NICHT ERST FRAGEN. Der erste Lauf am 07.09.2026 legte
     für حَرْفُ الْجَرِّ („Genitivpräposition") den Beleg „noun" ab — Reverso
     hatte nur حرف gefunden und dessen Wortart geliefert. Ein Beleg zum
     falschen Wort, und er sah geprüft aus. Genau Elias' Auflage: „aber auch
     prüfen ob man wirklich das richtige wort nimmt". */
  if (/\s/.test(roh.trim())) return true;
  /* ⛔ GEGEN DIE NACKTE FORM PRUEFEN, nicht gegen die vokalisierte.
     حَالُكْ endet auf ein Sukun, nicht auf ك — der Suffixtest griff deshalb
     nicht, und Reverso belegte das Wort mit حالِك („dunkel"), einem ganz
     anderen Wort. Nackt endet es sauber auf ك. [[zeilenende_r_bricht_muster]] */
  if (bloss.length <= 5 && PRAEFIX.test(roh) && SUFFIX.test(bloss)) return true;
  if (bloss.length <= 4 && SUFFIX.test(bloss)) return true;
  /* ⛔ Praeposition + eigenstaendiges FUNKTIONSWORT — لِمَن ist لِ + مَن und
     hat gar kein Suffix, rutschte deshalb durch. Die Pruefung darf aber nicht
     jedes Wort mit لِ verschlucken: لِسَان („Zunge") beginnt genauso.
     Deshalb zaehlt nur, was NACH dem Praefix uebrig bleibt — und das muss
     eines der wenigen Funktionswoerter sein, die hinter einer Praeposition
     stehen koennen. Eine Regel ueber Funktionswoerter, keine Wortliste.
     [[allgemeine_regel_statt_listeneintrag]] */
  const FUNKTIONSWOERTER = ["من", "ما", "ذا", "هو", "هي", "ذلك", "هذا"];
  if (PRAEFIX.test(roh) && FUNKTIONSWOERTER.includes(bloss.slice(1))) return true;
  return false;
}

/* Zwei Fragen, dieselbe Abfrage: die Wortart und — bei Nomen — das
   Geschlecht. Reverso nennt es als „nm." bzw. „nf.", also faellt es ohnehin
   an; ein zweiter Lauf dafuer waere ein zweiter Browserstart je Wort. */
/* ⛔⛔ `type: 'noun'` IST NICHT IMMER EINE ANGABE.
 *
 * `js/kern.js:530` setzt in `addPersonalVocab()` `type:'noun'` **fest** — für
 * jedes in der App angelegte Wort, ohne zu fragen. Gemessen am 07.09.2026:
 * **14 von 14** Wörtern in `data/eigene-woerter.json` tragen 'noun', darunter
 * ein Verb (خَرَجَ), ein Fragewort (كَيْفَ), drei Ẓarf (بَعْدَ, أَمَامَ,
 * عِنْدَ), zwei Adjektive (مَكْسُورٌ, كَسْلَانُ) und drei Partikeln.
 *
 * Der erste Pluralalauf glaubte dieser Angabe und legte prompt vier falsche
 * Belege an — jeweils den Plural eines gleichgeschriebenen NOMENS:
 *     بَعْدَ („nach")        → أبعاد  (Plural von بُعْد, „Abstand")
 *     كَيْفَ („wie")         → كيوف   (Plural von كَيْف, „Laune")
 *     خَرَجَ („herausgehen") → أخراج  (Plural von خَرْج, „Ausgabe")
 * Von fünf Belegen war genau einer richtig (سَيِّدٌ → سادة).
 *
 * ⭐ Ein Vorgabewert sieht aus wie ein Befund und ist keiner.
 * [[eingefrorenes_feld_ist_kein_zustand]] [[kann_ist_nicht_ist]]
 */
const EIGENE_IDS = new Set((() => {
  const p = path.join(WURZEL, 'data', 'eigene-woerter.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return (Array.isArray(j) ? j : (j.woerter || [])).map(w => String(w.id));
  } catch { return []; }
})());
/* Belegt ist die Wortart, wenn sie NICHT dieser Vorgabewert sein kann. Bei den
   eigenen Wörtern zählt sie nur, wenn etwas anderes als 'noun' dasteht — dann
   hat Elias sie über das Bearbeitungsformular selbst gesetzt. */
const wortartBelegt = (w) => !(EIGENE_IDS.has(String(w.id)) && w.type === 'noun');

function brauchtWas(w) {
  const b = SCHON[String(w.id)] || {};
  const noetig = [];
  /* ⭐ Auch ein 'noun', das nur der Vorgabewert ist, ist eine offene Frage.
     Vorher fielen die 14 eigenen Wörter durch jedes Raster: `leer()` sah
     'noun' und schwieg, und die Pluralfrage glaubte demselben 'noun'.
     Jetzt landen sie dort, wo sie hingehören — bei der Wortart. */
  if (!nurPlural && (leer(w.type) || !wortartBelegt(w)) && !b.typeApp && !erklaert(w, "type")) noetig.push("type");
  if (!nurPlural && w.type === "noun" && wortartBelegt(w)
      && leer(w.gender) && !b.gender && !erklaert(w, "gender")) noetig.push("gender");
  /* ⛔ Nur bei Nomen — und nur bei BELEGTEN Nomen, siehe oben. Ein Verb hat
     keinen Plural, und ein Fachbegriff wie مَجْرُور ist Metasprache;
     `FELD_REGELN` sagt beides, und `erklaert()` ist die EINE Stelle, die es
     weiß. Eine zweite Liste hier wäre eine zweite Wahrheit.
     [[dieselbe_frage_zwei_antworten]] */
  if (w.type === "noun" && wortartBelegt(w) && leer(w.pl) && !b.pl && !erklaert(w, "pl")) noetig.push("pl");
  return noetig;
}

const offen = BESTAND.filter(w => w && w.ar && brauchtWas(w).length);
const zaehle = (feld) => offen.filter(w => brauchtWas(w).includes(feld)).length;

console.log('Wörterbuch-Belege — ' + offen.length + ' Wörter mit offener Frage'
  + '  (Wortart ' + zaehle('type') + ' · Geschlecht ' + zaehle('gender')
  + ' · Plural ' + zaehle('pl') + ')');
console.log('Quellen: arabdict + Reverso für die Wortart, Langenscheidt für den Plural.');
console.log('⛔ Vorschläge, keine Einträge.' + (nurPlural ? '  (--nur-pl: nur die Pluralfrage)' : '') + '\n');

/* ---------- Die Übersetzung in das, was die App kennt ---------- */
/* ⚠️ Nur Eindeutiges. „nm." heißt „nom masculin" — das ist ein Nomen UND eine
   Geschlechtsangabe; beides wird getrennt weitergegeben, nie vermischt. */
const REVERSO_ZU_APP = {
  'v.': 'verb', 'n.': 'noun', 'nm.': 'noun', 'nf.': 'noun', 'nn.': 'noun',
  'num.': 'noun', 'adj.': 'adjective', 'adv.': 'adverb',
  'prep.': 'particle', 'conj.': 'particle', 'pron.': 'particle',
  'interj.': 'expression',
};
const REVERSO_GESCHLECHT = { 'nm.': 'masculine', 'nf.': 'feminine' };
/* arabdict schreibt arabisch. Nur die Angaben, die eindeutig eine Wortart
   nennen — „مصدر X" etwa nennt die Herkunft, nicht die Wortart des Eintrags. */
/* ⛔⛔ NUR EINDEUTIGE ANGABEN. Hier standen zuerst auch die Partizipien
   (صيغة فاعل / صيغة مفعول) auf 'noun' — das war falsch: ein Partizip aktiv
   kann ein Nomen sein (مُهَنْدِس, der Ingenieur) ODER ein Adjektiv
   (كَسْلَانُ, faul). Am 07.09.2026 belegte der Lauf كَسْلَانُ deshalb als
   'noun', obwohl es ein Adjektiv ist.

   ⛔ UND FORMGLEICHHEIT REICHT NICHT. عِنْدَ („bei", ein ظَرْف) traf
   arabdicts Eintrag zu عنَدَ („widerspenstig sein") — dieselbe Schreibung,
   anderes Wort. Ein Wörterbuch kann Homographen nicht für uns trennen; nur
   die Bedeutung könnte das, und die steht hier nicht zum Vergleich.

   Was bleibt, ist schmal — aber es traegt. [[form_sagt_nicht_welche_beziehung]] */
const ARABDICT_ZU_APP = [
  [/^اسم$/, 'noun'],
  [/^فعل/, 'verb'],
  [/^صفة$/, 'adjective'],
];

/* ---------- Fragen ---------- */
const belege = {};
const bericht = { bestaetigt: [], verworfen: [], uebersprungen: [] };

for (const w of offen) {
  if (zusammengesetzt(w)) {
    bericht.uebersprungen.push(w.ar + ' (' + (w.de || '') + ') — zusammengesetzte Form, '
      + 'die Grundform beantwortet eine andere Frage');
    continue;
  }
  const such = nackt(w.ar).replace(/^ال/, '');   /* Artikel weg: أَلْمُهَنْدِسٌ → مهندس */
  const eintrag = {};
  const quellen = [];
  const noetig = brauchtWas(w);
  /* ⭐ Nur die Quelle fragen, die für die offene Frage zuständig ist. Vorher
     lief für JEDES Wort arabdict und ggf. Reverso — und Reverso öffnet je Wort
     ein echtes Browserfenster. Mit der Pluralfrage kamen 25 Wörter dazu, für
     die keine der beiden etwas beizutragen hat. */
  const brauchtWortart = noetig.includes('type') || noetig.includes('gender');

  /* --- arabdict --- */
  if (brauchtWortart) try {
    const a = await ausArabdict(such);
    const passend = (a.formen || []).filter(f =>
      f.genauDasWort && f.angabe && !f.wortgruppe && formPasstZu(f.form, w.ar));
    const arten = [...new Set(passend.map(f => {
      for (const [muster, app] of ARABDICT_ZU_APP) if (muster.test(f.angabe)) return app;
      return null;
    }).filter(Boolean))];
    if (arten.length === 1) {
      eintrag.type = passend[0].angabe;
      eintrag.typeApp = arten[0];
      eintrag.form = passend[0].form;
      quellen.push('arabdict');
    } else if (arten.length > 1) {
      bericht.verworfen.push(w.ar + ' — arabdict nennt ' + arten.length
        + ' verschiedene Wortarten (' + arten.join(', ') + '), das ist kein Beleg');
    }
  } catch (e) { bericht.verworfen.push(w.ar + ' — arabdict: ' + e.message); }

  /* --- Reverso, nur wenn arabdict nichts Eindeutiges hatte --- */
  if (brauchtWortart && !eintrag.typeApp) {
    try {
      const r = await ausReverso(such, 'arabisch-deutsch');
      const z = r.zumSuchwort;
      const roh = (z && z.wortarten || []).filter(p => !String(p).includes('infl.'));
      const app = [...new Set(roh.map(p => REVERSO_ZU_APP[p]).filter(Boolean))];
      /* ⛔ Reverso antwortet auch dann, wenn es ein ANDERES Wort gefunden hat.
         Deshalb dieselbe Prüfung wie bei arabdict: die vokalisierte Form muss
         nackt dem gesuchten Wort entsprechen. Wo Reverso gar keine Form nennt
         (bei manchen Funktionswörtern), zählt, dass `inputText` unverändert
         zurückkommt — mehr sagt die Quelle dort nicht zu. */
      const formPasst = !z || !z.vokalisiert || !z.vokalisiert.length
        ? nackt(String(z && z.gesucht || '')) === nackt(such)
        : z.vokalisiert.some(v => formPasstZu(v.form, w.ar));
      if (app.length === 1 && !formPasst) {
        bericht.verworfen.push(w.ar + ' — Reverso antwortet, aber zu einem anderen Wort ('
          + (z.vokalisiert[0] ? z.vokalisiert[0].form : z.gesucht) + ')');
      } else if (app.length === 1) {
        eintrag.type = roh.join(', ');
        eintrag.typeApp = app[0];
        if (z.vokalisiert && z.vokalisiert[0]) eintrag.form = z.vokalisiert[0].form;
        const g = [...new Set(roh.map(p => REVERSO_GESCHLECHT[p]).filter(Boolean))];
        if (g.length === 1) eintrag.gender = g[0];
        if (z.uebersetzungen && z.uebersetzungen[0]) eintrag.gloss = z.uebersetzungen[0].deutsch;
        quellen.push('reverso');
      } else if (app.length > 1) {
        bericht.verworfen.push(w.ar + ' — Reverso nennt ' + app.length
          + ' Wortarten (' + roh.join(', ') + '), das ist kein Beleg');
      } else if (!roh.length) {
        bericht.verworfen.push(w.ar + ' — keine der beiden Quellen kennt es');
      }
    } catch (e) { bericht.verworfen.push(w.ar + ' — reverso: ' + e.message); }
  }

  /* --- Langenscheidt, nur für den Plural --- */
  if (noetig.includes('pl')) {
    try {
      /* ⛔ NICHT `such` übergeben. Das ist arabdicts `nackt()`, und das macht
         aus ة ein ه — in einer Langenscheidt-Adresse ist das ein anderes Wort
         (`اربعه` statt `أربعة`, leere Seite). Langenscheidt bekommt das Wort
         mit seinen Buchstaben und zieht selbst nur die Ḥarakāt ab.
         [[gleiche_messreihe_falsche_ursache]] */
      const l = await ausLangenscheidt(String(w.ar).normalize('NFC').replace(/^اَ?لْ?|^أَلْ?/, ''));
      if (l.eindeutig) {
        eintrag.pl = l.plural;
        eintrag.plUrl = l.url;
        quellen.push('langenscheidt');
        bericht.bestaetigt.push(w.ar + ' (' + (w.de || '') + ') → Plural ' + l.plural
          + '  [langenscheidt]');
      } else if (l.alle.length > 1) {
        /* ⛔ Der Homograph-Fall. رجل liefert رجال („Männer", von رَجُل) UND
           أرجل („Beine", von رِجْل) — zwei Wörter, ein Schriftbild, und
           Langenscheidt vokalisiert seine Lemmata nicht. Ein einzelner davon
           wäre geraten. Elias bekommt die Fundstelle und entscheidet.
           [[skelettvergleich_wirft_information_weg]] */
        bericht.verworfen.push(w.ar + ' (' + (w.de || '') + ') — ' + l.grund
          + '  ' + l.url);
      } else {
        /* ⛔ NICHT als „hat keinen Plural" ablegen — siehe Kopf. */
        bericht.verworfen.push(w.ar + ' (' + (w.de || '') + ') — Langenscheidt nennt keinen '
          + 'Plural. Das ist KEIN Beleg dafür, dass es keinen gibt.');
      }
    } catch (e) { bericht.verworfen.push(w.ar + ' — langenscheidt: ' + e.message); }
    /* Höflich bleiben — ein Abruf je Sekunde reicht für 25 Wörter. */
    await new Promise(x => setTimeout(x, 900));
  }

  if (eintrag.typeApp || eintrag.pl) {
    eintrag.woher = quellen.join(' + ');
    if (eintrag.typeApp) {
      eintrag.url = quellen[0] === 'arabdict'
        ? 'https://www.arabdict.com/de/deutsch-arabisch/' + encodeURIComponent(such)
        : 'https://woerterbuch.reverso.net/arabisch-deutsch/' + encodeURIComponent(such);
    }
    belege[String(w.id)] = eintrag;
    if (eintrag.typeApp) {
      bericht.bestaetigt.push(w.ar + ' (' + (w.de || '') + ') → ' + eintrag.typeApp
        + '  [' + eintrag.type + ', ' + eintrag.woher + ']'
        + (eintrag.gender ? ' · Geschlecht ' + eintrag.gender : ''));
    }
  }
}

/* ---------- Bericht ---------- */
const zeig = (titel, liste) => {
  if (!liste.length) return;
  console.log('=== ' + titel + ': ' + liste.length + ' ===');
  for (const z of liste) console.log('  ' + z);
  console.log('');
};
zeig('Belegt', bericht.bestaetigt);
zeig('Verworfen (mehrdeutig oder unbekannt)', bericht.verworfen);
zeig('Nicht gefragt (zusammengesetzt)', bericht.uebersprungen);

if (nurZeigen) {
  console.log('(nur geprueft — ohne --pruefen wird ' + path.relative(WURZEL, ZIEL) + ' geschrieben)');
} else {
  const inhalt = {
    erzeugt: new Date().toISOString(),
    quelle: 'arabdict.com und woerterbuch.reverso.net (Wortart), de.langenscheidt.com (Plural)',
    hinweis: 'Vorschläge, keine Einträge. Erscheinen als Beleg neben der Frage auf '
           + 'der Wartungsfragen-Seite; eingetragen wird nur, was Elias antippt. '
           + 'Ein Beleg steht hier nur, wenn die Quelle GENAU EINE Wortart bzw. '
           + 'GENAU EINEN Plural nennt und die Form dem gesuchten Wort entspricht. '
           + '⛔ Ein fehlender Plural bedeutet NICHT, dass es keinen gibt — '
           + 'Langenscheidt schweigt auch bei Wörtern, die einen haben.',
    belege,
  };
  /* ⛔⛔ WAS DER LAUF WEGNIMMT, MUSS ER SAGEN.
     Am 07.09.2026 schrieb ein zweiter Lauf die Datei von 11 auf 9 Belege
     herunter — und meldete nur „9 Belege". Verschwunden waren مَكْسُورٌ
     (adjective) und ein zweites eigenes Wort; beide fielen durch die neue
     Schranke `wortartBelegt()`, was richtig war. Aber richtig oder falsch
     entscheidet sich nicht an der Endzahl: ein stiller Abgang sieht aus wie
     „war nie da". [[zweiter_aufruf_ueberschreibt_still]] [[angleichen_loescht_handarbeit]] */
  let vorher = {};
  try {
    if (fs.existsSync(ZIEL)) vorher = JSON.parse(fs.readFileSync(ZIEL, 'utf8')).belege || {};
  } catch { /* unlesbar? dann gibt es eben keinen Vergleich */ }
  const alt = Object.keys(vorher), neu = Object.keys(belege);
  const weg = alt.filter(id => !neu.includes(id));
  const dazu = neu.filter(id => !alt.includes(id));

  fs.writeFileSync(ZIEL + '.neu', JSON.stringify(inhalt, null, 2), 'utf8');
  fs.renameSync(ZIEL + '.neu', ZIEL);
  console.log('Geschrieben: ' + path.relative(WURZEL, ZIEL)
    + '  (' + neu.length + ' Belege, vorher ' + alt.length + ')');
  if (dazu.length) console.log('  + ' + dazu.length + ' neu:  ' + dazu.join(', '));
  if (weg.length) {
    console.log('  ⚠️ ' + weg.length + ' Beleg(e) FALLEN WEG — nachsehen, ob das gewollt ist:');
    for (const id of weg) {
      const v = vorher[id];
      console.log('      ' + id + '  war: ' + (v.typeApp || v.pl || '?')
        + (v.type ? '  [' + v.type + ']' : '') + '  von ' + (v.woher || '?'));
    }
  }
}
