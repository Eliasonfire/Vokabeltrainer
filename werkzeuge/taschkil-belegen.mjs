/* taschkil-belegen.mjs — holt für die Wörter ohne vollständiges Taschkīl
 * Belege aus ZWEI unabhängigen Quellen und legt sie Elias vor.
 *
 * ⛔⛔ ES TRÄGT NICHTS EIN. Es sammelt und stellt gegenüber. Elias' Auflage
 * E.1 gilt unverändert: „Nicht selbst vokalisieren." Eine Wörterbuchform ist
 * ein Vorschlag, kein Beleg aus dem Unterricht — und wo die beiden Quellen
 * sich widersprechen, entscheidet er.
 *
 * ⭐ WARUM ZWEI QUELLEN (07.09.2026)
 *
 * Weil eine einzelne täuscht. Am selben Wort gemessen:
 *
 *     arabdict   كُرْسِيّ   سَيِّدٌ
 *     Reverso    كُرْسِي    سَيِّد
 *
 * arabdict schreibt die Schadda und das Tanwīn, Reverso lässt beides weg.
 * Beide sind für sich nicht falsch — sie zitieren verschieden. Wer nur eine
 * fragt, hält ihre Schreibweise für DIE Schreibweise.
 * [[zwei_rechtschreibungen_ein_text]] [[naechstliegender_wert_ist_nicht_zuverlaessigster]]
 *
 * ⚠️ REVERSO IST LANGSAM: jeder Abruf startet einen echten Browser (fetch und
 * headless bekommen HTTP 403). Rechne mit ~8 Sekunden je Wort. Deshalb fragt
 * das Werkzeug arabdict zuerst und Reverso nur dort, wo es etwas zu klären
 * gibt — oder auf Wunsch mit --beide überall.
 *
 * Aufruf:
 *     node werkzeuge/taschkil-belegen.mjs             # beide Quellen (Standard)
 *     node werkzeuge/taschkil-belegen.mjs --schnell   # nur arabdict, ohne Browser
 *     node werkzeuge/taschkil-belegen.mjs --wort كرسي
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

/* ⛔ Auf Windows verlangt der ESM-Lader eine file://-URL — ein Pfad wie
   „G:/…" wird als Protokoll „g:" gelesen und abgewiesen. pathToFileURL macht
   daraus das Richtige, ohne dass irgendwo ein Backslash durch eine Shell muss.
   [[windows_pfad_in_python_string]] */
import { pathToFileURL, fileURLToPath } from 'node:url';
const MCP = 'G:/1. Workspace/MCP-Servers/arabdict/src/';
const holeModul = (datei) => import(pathToFileURL(MCP + datei).href);
const { schlageNach: ausArabdict, nackt } = await holeModul('arabdict.mjs');
const { schlageNach: ausReverso } = await holeModul('reverso.mjs');

const args = process.argv.slice(2);
/* Elias am 07.09.2026: „kann man so machen, vielleicht aber auch immer
   reverso gegenpruefen lassen, an sich ist der aufwand fuer dich auch nicht
   so gross bei reverso" — also laufen BEIDE Quellen, und --schnell ist der
   Ausnahmefall. Das kostet rund drei Minuten fuer den ganzen Bestand.
   ⭐ Der Vergleich ist der eigentliche Wert: von 19 Woertern stuetzten sich
   die Quellen bei 8 gegenseitig und widersprachen sich bei 2 wirklich.
   Eine einzelne Quelle haette beides nicht gezeigt. */
const mitReverso = !args.includes('--schnell');
const einzeln = args.includes('--wort') ? args[args.indexOf('--wort') + 1] : null;

/* ------------------------------------------------------------------
   Die Wörter kommen aus dem Prüfer selbst — nicht aus einer Handliste.
   ⛔ Eine Liste, die ich danebenlege, veraltet in dem Moment, in dem ein
   Befund verschwindet, und behauptet dann Arbeit, die keine mehr ist.
   [[handliste_neben_echter_quelle]]
   ------------------------------------------------------------------ */

/* Überschriften, die AUSDRÜCKLICH kein Mangel sind. Sie stehen so im Prüfer;
   was er selbst als „kein Mangel" ausweist, wird hier nicht nachgeschlagen. */
const KEIN_MANGEL = '[kein Mangel]';

