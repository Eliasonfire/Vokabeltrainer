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
const voll    = s => (s || '').normalize('NFC').replace(STEUER, '')
                       .replace(TANWIN_ALIF, '').replace(ENDUNG, '').trim();

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
/* Nur was diese Quelle ueberhaupt beantworten kann. `pl` steht bei Wiktionary
   zwar oft, ist bei den 25 offenen Faellen aber fast immer ein Eigen- oder
   Stoffname — dort ist die Antwort "gibt es nicht" und gehoert als Regel nach
   data/feld-ausnahmen.js, nicht als Beleg hierher.
   [[allgemeine_regel_statt_listeneintrag]] */
const KANN = new Set(['root', 'type']);
const liste = [...woerter.values()].filter(w => w.fehlt.some(f => KANN.has(f)));

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
    const passend = e.eintraege.filter(x => x.form && voll(x.form) === meins);
    if (!passend.length){
      bericht.verworfen.push(w.ar + ' (' + w.de + ') — Wiktionary fuehrt: '
        + e.eintraege.map(x => (x.form || '?') + ' [' + x.art + ']').join(', '));
      continue;
    }

    const eintrag = {};
    if (w.fehlt.includes('root') && e.wurzeln.length)
      eintrag.root = e.wurzeln.length === 1 ? e.wurzeln[0] : e.wurzeln.join(' / ');
    if (w.fehlt.includes('type'))
      eintrag.type = [...new Set(passend.map(x => x.art))].join(' / ');
    if (!Object.keys(eintrag).length){
      bericht.verworfen.push(w.ar + ' (' + w.de + ') — Form stimmt, aber kein Feld belegbar');
      continue;
    }
    eintrag.form  = passend[0].form;
    eintrag.gloss = passend[0].gloss;
    eintrag.url   = 'https://en.wiktionary.org/wiki/' + encodeURIComponent(skelett(w.ar)) + '#Arabic';
    belege[w.id]  = eintrag;
    bericht.bestaetigt.push(w.ar + ' (' + w.de + ') -> ' + JSON.stringify(eintrag.root || eintrag.type));
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
  belege
}, null, 1);
fs.writeFileSync(ZIEL + '.neu', inhalt, 'utf8');
fs.renameSync(ZIEL + '.neu', ZIEL);
console.log('\n  Geschrieben: data/aussenbelege.json (' + Object.keys(belege).length + ' Belege)');
