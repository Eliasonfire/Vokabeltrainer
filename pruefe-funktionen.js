#!/usr/bin/env node
/* ===================== Funktionsanzeige der Infokarte nachmessen ===========

   Elias am 20.08.2026: „ich würde auch gerne bei den infokarten, dass ihre
   funktion auch gezeigt wird — also wie zb bei عِنْدَ (bei) soll angezeigt
   werden, dass es Orts- und Zeitangabe ist, aber auch dass es eine
   Genitivpräposition ist. So sollen alle infokarten ihre jeweilige funktion
   auch bekommen."

   Und: „anstatt bei solchen wörtern einfach nur ‚Wort' zu schreiben, schreibe
   lieber Nomen oder so hin."

   ⛔ WOZU DIESES SKRIPT EXISTIERT

   Punkt A8 des vollen Programms (VOLLES-PROGRAMM.md) verlangt die
   Funktionsanzeige — und bis zum 20.08.2026 pruefte sie NIEMAND. Die Liste
   nannte `pruefe-saetze.js` als Messer; ein Gegenpruefer hat nachgesehen:
   `funktionenVon` kommt in keinem einzigen Pruefskript vor, nur in js/irab.js
   und js/kategorien.js. Und `werkzeuge/pruefe-volles-programm.mjs` meldete
   dafuer gruen, weil es nur prueft, OB die genannte Datei existiert.

   Ein Punkt, den kein Werkzeug misst, wird nie gemeldet und deshalb nie
   ergaenzt. [[werkzeug_ohne_aufrufer]]

   WAS ES MISST

   Fuer jedes Wort im Fenster: was steht auf seiner Infokarte?
     - eine echte Funktion (Nomen, Genitivpraeposition, Zeitangabe, ...)
     - oder nur „Wort" — das ist keine Auskunft, sondern das Eingestaendnis,
       dass keine da ist

   ⚠️ ES GIBT NUR EINEN WEG, DAS EHRLICH ZU MESSEN: dieselbe Funktion aufrufen,
   die die App aufruft. Eine Nachbildung liefe mit der Zeit auseinander und
   maesse dann etwas anderes als auf dem Bildschirm steht — genau die Sorte
   Werkzeug, die gruen meldet, waehrend die Karte etwas anderes zeigt.

   Aufruf:   node pruefe-funktionen.js
             node pruefe-funktionen.js --alle       jedes Wort einzeln
             node pruefe-funktionen.js --alles      ohne Fensterfilter
   Rueckgabe: 0 = jedes Wort im Fenster hat eine Funktion, keine Karte eine falsche Zeile
              2 = mindestens eines zeigt nur „Wort" — oder (seit 13.10.2026) eine Karte
                  IRGENDEINES geladenen Buchs zeigt die Zeile eines anderen Wortes
                  (das zweite Urteil, siehe urteilFalscheZeile weiter unten)
              1 = der Pruefer selbst misst nicht (Stoertest, fehlende Datei)

   ⭐ Seit dem 13.10.2026 gehoert die Gruppe „Koran häufigste" zum Gemessenen
      (alle 255 Karten) — vorher sah der Fensterfilter keine einzige von ihnen.
   =========================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ALLE = process.argv.includes('--alle');
const OHNE_FENSTER = process.argv.includes('--alles');

console.log('--- Funktionsanzeige (A8) ---\n');

/* ---------- Die App-Logik in einer Sandbox laden ----------
   js/irab.js braucht Vorarbeit: Wortlisten, das Lexikon, einige Helfer aus
   js/kern.js. Statt sie nachzubauen, wird geladen, was die Datei selbst
   braucht — und wenn etwas fehlt, sagt das Skript es und misst NICHT. */
const ctx = { window: {}, console, document: undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);