function befundeHolen() {
  /* ⛔ pruefe-taschkil.js endet mit Exitcode 1, SOBALD es Befunde gibt — das
     ist sein Sinn, kein Fehler. execFileSync wirft darauf trotzdem, und die
     Ausgabe hängt dann am Fehlerobjekt. Wer hier nur den Erfolgsfall behandelt,
     bekommt genau dann nichts, wenn es etwas zu tun gibt. */
  let ausgabe;
  const optionen = {
    cwd: path.resolve(fileURLToPath(new URL('..', import.meta.url))),
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  };
  try {
    ausgabe = execFileSync('node', ['pruefe-taschkil.js'], optionen);
  } catch (e) {
    ausgabe = e.stdout;
    if (!ausgabe) throw new Error('pruefe-taschkil.js lieferte keine Ausgabe: ' + e.message);
  }

  const funde = [];
  let abschnitt = null;
  for (const zeile of ausgabe.split(/\r?\n/)) {
    const kopf = zeile.match(/^===\s*(.+?):\s*\d+\s*===$/);
    if (kopf) { abschnitt = kopf[1]; continue; }
    if (!abschnitt || abschnitt.includes(KEIN_MANGEL)) continue;
    /* Format: „  WORT    Stelle N (X)  FELD  id ID" */
    const m = zeile.match(/^\s{2}(\S+)\s+Stelle\s+(\d+)\s+\((.)\)\s+(\S+)\s+id\s+(\S+)\s*$/);
    if (m) funde.push({ wort: m[1], stelle: +m[2], zeichen: m[3], feld: m[4], id: m[5], abschnitt });
  }
  return funde;
}

/* Nur ein Wort je Schreibung fragen — dieselbe Form steht oft in mehreren
   Feldern (ar und sentAr) und wäre sonst zwei Abrufe. */
function eindeutig(funde) {
  const map = new Map();
  for (const f of funde) {
    if (!map.has(f.wort)) map.set(f.wort, { ...f, stellen: [] });
    map.get(f.wort).stellen.push(f.feld + ':' + f.id);
  }
  return [...map.values()];
}

/* ------------------------------------------------------------------ */

const HARAKA = /[\u064B-\u0652\u0670]/;
const zaehleHaraka = (s) => (String(s).match(/[\u064B-\u0652\u0670]/g) || []).length;

/* ⭐⭐ „VERSCHIEDEN" WAR ZU NEUNT AUS NEUNZEHN RAUSCHEN.
 *
 * Der erste Vergleichslauf am 07.09.2026 meldete bei 9 von 19 Wörtern, die
 * Quellen schrieben verschieden. Angesehen war es fast immer dasselbe:
 *
 *     arabdict  اِمْتِحَانٌ      Reverso  اِمْتِحَان
 *     arabdict  مُجَادَلَةٌ      Reverso  مُجَادَلَة
 *     arabdict  اِسْمٌ           Reverso  اِسْم
 *
 * Also nur das Schluss-Tanwīn: arabdict zitiert mit, Reverso ohne. Das ist
 * kein Widerspruch, sondern eine andere Zitierkonvention — und wer neunmal
 * „VERSCHIEDEN" liest, sieht beim zehnten Mal nicht mehr hin.
 * [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⛔ ZWEI Fälle fallen NICHT darunter und bleiben gemeldet:
 *
 *   أَيْضاً gegen أَيْضًا — das Tanwīn steht an verschiedener STELLE, vor oder
 *   hinter dem Alif. Ein echter Rechtschreibunterschied.
 *
 *   كُرْسِيّ gegen كُرْسِي — die Schadda. Sie ist keine Endung, sondern
 *   verdoppelt den Buchstaben: „kursiyy" gegen „kursī", zwei Aussprachen.
 *   Genau daran hängt bei سَيِّدٌ Elias' Bestand.
 *   [[skelettvergleich_wirft_information_weg]]
 */
function ohneSchlussvokal(s) {
  const t = String(s || '').normalize('NFC');
  let letzter = -1;
  for (let i = 0; i < t.length; i++) if (/[ء-ي]/.test(t[i])) letzter = i;
  if (letzter < 0) return t;
  /* Fällt weg: Tanwīn (064B–064D), Fatḥa/Ḍamma/Kasra (064E–0650),
     Sukūn (0652), hochgestelltes Alif (0670). BLEIBT: Schadda (0651).
     ⛔ Als Escapes geschrieben — eine arabische Zeichenklasse ist im
     Quelltext nicht nachlesbar, und die Schadda liegt mitten im Bereich.
     [[zeichenklasse_nie_sichtbar_kopieren]] */
  const rest = t.slice(letzter + 1).replace(/[\u064B-\u0650\u0652\u0670]/g, '');
  return t.slice(0, letzter + 1) + rest;
}

