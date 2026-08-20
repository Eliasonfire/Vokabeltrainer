/* aussenbelege.mjs — Wurzel und Wortart bei en.wiktionary belegen
 * ==========================================================================
 *
 * Elias am 20.08.2026, zu den 70 fehlenden Feldangaben:
 *
 *   „ich weiß die ganzen sachen nicht. entweder stehen sie bei arabic roots
 *    oder wir müssen eine andere quelle oder seite finden in der es steht.
 *    solch eine seite musst du dann suchen, testen und gucken ob man das
 *    verwenden kann und wenn sie gut ist dann all diese punkte machen"
 *
 * ⛔⛔ WAS DIESES WERKZEUG NICHT TUT: eintragen. Es schreibt kein einziges
 * Feld in vocab-data.js. Es legt Belege ab, die auf der Wartungsfragen-Seite
 * neben der Frage erscheinen — Elias entscheidet weiter. Goal E.1 verbietet
 * Erfundenes, und eine ungeprueft uebernommene Wurzel waere genau das: sie
 * stuende als Tatsache auf einer Lernkarte und meldete sich nie.
 * [[bild_ohne_fehlermeldung_falsch]]
 *
 * ==========================================================================
 * ⭐ WARUM ARABICROOTS NICHT REICHT — gemessen, nicht vermutet
 *
 * Am 21.08.2026 jede der 70 Luecken gegen den vollstaendigen Abzug gehalten
 * (data/vokabeln-*.js, 4433 Woerter):
 *
 *     Abzug hat die Antwort                 0
 *     Wort im Abzug, Feld dort auch leer   26
 *     Wort gar nicht im Abzug              44   (Elias' eigene Karten)
 *
 * Gegenprobe, damit die Null nicht bloss ein alter Abzug ist: madina-1
 * Kapitel 9 LIVE ueber den MCP abgefragt — plural und feminine_singular sind
 * dort ebenso leer wie auf der Platte. [[eingefrorenes_feld_ist_kein_zustand]]
 *
 * ==========================================================================
 * ⭐⭐ WARUM DER WIKITEXT UND NICHT DIE KATEGORIE
 *
 * Der erste Anlauf las die Kategorie "Arabic terms belonging to the root".
 * Ergebnis: 20,8 % Abdeckung — und das war nicht die Grenze der Quelle,
 * sondern die des Wegs. Die Kategorie setzt nur EINE der beiden Vorlagen.
 * Im Wikitext stehen beide:
 *
 *     {{ar-root|م د ن}}        {{ar-rootbox|ي و م}}
 *
 * Ueber den Wikitext gemessen, geeicht an 200 Woertern, deren Wurzel im
 * Abzug bereits steht — dort ist jede Abweichung nachweisbar:
 *
 *     geantwortet   160 von 200 = 80,0 %
 *     davon richtig 156 von 160 = 97,5 %
 *
 * ==========================================================================
 * ⛔⛔ DIE ZWEITE BEDINGUNG IST DER GANZE UNTERSCHIED
 *
 * Wiktionary-Seitentitel tragen KEINE Harakat. Wer nur das Skelett abfragt,
 * bekommt Homographen — belegt an Elias' eigenen Karten:
 *
 *     حَالُكْ "dein Zustand"  ->  Seite حالك fuehrt حَالِك "pitch-black"
 *     لَكَ    "fuer dich"      ->  Seite لك   fuehrt لَكّ   "varnish, lacquer"
 *
 * Beide haetten eine falsche Wurzel und eine falsche Wortart geliefert, und
 * beide sahen wie saubere Treffer aus. [[skelettvergleich_wirft_information_weg]]
 *
 * Deshalb gilt hier: ein Treffer zaehlt NUR, wenn die voll vokalisierte Form
 * aus Wiktionarys Kopfvorlage mit Elias' Schreibung uebereinstimmt. Erlaubt
 * ist genau eine Abweichung, die Zitier-Endung (سَيِّدٌ gegen سَيِّد).
 *
 * Wirkung, an denselben 25 Woertern gemessen:
 *     ohne die Bedingung   11 Treffer, mindestens 2 davon falsch
 *     mit  der Bedingung   10 Treffer, 9 verworfen, 6 unbekannt
 *
 * ⚠️ Unter den 9 Verworfenen sind auch echte Woerter, deren Kopfvorlage das
 * Werkzeug nicht lesen kann (خَرَجَ, بَعْدَ — dort steht statt der Form ein
 * Konjugationsmuster wie "I/a~u.ipass?.vn:خُرُوج"). Das ist Absicht: lieber
 * eine Luecke als ein falscher Beleg. Wer das lockert, muss vorher messen,
 * was zusaetzlich hereinkommt — so wie es bei TANWIN_ALIF geschehen ist:
 * eine Lockerung, ein zusaetzlicher Treffer, kein falscher.
 *
 * ==========================================================================
 * Aufruf:   node werkzeuge/aussenbelege.mjs            (schreibt data/aussenbelege.json)
 *           node werkzeuge/aussenbelege.mjs --probe    (zeigt nur, schreibt nicht)
 *
 * Gelesen von: werkzeuge/vorrat.mjs (setzt daraus das Feld `beleg`)
 * ⚠️ Braucht Netz. Faellt der Aufruf aus, bleibt die alte Datei stehen und
 * vorrat.mjs arbeitet unveraendert weiter — die Belege sind eine Zugabe,
 * keine Voraussetzung.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const ZIEL   = path.join(WURZEL, 'data', 'aussenbelege.json');
const PROBE  = process.argv.includes('--probe');

/* ---------- Zeichen ---------- */
/* ⛔ Als \u-Folgen, nie sichtbar kopiert: gleiches Bild, andere Codepoints.
   [[zeichenklasse_nie_sichtbar_kopieren]] */