function laden(rel, pflicht = true){
  const p = path.join(DIR, rel);
  if (!fs.existsSync(p)){
    if (pflicht){ console.log('  FEHLER ' + rel + ' fehlt.'); process.exit(1); }
    return false;
  }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: rel }); return true; }
  catch (e){
    if (pflicht){ console.log('  FEHLER ' + rel + ': ' + e.message); process.exit(1); }
    return false;
  }
}
const hol = n => vm.runInContext('typeof ' + n + ' !== "undefined" ? ' + n + ' : null', ctx);

laden('vocab-data.js');
laden('data/buecher.js');
laden('data/fachbegriffe.js', false);
laden('data/vokabeln-eigene.js', false);
laden('data/feld-ausnahmen.js', false);
for (const b of (hol('BUECHER') || [])) laden(b.datei, false);

/* ⛔ js/irab.js allein laeuft nicht: es ruft beim Laden nichts auf, braucht
   aber `escapeHtml` und ein paar Helfer aus js/kern.js. Die ganze kern.js zu
   laden scheitert am fehlenden DOM. Deshalb genau die Stuecke nachreichen, die
   funktionenVon() anfasst — und wenn eines fehlt, bricht es hier sichtbar ab
   statt still etwas Falsches zu messen. */
/* ⚠️ `stillerFehler` gehoert dazu, seit funktionenVon() seinen Listenabgleich
   meldet (09.09.2026). In der App kommt es aus js/kern.js, das zuerst laedt.
   Ohne den Ersatz hier wuerde ausgerechnet der Fehlerfall eine ReferenceError
   werfen — der Melder waere dann schlimmer als das Schweigen.
   ⭐ Er ZAEHLT mit, damit die Messung unten nicht auf einer stillen Panne
   steht: eine Stelle, an der die Listen nicht antworten, faellt auf.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] */
vm.runInContext(`
  function escapeHtml(s){ return String(s == null ? '' : s); }
  var SETTINGS = { buecher: null };
  function aktivesBuch(){ return 'madina-1'; }
  var STILLE_FEHLER_HIER = [];
  function stillerFehler(wo, e){ STILLE_FEHLER_HIER.push(wo + ': ' + (e && e.message || e)); }
`, ctx);
laden('js/irab.js');

const funktionenVon = hol('funktionenVon');
if (typeof funktionenVon !== 'function'){
  console.log('  FEHLER funktionenVon() ist nach dem Laden von js/irab.js nicht verfuegbar.');
  console.log('         Wurde sie umbenannt? Dieses Skript misst dann nichts und meldet');
  console.log('         das lieber, als gruen zu sein.');
  process.exit(1);
}

/* Das Lexikon fuellen — ohne es kennt funktionenVon() keine Wortarten. */
const setzeLexikon = hol('setzeLexikon');
const VOCAB = hol('VOCAB_DATA') || [];

/* ---------- Das Fenster bilden (wie werkzeuge/vorrat.mjs) ---------- */
const kern = fs.readFileSync(path.join(DIR, 'js', 'kern.js'), 'utf8');
const mF = kern.match(/const FREIGESCHALTET\s*=\s*(\{[\s\S]*?\n\});/);
const frei = mF ? vm.runInNewContext('(' + mF[1].replace(/\/\/[^\n]*/g, '') + ')') : {};
let angabe = {};
try { angabe = (JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'lernstand.json'), 'utf8')).angabe) || {}; }
catch (e){ console.log('  ⚠️ data/lernstand.json nicht lesbar — ohne Fenster gemessen.'); }
const VORAUS = 3;

/* ⛔ Doppelt in zwei Büchern und auf seinen Wunsch ausgeblendet (16.09.2026): die
   App hängt diese Einträge nicht ein (js/buecher.js, BUCHDUBLETTEN_AUSBLENDEN) —
   dieselbe Zeile wie in werkzeuge/vorrat.mjs, sonst zählen die Werkzeuge
   verschiedene Bestände (pruefe-eigene-vorrang.mjs). */