/* ⭐⭐ DIE SUCHFORM IST NICHT DIE LEXIKONFORM — und daran ist der erste Lauf
   am 07.09.2026 gescheitert: von 19 Wörtern meldeten 11 „keine Quelle kennt
   es". Kein Wörterbuchmangel, sondern meiner. Gefragt wurde mit allem dran:

     الِامْتِحَانِ  statt امتحان   (bestimmter Artikel + Kasusendung)
     اسْمُهَا       statt اسم      (angehängtes Possessivsuffix)
     الانشِقَاق     statt انشقاق   (Artikel)

   Ein Wörterbuch führt الامتحان nicht — es führt امتحان. Die Rückfallformen
   unten sind deshalb keine Bequemlichkeit, sondern die eigentliche Abfrage.
   ⚠️ Sie werden NACHEINANDER probiert und die erste, die trifft, gewinnt;
   die verwendete Form steht im Bericht, damit nachvollziehbar bleibt, wonach
   wirklich gesucht wurde. [[stichworttreffer_ist_kein_inhaltstreffer]] */
const SUFFIXE = ['هَا', 'ها', 'هُمْ', 'هم', 'كُمْ', 'كم', 'هُ', 'ه', 'كِ', 'كَ', 'ك', 'ي'];

function suchformen(wort) {
  const roh = nackt(wort);
  const formen = [roh];
  /* ⛔⛔ DIE ARTIKELPRÜFUNG MUSS AM ORIGINAL GESCHEHEN, NICHT AN DER NACKTFORM.
     `nackt()` gleicht أ إ آ ٱ an ا an — danach sieht أَلْبَان (der Plural von
     لَبَن, „Milch") aus wie „ال + بان". Der erste Lauf am 07.09.2026 hat
     genau das getan und fand بَانٌ, ein ganz anderes Wort. Ausgerechnet der
     Fehler, vor dem Elias gewarnt hat: „nicht den plural oder eine
     alternative form oder sowas."

     Der bestimmte Artikel wird mit blankem ا geschrieben. Ein Wort, das im
     ORIGINAL mit أ oder إ beginnt, hat keinen. */
  const beginntMitArtikel = /^(?:ا|ٱ)ل/.test(String(wort).normalize('NFC').replace(/[ً-ْٰـ]/g, ''));
  if (beginntMitArtikel && roh.length > 3) formen.push(roh.slice(2));
  /* Angehängtes Suffix. ⛔ Nur wenn danach noch mindestens drei Zeichen
     stehen — sonst wird aus اسم durch Abschneiden von ي ein Torso. */
  for (const s of formen.slice()) {
    for (const suf of SUFFIXE) {
      if (s.endsWith(suf) && s.length - suf.length >= 3) {
        const kurz = s.slice(0, s.length - suf.length);
        if (!formen.includes(kurz)) formen.push(kurz);
        break;
      }
    }
  }
  return formen;
}

/* ------------------------------------------------------------------
   ⭐⭐ STUFE 1: DER EIGENE BESTAND — er kommt VOR jedem Wörterbuch.

   Elias' Rangfolge lautet:
     1. arabicroots · 2. seine Bücher · 3. sonstige Belege
     4. arabdict    · 5. Langenscheidt nur im größten Notfall

   Die erste Fassung dieses Werkzeugs sprang direkt zu Stufe 4 — und
   übersprang damit genau die Quellen, die Elias oben nennt. `pruefe-taschkil.js`
   sagt es sogar selbst: „die Form im vorhandenen Bestand nachschlagen:
   vocab-data.js und lehrbuch-saetze.js kennen die meisten dieser Woerter voll
   vokalisiert."

   Und das stimmt. Am 07.09.2026 gemessen, an denselben 19 Wörtern:

     مَرْبُوطة    steht anderswo als  مَرْبُوطَة
     الِامْتِثَالُ                     الْاِمْتِثَالُ
     الإِسْمُ                          الْاِسْمُ
     لِمَن                             لِمَنْ

   Das ist besser als jede Wörterbuchform: es ist Elias' EIGENE Schreibung,
   schon im Bestand, schon konsistent mit dem Rest.

   ⛔ EIN ZIRKELSCHLUSS LAUERT HIER. Der Bestand enthält auch die bemängelte
   Form selbst — sie steht ja darin. Eine Suche, die einfach „gefunden" meldet,
   bestätigt den Mangel mit sich selbst. Deshalb zählen nur Formen, die
   MEHR Ḥarakāt tragen als die bemängelte. [[pruefung_fragt_einen_stellvertreter_ab]]
   ------------------------------------------------------------------ */