const DIAKRITIKA = /[\u064B-\u0652\u0670\u0640\u0653-\u0655\u06D6-\u06ED]/g;
const STEUER     = /[\u200E\u200F\u0640]/g;
const ENDUNG     = /[\u064B-\u0650\u0652]+$/;   /* Tanwin / Kurzvokal / Sukun am Wortende */

const skelett = s => (s || '').normalize('NFC').replace(DIAKRITIKA, '').replace(STEUER, '').trim();
/* ⭐ Tanwin Fath und sein stummes Alif stehen in zwei Reihenfolgen:
   Elias schreibt أَيْضاً (Alif, dann Tanwin), Wiktionary أَيْضًا (Tanwin,
   dann Alif). Dasselbe Wort. Ohne diese Zeile wird es als Homograph
   verworfen — gemessen: genau EIN zusaetzlicher Treffer, kein falscher. */
const TANWIN_ALIF = /(?:\u064B\u0627|\u0627\u064B)$/;
/* ⭐ Der Artikel wird in zwei Schreibungen gefuehrt: Wiktionary setzt das
   Sukun auf das Lam (الْيَابَان), Elias' Abzug nicht (اليَابَانُ). Dasselbe Wort.
   ⛔ ENG gefasst: NUR ein Sukun auf dem Lam des Artikels am WORTANFANG. Wer
   hier alle Sukun ignoriert, hat den Skelettvergleich wieder, den die zweite
   Bedingung gerade verhindert. Gemessen: 5 zusaetzliche Treffer, kein
   falscher. [[skelettvergleich_wirft_information_weg]] */
const ARTIKEL_SUKUN = /^(\u0627\u064E?\u0644)\u0652/;
const voll    = s => (s || '').normalize('NFC').replace(STEUER, '')
                       .replace(ARTIKEL_SUKUN, '$1')
                       .replace(TANWIN_ALIF, '').replace(ENDUNG, '').trim();

/* Wiktionary nennt im Kopf oft MEHRERE Schreibvarianten desselben Worts,
   durch Komma getrennt und teils mit Transkriptionsmarke:
       سُورِيَا,سُورِيَّا        إِنْجِلْتِرَا<tr:ʔingiltirā>,إِنْجِلْتِرَا
   ⚠️ Das ist KEINE Lockerung der zweiten Bedingung: die Varianten stehen im
   selben Eintrag desselben Worts, es sind Schreibungen, keine Homographen.
   Ein Treffer zaehlt, wenn EINE davon uebereinstimmt. */
