/* pruefe-themen.mjs — die Ueberkategorien des Satzmodus im Blick behalten.
 * ==========================================================================
 *
 * Elias am 26.08.2026: "übrigens für den satzmodus wäre es auch glaube ich gut,
 * wenn es
 * auch einen prüfer oder werkzeug gibt der relativ regelmässig die
 * überkategorien prüft. halt welche überkategorien machen sinn, wann sollte
 * man eine neue hinzufügen, wo kann man das inkludieren oder sogar
 * verschmelzen (aber wahrscheinlich das eher seltener). wann und welche neue
 * kategorie sollte man hinzufügen. halt sowas weil ich darum kümmert sich
 * aktuell niemand aber stetig geht es hier voran. außerdem finde ich sollte
 * auch so ein bisschen nach früheren und aktuelleren themen sortiert werden.
 * offensichtlich brauchen die aktuelleren themen mehr übung als die früheren"
 *
 * ⛔ WARUM DIESE KATEGORIEN VON SELBST VERFALLEN
 *
 * SATZ_THEMEN ordnet Regeln ueber einen REGULAeREN AUSDRUCK AUF DIE ID zu:
 *   { id:'jarr', name:'Genitiv', muster:/^(harf-jarr|min-ila|fi-ala|...)/ }
 * Eine neue Regel landet also nur dann in einer Kategorie, wenn ihre id
 * zufaellig zu einem bestehenden Muster passt. Wer eine id frei waehlt, legt
 * die Regel unsichtbar neben alle Kategorien — ohne Fehler, ohne Warnung.
 * Genau deshalb faellt das niemandem auf: es gibt nichts zu bemerken.
 *
 * ⛔ DIESES WERKZEUG GIBT KANDIDATEN AUS, KEIN URTEIL.
 * Ob "Besitz" und "إِضافة" verschmelzen sollen, entscheidet Elias' Unterricht,
 * nicht eine Zahl. Jede Meldung nennt deshalb die Regeln beim Namen, damit er
 * an ihnen entscheiden kann. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * Aufruf:
 *   node werkzeuge/pruefe-themen.mjs            alle Befunde
 *   node werkzeuge/pruefe-themen.mjs --knapp    nur die Zaehlung
 *   node werkzeuge/pruefe-themen.mjs --reihenfolge
 *                                               nur die Aktualitaets-Tabelle
 *
 * Exitcode 0 = nichts zu entscheiden
 *          2 = Befunde fuer Elias (nie 1 — 1 ist Werkzeugfehler)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const knapp = process.argv.includes('--knapp');
const nurReihenfolge = process.argv.includes('--reihenfolge');

/* ---------- Daten laden ---------- */
const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8')
  + '\nglobalThis.__R=GRAMMAR_RULES; globalThis.__TH=SATZ_THEMEN; globalThis.__TG=SENTENCE_TAGS;', ctx);
const REGELN = ctx.__R, THEMEN = ctx.__TH.filter(t => t.muster), TAGS = ctx.__TG;

/* ⛔ Die Uebungsmodi stehen NICHT in den Daten, sondern im Quelltext von
   js/uebung.js. Sie werden hier ausgelesen statt nachgebaut — eine Handliste
   neben der echten Quelle laeuft auseinander, sobald jemand einen Modus
   umbenennt. [[handliste_neben_echter_quelle]] */
const uebung = fs.readFileSync(path.join(REPO, 'js', 'uebung.js'), 'utf8');
const MODI = [...uebung.matchAll(/id:'([a-z-]+)',\s*nr:(\d+),\s*name:'([^']+)',\s*art:'([a-z]+)'/g)]
  .map(m => ({ id: m[1], nr: +m[2], name: m[3], art: m[4] }));

const sichtbar = r => !r.ausgeblendet;
const folgeVon = r => (r.source && r.source.folge) || (r.source2 && r.source2.folge) || null;

let befunde = 0;
const sag = (...a) => { if (!knapp) console.log(...a); };
const H = t => sag('\n' + t + '\n' + '='.repeat(t.length));

/* ---------- 1. Wer gehoert wohin? ---------- */
const zuordnung = new Map();          // regel-id -> [thema-id, …]
for (const r of REGELN.filter(sichtbar)) {
  const treffer = THEMEN.filter(t => t.muster.test(r.id)).map(t => t.id);
  zuordnung.set(r.id, treffer);
}
const ohne = REGELN.filter(sichtbar).filter(r => zuordnung.get(r.id).length === 0);
const mehrfach = REGELN.filter(sichtbar).filter(r => zuordnung.get(r.id).length > 1);

console.log('Regeln: ' + REGELN.filter(sichtbar).length
  + ' | Ueberkategorien: ' + THEMEN.length
  + ' | ohne Kategorie: ' + ohne.length
  + ' | in mehreren: ' + mehrfach.length);