const BUCHDUBLETTEN_AUS = (() => {
  const q = fs.readFileSync(path.join(DIR, 'js', 'buecher.js'), 'utf8');
  const m = q.match(/const BUCHDUBLETTEN_AUSBLENDEN = new Set\(\[([\s\S]*?)\]\);/);
  if (!m) { console.log('  ⚠️ BUCHDUBLETTEN_AUSBLENDEN in js/buecher.js nicht gefunden.'); return new Set(); }
  return new Set((m[1].replace(/\/\*[\s\S]*?\*\//g, '').match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)));
})();

const woerter = [];
if (OHNE_FENSTER){
  VOCAB.forEach(w => woerter.push({ ...w, quelle: 'vocab-data' }));
} else {
  for (const b of (hol('BUECHER') || [])){
    const slug = b.slug;
    if (!angabe[slug]) continue;
    const grenze = angabe[slug] + VORAUS;
    const kapitel = (frei[slug] || []).map(Number).filter(k => k <= grenze);
    const liste = (ctx.window.VOKABELN && ctx.window.VOKABELN[slug]) || [];
    liste.filter(w => kapitel.includes(Number(w.chapter)) && !BUCHDUBLETTEN_AUS.has(String(w.id)))
         .forEach(w => woerter.push({ ...w, quelle: slug }));
  }
}
/* ⛔⛔ DIE FASSUNG, DIE DIE APP SIEHT — nicht die aus dem Rohabzug.

   Elias' eigene Vokabeln stehen in ZWEI Dateien, und am 20.08.2026 wichen
   ALLE ELF voneinander ab:

     data/vokabeln-eigene.js  roher arabicroots-Abzug: type:'other', kein Satz
     vocab-data.js            gepflegt: type:'grammar'/'vocab', mit Satz

   Die App nimmt die gepflegte Fassung — js/buecher.js:538 ueberspringt jedes
   eigene Wort, dessen id schon in VOCAB_DATA steht:

     const da = new Set(VOCAB_DATA.map(w => String(w.id)));
     const neu = window.EIGENE_VOKABELN.filter(w => !da.has(String(w.id)) && …);

   Bei allen elf trifft das zu. Der Rohabzug erreicht die App also NIE.
   Wer ihn trotzdem misst, meldet Maengel, die es nicht gibt: sechs der acht
   „nur Wort"-Befunde tragen in der App ein sauberes type:'grammar', und die
   Fragenseite stellte sechs Fragen, deren Antwort laengst im Bestand stand —
   Fragen, die Elias nicht einmal richtig beantworten KONNTE, weil das
   Formular nur Nomen/Verb/Partikel/Adjektiv anbietet und `grammar` fehlt.

   ⚠️ Dieselbe Regel steht in werkzeuge/vorrat.mjs, pruefe-funktionen.js und
   pruefe-taschkil.js. Wer eine aendert, aendert alle drei —
   werkzeuge/pruefe-eigene-vorrang.mjs meldet es, wenn eine fehlt.
   [[pruefwerkzeug_laedt_mehr_als_die_app]] [[dieselbe_frage_zwei_antworten]] */
const _gepflegt = new Map(((hol('VOCAB_DATA')) || []).map(w => [String(w.id), w]));
const _EIGENE_GEPFLEGT = (ctx.window.EIGENE_VOKABELN || [])
  .map(w => _gepflegt.get(String(w.id)) || w);
_EIGENE_GEPFLEGT.forEach(w => woerter.push({ ...w, quelle: 'eigene' }));
(hol('FACHBEGRIFF_VOKABELN') || []).forEach(w => woerter.push({ ...w, quelle: 'fachbegriff' }));

/* ⛔ Der vierte Weg: seine SELBST ANGELEGTEN Woerter aus vt_personalVocab.
   Sie stehen nur im localStorage; `vorrat.mjs --stand … --app auto` holt sie
   nach data/eigene-woerter.json. Ohne diese Zeilen mass dieses Skript 189
   Woerter, waehrend vorrat.mjs 203 zaehlte — dieselbe Frage, zwei Antworten.

   ⚠️ Fehlt die Datei, wird das GESAGT. Ein stillschweigend kleinerer Bestand
   sieht aus wie ein gruener Lauf. [[ausfall_ist_unsichtbar_gebaut]] */
let selbstAnzahl = 0;
try {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'eigene-woerter.json'), 'utf8'));
  (Array.isArray(d.woerter) ? d.woerter : []).forEach(w => {
    woerter.push({ ...w, quelle: 'selbst' }); selbstAnzahl++;
  });
} catch (e) {
  console.log('  ⚠️ data/eigene-woerter.json fehlt — seine selbst angelegten Woerter');
  console.log('     sind NICHT gemessen (node werkzeuge/vorrat.mjs --stand <datei> --app auto).');
}