const formen = s => String(s || '').split(',')
                      .map(x => x.replace(/<[^>]*>/g, '').trim())
                      .filter(Boolean);

/* ---------- die offenen Fragen von vorrat.mjs holen ---------- */
/* ⭐ Nicht selbst nachbauen, welche Felder offen sind — die Kette verfolgen.
   vorrat.mjs kennt data/feld-ausnahmen.js und alle vier Wege in den Bestand;
   eine Handliste daneben waere ab dem naechsten Kapitel falsch.
   [[handliste_neben_echter_quelle]] */
const TMP = path.join(WURZEL, '.state', 'aussenbelege-fragen.json');
fs.mkdirSync(path.dirname(TMP), { recursive: true });

/* ⛔ Erst die alte Datei wegraeumen. Scheitert der Lauf gleich darauf, wuerde
   sonst ein Stand von gestern gelesen — und nichts daran saehe falsch aus.
   [[eingefrorenes_feld_ist_kein_zustand]] */
if (fs.existsSync(TMP)) fs.unlinkSync(TMP);

/* ⚠️ vorrat.mjs endet mit Exitcode 2, sobald es unvollstaendige Woerter
   findet (Zeile 1343: `process.exit(offen.length ? 2 : 0)`). Das ist sein
   SIGNAL, kein Fehler — und es ist der Normalfall, denn genau diese Woerter
   sind ja der Anlass. Deshalb wird nicht der Exitcode geprueft, sondern ob
   die Datei entstanden ist. */
try {
  execFileSync(process.execPath,
    [path.join(WURZEL, 'werkzeuge', 'vorrat.mjs'), '--offene-fragen', TMP],
    { stdio: ['ignore', 'ignore', 'inherit'] });
} catch (e){
  if (e.status !== 2){
    console.error('  vorrat.mjs ist mit Code ' + e.status + ' gescheitert.');
    process.exit(1);
  }
}
if (!fs.existsSync(TMP)){
  console.error('  vorrat.mjs hat keine Fragendatei geschrieben — abgebrochen.');
  process.exit(1);
}
const fragen = JSON.parse(fs.readFileSync(TMP, 'utf8'));

const woerter = new Map();
for (const q of fragen.fragen) for (const w of q.woerter){
  if (!woerter.has(w.id)) woerter.set(w.id, { ...w, fehlt: [] });
  woerter.get(w.id).fehlt.push(q.feld);
}
/* Was diese Quelle beantworten kann. Bei `pl` wird NICHT der Plural
   uebernommen — sondern die Frage umgedreht: ist das Wort ueberhaupt eines,
   das einen Plural haben KANN? Siehe EIGENNAME unten. */
const KANN = new Set(['root', 'type', 'pl']);
const liste = [...woerter.values()].filter(w => w.fehlt.some(f => KANN.has(f)));

/* ---------- Dazu die Taschkil-Luecken ----------
   ⭐ Derselbe Handgriff beantwortet eine zweite Frage: `pruefe-taschkil.js`
   meldet Stellen, an denen einem Buchstaben die Haraka fehlt, und Wiktionary
   fuehrt die Woerter voll vokalisiert. Fuer أَيْضاً lag der Beleg sogar schon
   in dieser Datei — an einer Frage, die niemand gestellt hatte.

   ⛔ Auch hier wird NICHTS eingetragen. Die Haraka kommt aus der Quelle, samt
   Fundstelle; ob sie die richtige ist, entscheidet Elias. Goal E.1.

   Gemessen am 21.08.: 4 von 11 Luecken belegbar. Die uebrigen sind vier
   Surennamen (dort liefert schon die API unvollstaendig — siehe unten),
   مَرْبُوطة und مَقْصورة (keine Wiktionary-Seite) und الإِسْمُ. */