const BESTANDSDATEIEN = [
  'vocab-data.js', 'lehrbuch-saetze.js', 'grammar-data.js', 'surah-data.js',
  'data/beispielsaetze.js', 'data/fachbegriffe.js', 'data/vokabeln-eigene.js',
];

function bestandLesen() {
  const wurzel = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const karte = new Map();                     /* nackte Form -> Set(Schreibungen) */
  for (const d of BESTANDSDATEIEN) {
    const p = path.join(wurzel, d);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const m of text.matchAll(/[ء-ي][ء-يً-ْٰـ]{1,30}/g)) {
      const w = m[0];
      if (!HARAKA.test(w)) continue;
      const k = nackt(w);
      if (!k) continue;
      if (!karte.has(k)) karte.set(k, new Set());
      karte.get(k).add(w);
    }
  }
  return karte;
}

const BESTAND = bestandLesen();

/* Gibt nur die Schreibungen zurück, die VOLLSTÄNDIGER sind als die
   bemängelte — sonst wäre es der Zirkelschluss von oben. */
function ausEigenemBestand(wort) {
  const k = nackt(wort);
  const alle = BESTAND.get(k);
  if (!alle) return [];
  const eigen = zaehleHaraka(wort);
  return [...alle].filter(f => f !== wort && zaehleHaraka(f) > eigen);
}

async function belege(wort) {
  const roh = nackt(wort);
  const varianten = suchformen(wort);
  const ergebnis = { wort, nackt: roh, gefragtNach: null, varianten,
    eigenerBestand: ausEigenemBestand(wort), arabdict: [], reverso: null, fehler: [] };

  for (const form of varianten) {
    try {
      const a = await ausArabdict(form);
      const treffer = (a.formen || [])
        .filter(f => f.genauDasWort && f.taschkil && !f.wortgruppe)
        .map(f => ({ form: f.form, angabe: f.angabe }));
      if (treffer.length) { ergebnis.arabdict = treffer; ergebnis.gefragtNach = form; break; }
    } catch (e) { ergebnis.fehler.push('arabdict (' + form + '): ' + e.message); break; }
  }

  if (mitReverso) {
    try {
      /* Reverso zuerst mit der Form fragen, die bei arabdict getroffen hat —
         sonst mit der Grundform. Reverso nennt Abweichungen selbst über
         `grundformen`, deshalb genügt hier ein Anlauf je Wort (er kostet
         einen Browserstart). */
      const r = await ausReverso(ergebnis.gefragtNach || varianten[varianten.length - 1], 'arabisch-deutsch');
      const z = r.zumSuchwort;
      if (z) ergebnis.reverso = {
        formen: z.vokalisiert.map(v => ({ form: v.form, angabe: v.wortart })),
        grundformKandidaten: z.grundformKandidaten,
        kannGebeugtSein: z.kannGebeugtSein,
        bedeutung: (z.uebersetzungen || []).slice(0, 3)
          .map(u => (u.artikel ? u.artikel + ' ' : '') + u.deutsch).join(', '),
      };
    } catch (e) { ergebnis.fehler.push('reverso: ' + e.message); }
  }
  return ergebnis;
}

/* ------------------------------------------------------------------ */

const funde = einzeln
  ? [{ wort: einzeln, feld: '(einzeln)', id: '—', abschnitt: 'Direktabfrage', stellen: [] }]
  : eindeutig(befundeHolen());

console.log('Taschkīl-Belege — ' + funde.length + ' verschiedene Wörter');
console.log('Quellen: arabdict' + (mitReverso ? ' + Reverso' : ' (Reverso weggelassen: --schnell)'));
console.log('⛔ Vorschläge, keine Einträge. Elias entscheidet.\n');