/* ⛔⛔ DER FUENFTE WEG: was nur ueber vocab-data.js im Bestand ist.

   Am 20.08.2026 meldete werkzeuge/pruefe-eigene-vorrang.mjs den Unterschied
   selbst: vorrat.mjs 214, dieses Skript 203. Die elf sind

     9x  50296-50304  die Zahlwoerter. Im Abzug stehen sie unter Kapitel 24,
                      madina-1 ist bis 12 frei — sie fallen aus dem Fenster.
                      In vocab-data.js tragen sie `chapter: "personal"`, und
                      js/kern.js:149 macht sie damit in der App IMMER bekannt.
     2x  madina1-l6-ach / -ucht  stehen in KEINER Abzugsdatei, tragen aber
                      `chapter: 6` und liegen damit mitten im Fenster.

   ⛔ Nur im Fenster-Modus. Mit --ohne-fenster sind ohnehin alle VOCAB drin,
   und der Filter wuerde jedes Wort ein zweites Mal einhaengen.
   [[werkzeug_misst_kleineren_bestand]] [[dieselbe_frage_zwei_antworten]] */
if (!OHNE_FENSTER){
  const _da = new Set(woerter.map(w => String(w.id)));
  VOCAB.filter(w => !_da.has(String(w.id)))
       .forEach(w => woerter.push({ ...w, quelle: 'vocab-data' }));
}

/* ⛔ DER SECHSTE WEG (13.10.2026): die Gruppe „Koran häufigste".

   Ihre 255 Karten liegen in koran-haeufig-data.js (im Repo), nicht in data/. Sie
   stehen nicht in BUECHER und haben keine `angabe` in data/lernstand.json — der
   Fensterfilter oben sah deshalb KEINE EINZIGE von ihnen (gemessen: 334 Woerter im
   Fenster, 262 mit --alles, keine kh-Karte). „Jede Infokarte im Fenster nennt eine
   Funktion" galt also nur fuer seine Buecher.

   Gemessen werden ALLE Karten der Gruppe, kein Fenster: er hakt die Gruppe selbst
   an, und ohne Stueckauswahl sind dann alle da. (Entscheidung von Claude.)

   ⚠️ Dieselbe Funktion wie die App — koranKarten() aus js/buecher.js, im Wortlaut
      herausgeschnitten. Fehlt sie oder die Datendatei, wird das GESAGT und nicht
      gemessen: eine Gruppe, die still fehlt, saehe aus wie ein gruener Lauf.
      [[ausfall_ist_unsichtbar_gebaut]] */
/* ⛔ EIGENE LISTE, nicht in `woerter` (13.10.2026, beim ersten Sammellauf gemerkt):
   die Zeile „gemessen: N Woerter" liest werkzeuge/pruefe-eigene-vorrang.mjs und
   haelt sie gegen werkzeuge/vorrat.mjs — beide muessen DASSELBE Fenster zaehlen.
   Mit den 255 Koran-Karten darin standen 589 gegen 334, und der Waechter wurde
   zu Recht rot. Die Gruppe wird deshalb daneben gemessen und eigens genannt.
   [[dieselbe_frage_zwei_antworten]] */