const taschkilListe = [];
try {
  let roh = '';
  try {
    roh = execFileSync(process.execPath, [path.join(WURZEL, 'pruefe-taschkil.js')],
      { cwd: WURZEL, encoding: 'utf8' });
  } catch (e){ roh = (e.stdout || '') + ''; }   /* Exitcode != 0 ist dort ein Signal */
  const zl = roh.split(/\r?\n/);
  const i0 = zl.findIndex(z => /^=== Haraka fehlt:/.test(z));
  if (i0 >= 0) for (let i = i0 + 1; i < zl.length; i++){
    if (/^===/.test(zl[i]) || !zl[i].trim()) break;
    const m = /^\s*(\S+)\s+Stelle\s+(\d+)\s+\((\S)\)\s+(\S+)\s+id\s+(.+?)\s*$/.exec(zl[i]);
    if (m) taschkilListe.push({ wort: m[1], stelle: +m[2], feld: m[4], id: m[5] });
  }
} catch { /* laeuft das Werkzeug nicht, gibt es eben keine Taschkil-Belege */ }
const taschkilWoerter = [...new Map(taschkilListe.map(t => [t.wort, t])).values()];

console.log('Offene Felder gesamt: ' + fragen.fragen.reduce((a, q) => a + q.woerter.length, 0));
console.log('Davon root/type an ' + liste.length + ' Woertern — nur die werden abgefragt.');

/* ---------- Wiktionary ---------- */
const KOPF = { 'User-Agent': 'Vokabeltrainer/1.0 (privates Lernprojekt, Kontakt ueber github.com)' };
const WORTARTEN = /^(Noun|Verb|Adjective|Particle|Pronoun|Preposition|Adverb|Numeral|Proper noun|Interjection|Conjunction)$/i;

/* ⚠️ NUR der ==Arabic==-Abschnitt. Persische, Urdu- und osmanische Eintraege
   auf derselben Seite zitieren dieselbe arabische Wurzel — wer den ganzen Text
   durchsucht, belegt mit der Wurzel eines fremden Lehnworts. */
function arabischerTeil(wt){
  const s = wt.search(/^==\s*Arabic\s*==\s*$/m);
  if (s < 0) return '';
  const rest = wt.slice(s + 1);
  const e = rest.search(/^==[^=][^\n]*==\s*$/m);
  return e < 0 ? rest : rest.slice(0, e);
}

function wurzelnAus(teil){
  const r = [];
  for (const m of teil.matchAll(/\{\{ar-root(?:box)?\s*\|([^}]+)\}\}/g)){
    const t = m[1].split('|').map(s => s.trim()).filter(s => s && !s.includes('='));
    if (t.length) r.push(t.length === 1 ? t[0] : t.join(' '));
  }
  return [...new Set(r)];
}

/* Ein Eintrag = eine ===Ueberschrift=== samt ihrem Text. So bleiben Form,
   Wortart und Bedeutung BEIEINANDER, statt quer ueber die Seite eingesammelt
   zu werden — sonst zeigt der Beleg woandershin als der Treffer.
   [[treffer_und_fundstelle_trennen]] */