const bericht = [];
for (const f of funde) {
  const b = await belege(f.wort);
  b.feld = f.feld; b.id = f.id; b.abschnitt = f.abschnitt; b.stellen = f.stellen || [];
  bericht.push(b);

  const ad = b.arabdict.map(x => x.form + (x.angabe ? ' (' + x.angabe + ')' : ''));
  const rv = b.reverso ? b.reverso.formen.map(x => x.form + (x.angabe ? ' (' + x.angabe + ')' : '')) : [];

  /* ⭐ Der Vergleich ist die eigentliche Auskunft, nicht die einzelne Form. */
  let urteil;
  /* ⭐ Der eigene Bestand schlaegt jedes Woerterbuch — er ist Stufe 1 bis 3
     von Elias Rangfolge und obendrein schon konsistent mit dem Rest. Drei
     der 19 Woerter (تاء, مربوطة, لمن) kennt UEBERHAUPT kein Woerterbuch,
     der Bestand aber schon. */
  if (b.eigenerBestand.length) urteil = '⭐ aus DEINEM Bestand belegt: ' + b.eigenerBestand[0]
    + (ad.length || rv.length ? '  (Woerterbuecher stimmen zu: ' + (ad[0] || rv[0]) + ')' : '');
  else if (!ad.length && !rv.length) urteil = '— keine Quelle kennt es';
  else if (!mitReverso) urteil = ad.length === 1 ? 'eine Form' : ad.length + ' Formen';
  else if (!ad.length || !rv.length) urteil = 'nur EINE Quelle kennt es';
  else {
    const gleich = b.arabdict.some(x => b.reverso.formen.some(y => x.form === y.form));
    /* Gleiche Buchstaben UND gleiche inneren Ḥarakāt, nur die Schlussendung
       weicht ab — das ist die Zitierkonvention, kein Widerspruch. */
    const nurEndung = b.arabdict.some(x => b.reverso.formen.some(
      y => ohneSchlussvokal(x.form) === ohneSchlussvokal(y.form)));
    const nacktGleich = b.arabdict.some(x => b.reverso.formen.some(y => nackt(x.form) === nackt(y.form)));
    urteil = gleich ? '✅ beide Quellen gleich'
      : nurEndung ? '✅ gleich bis auf die Schlussendung (arabdict zitiert mit Tanwīn)'
      : nacktGleich ? '⚠️ Quellen schreiben WIRKLICH verschieden — ansehen'
      : '⛔ Quellen meinen Verschiedenes';
  }

  console.log(b.wort.padEnd(18) + ' [' + b.abschnitt + ']'
    + (b.gefragtNach && b.gefragtNach !== b.nackt ? '   (gefragt nach ' + b.gefragtNach + ')' : ''));
  if (b.eigenerBestand.length)
    console.log('   ⭐ DEIN BESTAND: ' + b.eigenerBestand.join(' · ') + '   (vollstaendiger als die bemaengelte Form)');
  console.log('   arabdict: ' + (ad.join(' · ') || '(nichts)'));
  if (mitReverso) {
    console.log('   Reverso:  ' + (rv.join(' · ') || '(nichts)')
      + (b.reverso && b.reverso.grundformKandidaten.length ? '   Grundform-Kandidaten (KEINE Wurzeln): ' + b.reverso.grundformKandidaten.join('/') : '')
      + (b.reverso && b.reverso.kannGebeugtSein ? '   ⚠️ kann gebeugte Form sein' : ''));
    if (b.reverso && b.reverso.bedeutung) console.log('   Bedeutung: ' + b.reverso.bedeutung);
  }
  console.log('   → ' + urteil);
  for (const e of b.fehler) console.log('   ⛔ ' + e);
  console.log('');
}

const ZIEL = 'artefakte/taschkil-belege.json';
try {
  fs.mkdirSync('artefakte', { recursive: true });
  fs.writeFileSync(ZIEL + '.neu', JSON.stringify({
    stand: new Date().toISOString(),
    quellen: mitReverso ? ['arabdict', 'reverso'] : ['arabdict'],
    hinweis: 'Vorschläge aus Wörterbüchern. E.1 gilt: nicht selbst vokalisieren, '
           + 'Elias entscheidet. Wo die Quellen verschieden schreiben, ist das '
           + 'KEIN Fehler einer von beiden — sie zitieren verschieden.',
    belege: bericht,
  }, null, 2), 'utf8');
  fs.renameSync(ZIEL + '.neu', ZIEL);
  console.log('Gesichert: ' + ZIEL + '   (⛔ artefakte/ ist gesperrt, kommt nicht ins Repo)');
} catch (e) { console.log('⛔ Konnte nicht sichern: ' + e.message); }