const koranWoerter = [];
let koranAnzahl = 0;
{
  const q = fs.readFileSync(path.join(DIR, 'js', 'buecher.js'), 'utf8');
  const m = q.match(/function koranKarten\(\)\{[\s\S]*?\n\}\n/);
  if (!m || !laden('koran-haeufig-data.js', false)){
    console.log('  FEHLER Die Gruppe „Koran häufigste" ist nicht messbar: '
      + (m ? 'koran-haeufig-data.js fehlt oder laeuft nicht.' : 'koranKarten() steht nicht mehr in js/buecher.js.'));
    process.exit(1);
  }
  vm.runInContext("const KORAN_BUCH = 'koran-haeufig';\n"
    + "function koranListe(){ return (typeof KORAN_HAEUFIG !== 'undefined' && Array.isArray(KORAN_HAEUFIG)) ? KORAN_HAEUFIG : []; }\n"
    + m[0], ctx);
  (vm.runInContext('koranKarten()', ctx) || []).forEach(w => { koranWoerter.push({ ...w, quelle: 'koran' }); koranAnzahl++; });
  if (koranAnzahl < 200){
    console.log('  FEHLER Die Gruppe „Koran häufigste" hat nur ' + koranAnzahl + ' Karten geliefert (erwartet ueber 200).');
    process.exit(1);
  }
}

/* ---------- ALLE geladenen Karten, ohne Fenster (13.10.2026) ----------
   Fuer das zweite Urteil unten („falsche Zeile"). Eine falsche Zeile ist falsch,
   gleich in welchem Kapitel die Karte liegt — und die 22 Faelle, an denen die Regel
   gefunden wurde, lagen ALLE ausserhalb seines Fensters (Madina 2 und 3, Bayna
   Yadayk 2 bis 4). Ein Urteil nur ueber das Fenster haette keinen gesehen. */
const alleKarten = [];
{
  const da = new Set();
  const nimm = (w, quelle) => { const s = quelle + '|' + String(w.id); if (da.has(s) || !w || !w.ar) return; da.add(s); alleKarten.push({ ...w, quelle }); };
  for (const [slug, liste] of Object.entries((ctx.window && ctx.window.VOKABELN) || {})) (liste || []).forEach(w => nimm(w, slug));
  woerter.forEach(w => nimm(w, w.quelle));
  koranWoerter.forEach(w => nimm(w, w.quelle));
}

if (setzeLexikon) { try { setzeLexikon(woerter); } catch (e){ /* optional */ } }

if (!woerter.length){
  console.log('  ⚠️ Keine Woerter im Fenster — nichts zu messen.');
  console.log('     (Die Buchabzuege liegen wegen der arabicroots-AGB nicht im Repo.');
  console.log('      Auf einem fremden Rechner ist das der Normalfall, kein Fehler.)');
  process.exit(0);
}

/* ---------- Das Urteil, an EINER Stelle ----------
   „Wort" ist der Rueckfallwert in js/irab.js: WORTART.vocab === 'Wort'. Er
   heisst genau das, was Elias bemaengelt hat — keine Auskunft.

   ⭐ Der Stoertest unten fragt DIESE Funktion, nicht eine zweite mit derselben
   Bedingung. Ein nachgebautes Urteil wuerde mit der Zeit auseinanderlaufen und
   dann etwas anderes bezeugen als der Lauf darunter misst.
   [[testvorlage_selbst_nachgebaut]] */
function funktionen(w){
  try { return funktionenVon(w) || []; } catch (e){ return []; }
}
function nurWortKarte(w){
  const f = funktionen(w);
  return !f.length || (f.length === 1 && String(f[0]).trim() === 'Wort');
}