/* ---------- 2. Regeln ohne Kategorie, nach Stamm gebuendelt ---------- */
if (!nurReihenfolge && ohne.length) {
  H('⚠️  Regeln, die in KEINER Ueberkategorie liegen');
  sag('Sie sind im Satzmodus nur ueber "Alle" erreichbar — gezielt ueben kann');
  sag('man sie nicht. Zwei Auswege je Regel: in ein Muster aufnehmen, oder eine');
  sag('neue Kategorie eroeffnen.\n');
  /* Nach dem Wortstamm der id buendeln: drei Regeln mit demselben Stamm sind
     ein Kategorie-Vorschlag, eine einzelne ist ein Einsortier-Fall. */
  const stamm = s => String(s).split('-')[0];
  const gruppen = {};
  for (const r of ohne) (gruppen[stamm(r.id)] ||= []).push(r);
  for (const [st, rs] of Object.entries(gruppen).sort((a, b) => b[1].length - a[1].length)) {
    const marke = rs.length >= 3 ? '⭐ NEUE KATEGORIE? ' : '   einsortieren:   ';
    sag(marke + '"' + st + '" — ' + rs.length + ' Regel(n)');
    for (const r of rs) sag('      ' + r.id.padEnd(34) + (folgeVon(r) ? 'F' + String(folgeVon(r)).padStart(2, '0') : '  —') + '  ' + r.name);
    befunde++;
  }
  /* ⛔ ZWEITES KRITERIUM: die BEDEUTUNG, nicht nur die Form der id.
     Der erste Lauf am 26.08.2026 hat gezeigt, warum es noetig ist. Nach
     id-Stamm gebuendelt ergaben die sechs losen Regeln sechs Einzelfaelle —
     "ya", "fem", "koerperteile", "eigennamen", "ta", "badal". Nach ihrer
     BEDEUTUNG gebuendelt faellt auf, dass vier davon vom Weiblichen handeln:
     eine fehlende Kategorie, keine Streuung. Ein Formkriterium sieht das nie.
     [[form_sagt_nicht_welche_beziehung]]

     ⛔ UND EIN WORT BRAUCHT SEINEN NENNER. Der zweite Lauf schlug "lehrer"
     als Kategorie vor — das Wort stand in vier der sechs Erklaerungen und
     ausserdem in fast jeder anderen Regel auch. Ein Wort taugt nur dann als
     Kategoriename, wenn es bei den losen Regeln HAEUFIGER vorkommt als im
     ganzen Bestand. Deshalb wird gegen die Grundrate gemessen, nicht gegen
     eine Stoppwortliste — die haette "lehrer" nie enthalten.
     [[trefferquote_ohne_preis]] */
  const stamm2 = w => w.replace(/(en|er|es|em|e|n)$/, '');
  const worte = r => [...new Set((String(r.name || '') + ' ' + String(r.shortExplanation || ''))
    .toLowerCase().replace(/[^a-zäöüß ]+/g, ' ').split(/\s+/)
    .filter(w => w.length >= 5).map(stamm2).filter(w => w.length >= 4))];
  const zaehl = liste => { const h = {}; for (const r of liste) for (const w of worte(r)) (h[w] ||= []).push(r); return h; };
  const beiLosen = zaehl(ohne);
  const imBestand = zaehl(REGELN.filter(sichtbar));
  const N = REGELN.filter(sichtbar).length;
  const cluster = Object.entries(beiLosen)
    .filter(([w, rs]) => rs.length >= 2
      && rs.length / ohne.length >= 3 * ((imBestand[w] || []).length / N))
    .sort((a, b) => b[1].length - a[1].length);
  if (cluster.length) {
    sag('\n   ⭐ Nach BEDEUTUNG gebuendelt — Woerter, die bei den losen Regeln');
    sag('      mindestens dreimal so dicht stehen wie im ganzen Bestand:');
    const gezeigt = new Set();
    for (const [w, rs] of cluster) {
      if (rs.filter(r => !gezeigt.has(r.id)).length < 2) continue;
      rs.forEach(r => gezeigt.add(r.id));
      const grund = (imBestand[w] || []).length;
      sag('      "' + w + '…" — ' + rs.length + ' der ' + ohne.length + ' losen Regeln'
        + ' (im ganzen Bestand nur ' + grund + ' von ' + N + '):');
      for (const r of rs) sag('         ' + r.id.padEnd(34) + r.name);
      befunde++;
    }
  }
}

/* ---------- 3. Regeln in mehreren Kategorien ---------- */
if (!nurReihenfolge && mehrfach.length) {
  H('ℹ️  Regeln, die in mehreren Kategorien auftauchen');
  sag('Kein Fehler — aber ungewollt, wenn zwei Muster einander ueberlappen,');
  sag('statt dass die Regel wirklich zu beidem gehoert.\n');
  for (const r of mehrfach) {
    sag('   ' + r.id.padEnd(34) + zuordnung.get(r.id).join(' + '));
    sag('      ' + r.name);
  }
  befunde++;
}