function eintraege(teil){
  const stuecke = teil.split(/^(?====+\s*[A-Za-z][A-Za-z ]*\s*===+\s*$)/m);
  const raus = [];
  for (const s of stuecke){
    const k = /^===+\s*([A-Za-z][A-Za-z ]*?)\s*===+\s*$/m.exec(s);
    if (!k || !WORTARTEN.test(k[1])) continue;
    const f = /\{\{ar-(?:noun|adj|verb|part|prep|adv|pron|num|proper noun)[^}|]*\|([^}|]+)/.exec(s);
    /* ⚠️ Nur die Klammern wegzunehmen reicht nicht: aus
       „{{cln|ar|cardinal numbers}} zero" wird dann der sichtbare Unsinn
       „cln|ar|cardinal numbers zero". Vorlagen muessen GANZ weg, Links auf
       ihren Anzeigetext eingedampft. */
    const gl = [...s.matchAll(/^#\s*(?!\*)(.{0,120})/gm)]
                 .map(m => m[1]
                    /* Unterpunkte stehen als "## …" — das zweite Rautezeichen
                       faengt die Zeilenregel nicht ab und landete sichtbar
                       im Text ("# mistress, princess"). */
                    .replace(/^#+\s*/, '')
                    .replace(/\{\{[^}]*\}\}/g, ' ')          /* ganze Vorlagen */
                    .replace(/\{\{[^}]*$/,     ' ')          /* abgeschnittene */
                    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
                    .replace(/\[\[([^\]]*)\]\]/g, '$1')
                    .replace(/''+/g, '')
                    .replace(/\s{2,}/g, ' ').trim())
                 /* ⚠️ Bei سَيِّدَة steckt die ganze Bedeutung IN der Vorlage
                    ({{female equivalent of|ar|سَيِّد||master, sir}}); nach dem
                    Entfernen bleibt ein nacktes ":". Lieber gar keine Glosse
                    als eine, die nichts sagt. */
                 .filter(g => g && g.replace(/[^\p{L}]/gu, '').length >= 2);
    raus.push({ art: k[1], form: f ? f[1].trim() : '', gloss: gl[0] || '' });
  }
  return raus;
}

async function hole(titel){
  const url = 'https://en.wiktionary.org/w/api.php?action=query&prop=revisions'
            + '&rvprop=content&rvslots=main&format=json&formatversion=2&titles='
            + titel.map(encodeURIComponent).join('%7C');
  const r = await fetch(url, { headers: KOPF });
  if (!r.ok) throw new Error('Wiktionary antwortet HTTP ' + r.status);
  const d = await r.json();
  const raus = new Map();
  for (const s of (d.query && d.query.pages) || []){
    if (s.missing){ raus.set(s.title, null); continue; }
    const wt = (((s.revisions || [])[0] || {}).slots || {}).main
             ? s.revisions[0].slots.main.content : '';
    const teil = arabischerTeil(wt);
    raus.set(s.title, teil ? { wurzeln: wurzelnAus(teil), eintraege: eintraege(teil) } : null);
  }
  /* Wiktionary normalisiert Titel — ueber die Rueckgabe zuordnen, nie ueber
     die Reihenfolge der Anfrage. */
  for (const n of (d.query && d.query.normalized) || []) raus.set(n.from, raus.get(n.to));
  return raus;
}

/* ---------- Lauf ---------- */
const belege = {};
const bericht = { bestaetigt: [], verworfen: [], unbekannt: [] };

for (let i = 0; i < liste.length; i += 40){
  const block = liste.slice(i, i + 40);
  let erg;
  try {
    erg = await hole([...new Set(block.map(w => skelett(w.ar)).filter(Boolean))]);
  } catch (e){
    /* ⛔ NICHT mit Fehlercode enden. Dieses Werkzeug laeuft in der Wartung,
       und die Belege sind eine Zugabe — steht so auch oben im Kopf. Wer hier
       exit(1) meldet, reisst wegen eines Netzhaengers die ganze Routine mit
       und loest den Reparaturlauf aus. Die alte Datei bleibt stehen und wirkt
       weiter; gemeldet wird trotzdem, sonst waere der Ausfall unsichtbar.
       [[ausfall_ist_unsichtbar_gebaut]] */
    console.error('  ⚠️ Wiktionary nicht erreichbar: ' + e.message);
    console.error('  Die bestehende data/aussenbelege.json bleibt unveraendert —'
                + ' die Belege sind eine Zugabe, keine Voraussetzung.');
    process.exit(0);
  }
  for (const w of block){
    const e = erg.get(skelett(w.ar));
    if (!e || !e.eintraege.length){ bericht.unbekannt.push(w.ar + ' (' + w.de + ')'); continue; }

    /* ⛔ DIE ZWEITE BEDINGUNG. Ohne sie belegt حالك das Wort "pechschwarz". */
    const meins = voll(w.ar);
    const passend = e.eintraege.filter(x => formen(x.form).some(f => voll(f) === meins));
    if (!passend.length){
      bericht.verworfen.push(w.ar + ' (' + w.de + ') — Wiktionary fuehrt: '
        + e.eintraege.map(x => (x.form || '?') + ' [' + x.art + ']').join(', '));
      continue;
    }

    const eintrag = {};

    /* ⭐⭐ EIGENNAME — die Antwort auf "hat das einen Plural?" ist bei
       أَلْمَانِيَا, اليَابَانُ, القَاهِرَةُ nicht eine Form, sondern ein Nein.
       Wiktionary fuehrt "Proper noun" als eigene Wortart; das laesst sich
       MESSEN, waehrend "das klingt nach einem Land" nur eine Vermutung waere.

       ⛔ Die Bedingung ist AUSSCHLIESSLICH Proper noun, nicht "auch". Der
       Unterschied ist der ganze Wert der Regel — gemessen an Woertern, deren
       Plural im Abzug steht, also wo jeder Fehlalarm nachweisbar ist:

         "auch Proper noun"          6 Fehlalarme von 111
         "ausschliesslich Proper noun"  0 Fehlalarme von 111

       Die Fehltreffer trugen alle eine zweite Wortart: مَسْقَط ist die Stadt
       Maskat UND "Geburtsort" (Plural مَسَاقِط), حُجَّة ein Name UND "Beweis".

       ⚠️ Diese Verschaerfung stammt aus denselben Daten, an denen sie
       auffiel — deshalb an einer ZWEITEN, ueberschneidungsfreien Stichprobe
       nachgeeicht: 0 Fehlalarme von 119. Zusammen 0 von 230.
       [[pruefwerkzeug_mit_eingebauter_antwort]]

       Deckung bei den offenen Faellen: 13 von 25. Die uebrigen sind
       Stoffnamen und Abstrakta (مَاءٌ, شَايٌ, قَهْوَةٌ, عَرَبِيَّةٌ) — dort
       greift die Regel zu Recht nicht, denn ob مَاءٌ einen Plural hat, ist
       eine Frage an die Sprache und gehoert Elias. */
    if (w.fehlt.includes('pl')){
      const arten = [...new Set(e.eintraege.map(x => x.art))];
      if (arten.length === 1 && /^proper noun$/i.test(arten[0]))
        eintrag.pl = '__eigenname__';
    }

    if (w.fehlt.includes('root') && e.wurzeln.length)
      eintrag.root = e.wurzeln.length === 1 ? e.wurzeln[0] : e.wurzeln.join(' / ');
    if (w.fehlt.includes('type'))
      eintrag.type = [...new Set(passend.map(x => x.art))].join(' / ');
    if (!Object.keys(eintrag).length){
      bericht.verworfen.push(w.ar + ' (' + w.de + ') — Form stimmt, aber kein Feld belegbar');
      continue;
    }
    /* Die Variante zeigen, die WIRKLICH passt — nicht das ganze Rohfeld. */
    eintrag.form  = formen(passend[0].form).find(f => voll(f) === meins) || passend[0].form;
    eintrag.gloss = passend[0].gloss;
    eintrag.url   = 'https://en.wiktionary.org/wiki/' + encodeURIComponent(skelett(w.ar)) + '#Arabic';
    belege[w.id]  = eintrag;
    bericht.bestaetigt.push(w.ar + ' (' + w.de + ') -> '
      + [eintrag.pl === '__eigenname__' ? 'Eigenname, kein Plural' : null,
         eintrag.root ? 'Wurzel ' + eintrag.root : null,
         eintrag.type ? 'Wortart ' + eintrag.type : null].filter(Boolean).join(' · '));
  }
}

console.log('');
console.log('  bestaetigt: ' + bericht.bestaetigt.length
          + '   verworfen: ' + bericht.verworfen.length
          + '   Wiktionary kennt es nicht: ' + bericht.unbekannt.length
          + '   (Nenner ' + liste.length + ')');
console.log('');
for (const s of bericht.bestaetigt) console.log('  ✔ ' + s);
console.log('');
console.log('  Verworfen — das waeren die falschen Belege gewesen:');
for (const s of bericht.verworfen) console.log('    ✘ ' + s);

/* ---------- Taschkil: die Haraka an der gemeldeten Stelle belegen ---------- */
/* ⛔ `stelle` ist der Index im VOLLEN String — so zaehlt pruefe-taschkil.js
   (`function luecke(wort, i){ const c = wort[i]; … }`). Wer sie fuer einen
   Buchstabenindex haelt, vergleicht die falsche Stelle: der erste Anlauf fand
   so 1 statt 4 Belegen. Uebersetzbar sind beide ueber den KONSONANTEN-Index,
   der bleibt gleich, egal wie das Wort vokalisiert ist.
   [[zitat_ueber_die_stelle]] */
const IST_HARAKA = /[ً-ْٰ]/;
const konsonantIndex = (wort, stelle) => {
  let n = -1;
  for (let i = 0; i <= stelle && i < wort.length; i++) if (!IST_HARAKA.test(wort[i])) n++;
  return n;
};
function harakaAnStelle(kandidat, wort, stelle){
  if (skelett(wort) !== skelett(kandidat)) return null;
  const ziel = konsonantIndex(wort, stelle);
  if (ziel < 0) return null;
  let n = -1;
  for (let i = 0; i < kandidat.length; i++){
    if (IST_HARAKA.test(kandidat[i])) continue;
    n++;
    if (n === ziel){
      const m = /^[ً-ْٰ]+/.exec(kandidat.slice(i + 1));
      return m ? m[0] : null;
    }
  }
  return null;
}

const taschkilBelege = {};
if (taschkilWoerter.length){
  let erg2 = new Map();
  try { erg2 = await hole([...new Set(taschkilWoerter.map(t => skelett(t.wort)).filter(Boolean))]); }
  catch (e){ console.error('  ⚠️ Taschkil-Abfrage fehlgeschlagen: ' + e.message); }

  for (const t of taschkilListe){
    const kand = [];
    /* Erst die Form, die oben schon bestaetigt wurde — sie hat die
       Formpruefung bereits bestanden. */
    if (belege[t.id] && belege[t.id].form) kand.push(belege[t.id].form);
    for (const x of (erg2.get(skelett(t.wort)) || { eintraege: [] }).eintraege || [])
      for (const f of formen(x.form)) kand.push(f);

    for (const k of kand){
      const h = harakaAnStelle(k, t.wort, t.stelle);
      if (h){
        taschkilBelege[t.id + '|' + t.feld + '|' + t.stelle] = {
          wort: t.wort, stelle: t.stelle, haraka: h, form: k,
          url: 'https://en.wiktionary.org/wiki/' + encodeURIComponent(skelett(t.wort)) + '#Arabic'
        };
        break;
      }
    }
  }
  console.log('');
  console.log('  Taschkil-Luecken: ' + Object.keys(taschkilBelege).length
            + ' von ' + taschkilListe.length + ' belegt.');
  for (const b of Object.values(taschkilBelege))
    console.log('    ✔ ' + b.wort + '  Stelle ' + b.stelle + '  ->  ' + b.form);
}

if (PROBE){ console.log('\n  --probe: nichts geschrieben.'); process.exit(0); }

/* ⛔ Nie direkt auf die Zieldatei schreiben. Bricht der Lauf mitten im
   Schreiben ab, stuende dort eine leere Datei — und eine leere Datei besteht
   jede Pruefung. [[leere_datei_besteht_jeden_test]] */
const inhalt = JSON.stringify({
  erzeugt: new Date().toISOString(),
  quelle: 'en.wiktionary.org',
  hinweis: 'BELEGE, keine Eintraege. Nur Treffer, deren voll vokalisierte Form mit der Karte uebereinstimmt.',
  geprueft: liste.length,
  bestaetigt: bericht.bestaetigt.length,
  belege,
  /* Schluessel: "<id>|<feld>|<stelle>" — genau die drei Angaben, mit denen
     pruefe-taschkil.js einen Befund eindeutig macht (Zeile 646 dort). */
  taschkil: taschkilBelege
}, null, 1);
fs.writeFileSync(ZIEL + '.neu', inhalt, 'utf8');
fs.renameSync(ZIEL + '.neu', ZIEL);
console.log('\n  Geschrieben: data/aussenbelege.json ('
  + Object.keys(belege).length + ' Feldbelege, '
  + Object.keys(taschkilBelege).length + ' Taschkil-Belege)');