/* ---------- Das ZWEITE Urteil (13.10.2026): eine FALSCHE Zeile ----------

   „Nur Wort" ist eine fehlende Auskunft. Schlimmer ist eine falsche: die Listen in
   js/irab.js fuehren nur Buchstaben ohne Vokalzeichen, und 22 Karten zeigten deshalb
   die Zeile eines ANDEREN Wortes — „verstehen" hiess „Personalpronomen" (fa + hum),
   „akzeptieren" eine „Zeit- oder Ortsangabe" (qabla), „Ärmel" ein „Fragewort" (kam),
   „Leute" hatte „die Endung ändert sich nie" (a + hal). Dieser Pruefer sah keine
   davon: jede nannte ja „eine Funktion".

   Gemessen wird am ERGEBNIS, nicht an der Regel:
     - eine Verbkarte zeigt genau „Verb";
     - eine Nomen- oder Adjektivkarte mit Tanwin un / in zeigt keine Zeile aus den
       Listen (ein Wort mit diesem Zeichen ist beugbar und keines der Listenwoerter).
   Die Regeln selbst und ihre Stoertests: test-funktionsanzeige.mjs.
   Die Zeichen stehen als Zeichencode da, nicht als sichtbare Zeichenklasse. */
const TANWIN_UN = String.fromCharCode(0x64C), TANWIN_IN = String.fromCharCode(0x64D);
const LISTENZEILE = ['die Endung ändert sich nie', 'Personalpronomen', 'Fragewort', 'Hinweiswort',
                     'Genitivpräposition', 'Zeit- oder Ortsangabe', 'Das Wort danach steht im Genitiv', 'Rufpartikel'];
function urteilFalscheZeile(w, f){
  if (w.type === 'verb') return !(f.length === 1 && String(f[0]).trim() === 'Verb');
  const ar = String(w.ar || '');
  if ((w.type === 'noun' || w.type === 'adjective') && (ar.includes(TANWIN_UN) || ar.includes(TANWIN_IN)))
    return f.some(z => LISTENZEILE.some(l => String(z).includes(l)));
  return false;
}
const falscheZeile = w => urteilFalscheZeile(w, funktionen(w));