/* ---------- 4. Groesse: verschmelzen oder teilen? ---------- */
const proThema = THEMEN.map(t => {
  const rs = REGELN.filter(sichtbar).filter(r => t.muster.test(r.id));
  const folgen = rs.map(folgeVon).filter(f => f != null).sort((a, b) => a - b);
  /* Wie viele Uebungsstellen haengen daran? Das ist der Wert, den Elias im
     Satzmodus als Zahl hinter dem Modus sieht — nicht die Regelanzahl. */
  const ids = new Set(rs.map(r => r.id));
  let stellen = 0;
  for (const k in TAGS) for (const tg of TAGS[k]) if (ids.has(tg.ruleId)) stellen++;
  return {
    id: t.id, name: t.name, regeln: rs.length, stellen,
    min: folgen[0] ?? null, max: folgen[folgen.length - 1] ?? null,
    median: folgen.length ? folgen[Math.floor(folgen.length / 2)] : null,
  };
});

if (!nurReihenfolge) {
  const klein = proThema.filter(t => t.regeln <= 3);
  const gross = proThema.filter(t => t.regeln >= 14);
  if (klein.length) {
    H('🔎 Klein genug zum Verschmelzen?');
    sag('Drei Regeln oder weniger. Eine eigene Zeile im Menue kostet Aufmerksamkeit;');
    sag('ob sich das lohnt, haengt am Unterricht, nicht an der Zahl.\n');
    for (const t of klein) sag('   ' + String(t.regeln).padStart(2) + ' Regeln, ' + String(t.stellen).padStart(3) + ' Uebungsstellen   ' + t.name + '  (' + t.id + ')');
    befunde++;
  }
  if (gross.length) {
    H('🔎 Gross genug zum Teilen?');
    sag('Vierzehn Regeln und mehr. Eine Kategorie, in der alles liegt, filtert nichts.\n');
    for (const t of gross) sag('   ' + String(t.regeln).padStart(2) + ' Regeln, ' + String(t.stellen).padStart(3) + ' Uebungsstellen   ' + t.name + '  (' + t.id + ')');
    befunde++;
  }
}

/* ---------- 5. Frueher oder aktuell? ---------- */
H('📅 Nach Aktualitaet — die spaeteren Folgen brauchen mehr Uebung');
const maxFolge = Math.max(...REGELN.map(folgeVon).filter(f => f != null));
sag('Neueste ausgewertete Folge: ' + maxFolge + '. "Median" ist die mittlere Folge');
sag('der Regeln einer Kategorie — robuster als der Durchschnitt, weil eine');
sag('einzelne alte Regel eine sonst neue Kategorie sonst nach hinten zieht.\n');
sag('  Median  Spanne     Regeln  Stellen  Kategorie');
for (const t of [...proThema].sort((a, b) => (b.median ?? -1) - (a.median ?? -1))) {
  const spanne = t.min == null ? '   —   ' : ('F' + String(t.min).padStart(2, '0') + '–F' + String(t.max).padStart(2, '0')).padEnd(8);
  const marke = t.median != null && t.median >= maxFolge - 4 ? ' ⭐ aktuell' : '';
  sag('   F' + String(t.median ?? 0).padStart(2, '0') + '    ' + spanne + '  '
    + String(t.regeln).padStart(5) + '  ' + String(t.stellen).padStart(6) + '   ' + t.name + marke);
}

/* ---------- 6. Die Uebungsmodi daneben ---------- */
if (!nurReihenfolge) {
  H('🧩 Die ' + MODI.length + ' Uebungsmodi — hat jede Kategorie einen?');
  sag('Der Satzmodus hat zwei Ebenen: die Ueberkategorien oben (Thema) und die');
  sag('Uebungsmodi (Frageform). Sie sind unabhaengig — hier steht nur, wo sich');
  sag('die Namen decken, damit auffaellt, wenn ein Thema keine Frageform hat.\n');
  const art = {};
  for (const m of MODI) (art[m.art] ||= []).push(m);
  for (const [a, ms] of Object.entries(art)) sag('   ' + a.padEnd(9) + ms.length + ' Modi: ' + ms.map(m => m.id).join(', '));
  const modusIds = new Set(MODI.map(m => m.id));
  const ohneModus = proThema.filter(t => !modusIds.has(t.id));
  if (ohneModus.length) {
    sag('\n   Kategorien ohne gleichnamigen Modus (nicht zwingend ein Mangel):');
    for (const t of ohneModus) sag('      ' + t.name + '  (' + t.id + ', ' + t.stellen + ' Stellen)');
  }
}

/* ---------- Schluss ---------- */
console.log('\n' + (befunde
  ? '⚠️  ' + befunde + ' Punkt(e) fuer Elias — Kandidaten, kein Urteil.'
  : '✅ Keine Kategorie faellt aus dem Rahmen.'));
process.exit(befunde ? 2 : 0);