/* ---------- ⛔ STOERTEST (09.09.2026) ----------

   ⛔ Dieser Pruefer zaehlt EINE Sorte Mangel: Karten, die nur „Wort" sagen.
   Heute sind das 0 von 230 — und genau darin liegt die Gefahr. Eine Fassung,
   die gar nicht mehr misst, meldet dieselbe Null. Der Kopf dieser Datei faengt
   nur den groben Fall ab („Wurde sie umbenannt?").

   ⭐⭐ Der haeufigere Fall waere UNSICHTBAR: die Listen in js/irab.js sind da,
   die Sonderrollen aber nicht mehr. Faellt ZURUF aus, verliert عِنْدَ seine
   Zeile „Zeit- oder Ortsangabe" und bekommt vom Rueckfall in Punkt 6 ein
   sauberes „Partikel" — kein „Wort", also kein Befund. Ausgerechnet das Wort,
   an dem Elias die Funktionsanzeige am 20.08.2026 bestellt hat, waere still
   auf die Auskunft zurueckgefallen, die ihm nicht genuegte.
   [[stoertest_muss_wirkung_nachweisen]] [[gruener_pruefer_beweist_nur_geprueftes]]

   Sechs Faelle, deren Antwort feststeht — mit derselben Funktion gemessen,
   die die App aufruft. */
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const zeile = w => funktionen(w).join(' | ');

  /* 1. Der rote Weg. Ohne ihn koennte der Zaehler festgeschraubt sein:
     ein Wort ohne Wortart und ohne Listeneintrag MUSS auffallen. */
  sProbe('ein Wort ganz ohne Auskunft faellt auf',
    nurWortKarte({ ar: 'زززز', type: 'vocab' }), true);

  /* 2. Elias' eigenes Beispiel vom 20.08.2026. Beide Zeilen muessen stehen —
     die Benennung UND die Wirkung auf das naechste Wort. */
  sProbe('عِنْدَ nennt seine Rolle als Zeit-/Ortsangabe',
    /ظَرْف/.test(zeile({ ar: 'عِنْدَ', type: 'particle' })), true);
  sProbe('عِنْدَ nennt die Wirkung (Genitiv danach)',
    /Genitiv/.test(zeile({ ar: 'عِنْدَ', type: 'particle' })), true);

  /* 3. Die Genitivpraeposition — und die Verwechslung, die js/irab.js:546
     ausdruecklich abwehrt: مَنْ (wer) ist KEINE. Ohne Harakat sehen beide
     gleich aus, und auf einer Lernkarte waere das eine falsche Lehre. */
  sProbe('مِنْ ist eine Genitivpraeposition',
    /حَرْف جَرّ/.test(zeile({ ar: 'مِنْ', type: 'particle' })), true);
  sProbe('مَنْ (wer) ist KEINE Genitivpraeposition',
    /حَرْف جَرّ/.test(zeile({ ar: 'مَنْ', type: 'particle' })), false);

  /* 4. Der Fall aus seinem Bildschirmfoto: type:'vocab' heisst intern „Wort",
     und genau dafuer wurde erschlosseneWortart() gebaut. لَحْمٌ traegt Tanwin,
     also ist es ein اِسْم — das darf nicht wieder zu „Wort" werden. */
  sProbe('لَحْمٌ (type vocab) sagt „Nomen", nicht „Wort"',
    zeile({ ar: 'لَحْمٌ', type: 'vocab' }), 'Nomen');

  /* 5. (13.10.2026) Das zweite Urteil. Erst der rote Weg an einer gestellten
     Ausgabe — ohne ihn koennte auch dieser Zaehler festgeschraubt sein —, dann
     zwei Karten, deren Buchstaben mit einem Listenwort zusammenfallen. Die
     Probewoerter stehen als Codepunkte da (fahima „verstehen" = fa + hum;
     kumm „Ärmel" = kam; aw „oder"), nichts ist getippt. */
  const cp = (...n) => String.fromCodePoint(...n).normalize('NFC');
  sProbe('eine Verbkarte mit zweiter Zeile gilt als falsch',
    urteilFalscheZeile({ ar: 'x', type: 'verb' }, ['x — Personalpronomen', 'Verb']), true);
  sProbe('eine Nomenkarte mit Tanwin und Listenzeile gilt als falsch',
    urteilFalscheZeile({ ar: 'x' + TANWIN_UN, type: 'noun' }, ['x — Fragewort', 'Nomen']), true);
  sProbe('eine Nomenkarte mit Tanwin, die nur „Nomen" zeigt, gilt als richtig',
    urteilFalscheZeile({ ar: 'x' + TANWIN_UN, type: 'noun' }, ['Nomen']), false);
  sProbe('fahima („verstehen") zeigt nur „Verb"',
    zeile({ ar: cp(0x641, 0x64E, 0x647, 0x650, 0x645, 0x64E), type: 'verb' }), 'Verb');
  sProbe('kumm („Ärmel") zeigt nur „Nomen"',
    zeile({ ar: cp(0x643, 0x64F, 0x645, 0x651, 0x64C), type: 'noun' }), 'Nomen');
  sProbe('aw („oder") behaelt „die Endung ändert sich nie"',
    /die Endung ändert sich nie/.test(zeile({ ar: cp(0x623, 0x64E, 0x648, 0x652), type: 'particle' })), true);
  sProbe('die Gruppe „Koran häufigste" ist dabei (>= 200 Karten)', koranAnzahl >= 200, true);

  /* ⚠️ Und die Probe auf die Probe: bei einem fast leeren Bestand waeren
     „0 nur Wort" ebenfalls null Befunde. Am 09.09.2026 waren es 230. */
  sProbe('es steht ueberhaupt ein Bestand da (>= 50)', woerter.length >= 50, true);

  /* ⚠️ Und ob waehrend der Proben oben etwas still danebengegangen ist. Ein
     Listenabgleich, der wirft, liefert `false` — die Karte verlöre ihre
     Sonderrolle, und die Zaehlung unten saehe trotzdem sauber aus. */
  const still = hol('STILLE_FEHLER_HIER') || [];
  sProbe('kein stiller Listenfehler waehrend der Proben', still.length, 0);
  if (still.length) still.slice(0, 3).forEach(z => console.log('       ' + z));
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht,');
  console.log('   und seine „0 nur Wort" sind damit wertlos.');
  process.exit(1);
}
console.log('');

/* ---------- Messen ---------- */
const ohne = [];
let gemessen = 0;
for (const w of woerter.concat(koranWoerter)){
  gemessen++;
  if (nurWortKarte(w)) ohne.push(w);
}

console.log('  gemessen:        ' + (gemessen - koranAnzahl) + ' Woerter'
  + (OHNE_FENSTER ? ' (ohne Fensterfilter)' : ' im Fenster'));
console.log('  dazu:            ' + koranAnzahl + ' Karten „Koran häufigste" (alle, kein Fenster)');
console.log('  mit Funktion:    ' + (gemessen - ohne.length));
console.log('  nur „Wort":      ' + ohne.length
  + (ohne.length ? '   ⛔ diese Infokarten sagen nichts ueber das Wort' : ''));

/* Das zweite Urteil — ueber ALLE geladenen Karten, nicht nur das Fenster. */
const falsch = alleKarten.filter(falscheZeile);
const ohneAussen = alleKarten.filter(nurWortKarte).length - ohne.length;
console.log('  falsche Zeile:   ' + falsch.length + ' von ' + alleKarten.length + ' Karten aller geladenen Buecher'
  + (falsch.length ? '   ⛔ Verbkarte mit zweiter Zeile, oder Nomen mit Tanwin und Listenzeile' : ''));
if (ohneAussen > 0)
  console.log('  (nur gemeldet: ' + ohneAussen + ' Karten AUSSERHALB des Fensters zeigen nichts oder nur „Wort")');
if (falsch.length){
  console.log('');
  (ALLE ? falsch : falsch.slice(0, 8)).forEach(w => console.log('    ' + String(w.quelle).padEnd(16) + String(w.id).padEnd(8)
    + String(w.ar).padEnd(14) + '[' + (w.type || 'kein type') + ']  ' + funktionen(w).join(' | ')));
  if (!ALLE && falsch.length > 8) console.log('    … ' + (falsch.length - 8) + ' weitere (mit --alle vollstaendig)');
  console.log('');
  console.log('  ⭐ Die Regeln stehen in funktionenVon() in js/irab.js (K1 bis K3),');
  console.log('     bewacht von test-funktionsanzeige.mjs.');
  if (!ohne.length) process.exit(2);
}

if (ohne.length){
  const jeQuelle = {};
  ohne.forEach(w => { jeQuelle[w.quelle] = (jeQuelle[w.quelle] || 0) + 1; });
  console.log('');
  console.log('  je Herkunft:');
  Object.entries(jeQuelle).sort((a, b) => b[1] - a[1])
    .forEach(([q, n]) => console.log('    ' + q.padEnd(14) + n));
  console.log('');
  const zeigen = ALLE ? ohne : ohne.slice(0, 8);
  zeigen.forEach(w => console.log('    ' + String(w.ar).padEnd(14)
    + String(w.de || '').slice(0, 30).padEnd(32) + '[' + (w.type || 'kein type') + ']'));
  if (!ALLE && ohne.length > zeigen.length)
    console.log('    … ' + (ohne.length - zeigen.length) + ' weitere (mit --alle vollstaendig)');
  console.log('');
  console.log('  ⭐ Der haeufigste Grund ist ein fehlendes oder unbrauchbares `type`');
  console.log('     (A1). Der zweite: das Wort gehoert in eine der Listen in');
  console.log('     js/irab.js (HURUF_JARR, ZURUF, HURUF_NIDA, INDEKLINABEL).');
  process.exit(2);
}

console.log('');
console.log('  Jede Infokarte im Fenster nennt eine Funktion.');
process.exit(0);
