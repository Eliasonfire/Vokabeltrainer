/* ============================================================================
   Ein Fachbegriff, der schon im Buch steht, darf nur EINMAL dastehen.
   ============================================================================

   Elias am 22.09.2026 mit dem Bild seiner Suche, auf der مُضَافٌ zweimal stand
   — einmal als „Eigene Vokabel", einmal als „Kap. 24":

     „es gibt zwei mudaf, ich möchte eigentlich nur eins haben. lass das in
      kapitel 24, mache es aber exakt so wie das meine eigene. also gleiche
      kiste, gleiche beschreibung und nennung und alles."
     „nimm die höhere box, sollte kapitel 24 höhere box haben"

   Gelöst über das Feld `buchTausch` am Fachbegriff. js/kern.js hängt einen
   Fachbegriff mit diesem Feld NICHT ein, sondern schreibt seine Beschreibung
   auf die Buchvokabel, schaltet sie einzeln frei und zieht den Fortschritt nach.

   ---------------------------------------------------------------------------
   WAS HIER BEWACHT WIRD — und warum jedes Stück davon still ausfallen kann
   ---------------------------------------------------------------------------
     1. `buchTausch` zeigt auf eine Vokabel, die es gibt. Zeigt es ins Leere,
        wird der Fachbegriff NICHT eingehängt und die Buchkarte nicht gefunden:
        das Wort wäre dann GAR NICHT mehr da. Von „steht doppelt" zu „fehlt
        ganz" ist es genau eine falsche Kennung weit.
     2. Die App liest das Feld überhaupt. Bis zum 22.09.2026 kannte es nur
        werkzeuge/fachbegriffe-setzen.mjs — als Warnung. Keine Zeile in js/ hat
        es je gelesen. [[werkzeug_ohne_aufrufer]]
     3. Der Fortschritt wird nachgezogen, und zwar NACH `PROGRESS`. Ein Aufruf
        beim Einhängen stünde in der zeitlichen Totzone und ließe die App beim
        Start abstürzen — ein `typeof`-Test schützt dort nicht, weil die
        Funktion gehoistet ist und nur ihre Daten fehlen.
     4. Kein Wort steht noch doppelt: gleiche Schreibung in fachbegriffe.js und
        vocab-data.js ohne ein `buchTausch` dazwischen ist genau der Fall, den
        Elias gemeldet hat.

   ⚠️ Und der Grund, warum Punkt 1 wirklich passieren kann: data/fachbegriffe.js
   wird von werkzeuge/fachbegriffe-setzen.mjs ERZEUGT. Wer sie neu schreibt,
   ohne `buchTausch` im Auftrag mitzugeben, verliert das Feld — lautlos.
   [[einstellung_wirkt_nicht_weil_zurueckgelesen]]

   Aufruf:  node werkzeuge/pruefe-buchtausch.mjs
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const befunde = [];

function ladeListe(datei, name){
  const s = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  const ctx = { window:{}, document:{}, __raus:{} };
  vm.createContext(ctx);
  vm.runInContext(s + `\n;try{__raus.x=${name}}catch(e){try{__raus.x=window.${name}}catch(e2){}}`,
                  ctx, { filename: datei });
  return ctx.__raus.x || ctx.window[name] || null;
}

const F = ladeListe('data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN');
const V = ladeListe('vocab-data.js', 'VOCAB_DATA');
if (!Array.isArray(F) || !Array.isArray(V)){
  console.log('✖ Fachbegriffe oder Vokabeln nicht lesbar — nichts zu prüfen.');
  process.exit(1);
}

/* ---------- 1. Jede Zuordnung zeigt auf eine echte Karte ---------- */

/* ⚠️ Gesucht wird in VOCAB_DATA UND in den Buchabzügen: Kapitel 24 gehört zu
   madina-1 und steht dort, nicht im Lernbestand. Ein Prüfer, der nur
   vocab-data.js kennt, meldete jede Zuordnung als tot. */
const buchIds = new Set(V.map(w => String(w.id)));
const buchWort = new Map(V.map(w => [String(w.id), w]));
for (const f of fs.readdirSync(path.join(WURZEL, 'data')).filter(x => x.startsWith('vokabeln-'))){
  const roh = fs.readFileSync(path.join(WURZEL, 'data', f), 'utf8');
  for (const m of roh.matchAll(/"id":\s*"(\d+)"[\s\S]{0,80}?"ar":\s*"([^"]+)"[\s\S]{0,60}?"de":\s*"([^"]*)"/g)){
    if (!buchIds.has(m[1])){ buchIds.add(m[1]); buchWort.set(m[1], { id:m[1], ar:m[2], de:m[3], quelle:'data/'+f }); }
  }
}

const mitTausch = F.filter(w => w && w.buchTausch);
for (const f of mitTausch){
  const id = String(f.buchTausch);
  if (!buchIds.has(id))
    befunde.push(`${f.id}: buchTausch „${id}" zeigt auf keine Vokabel — der Fachbegriff wird nicht eingehängt UND die Buchkarte nicht gefunden. Das Wort wäre dann gar nicht mehr da.`);
}

/* ---------- 2. Liest die App das Feld? ---------- */

const kern = fs.readFileSync(path.join(WURZEL, 'js/kern.js'), 'utf8');
if (!/\bbuchTausch\b/.test(kern))
  befunde.push('js/kern.js liest `buchTausch` nicht — das Feld steht in den Daten und wirkt nicht. Genau dieser Zustand galt bis zum 22.09.2026.');
/* ⛔ Auf BEIDE Hälften prüfen, nicht auf den Namen. Der erste Störtest ersetzte
   nur den `.push(`-Aufruf — die Liste wurde nie gefüllt, der Nachzug lief über
   eine leere Liste, und dieser Prüfer blieb grün. Ein Name im Quelltext ist
   keine Wirkung. [[funktion_als_referenz_sieht_tot_aus]] */
if (!/function\s+fachbegriffeMitBuchkarte\s*\(/.test(kern))
  befunde.push('js/kern.js: fachbegriffeMitBuchkarte() fehlt — das Feld `buchTausch` steht in den Daten und wirkt nicht.');
if (!/uebertrageFortschritt\(String\(f\.id\),\s*String\(ziel\.id\),\s*true\)/.test(kern))
  befunde.push('js/kern.js: fachbegriffeMitBuchkarte() überträgt den Fortschritt nicht — die höhere Box ginge beim Zusammenführen verloren, und das war Elias’ ausdrückliche Auflage („nimm die höhere box").');
if (!/VOCAB_DATA\.splice\(i,\s*1\)/.test(kern))
  befunde.push('js/kern.js: die doppelte Karte wird nicht aus VOCAB_DATA entfernt — sie stünde weiter zweimal da, genau wie vorher.');

/* ⛔ Und der Aufruf muss in js/buecher.js stehen, NACH dem Einhängen der
   Bücher. In js/kern.js allein wirkt er nicht: die Buchvokabel ist dort noch
   nicht geladen. Genau das hat der Ladetest am 22.09.2026 widerlegt, nachdem
   der erste Entwurf dort stand. */
/* ⛔ KOMMENTARFREI SUCHEN. Der erste Störtest (Aufruf entfernt) blieb grün,
   weil der erklärende Kommentar direkt darüber denselben Namen nennt — der
   Prüfer fand ihn dort und hielt den Aufruf für vorhanden. Ein Name in einer
   Begründung ist kein Aufruf. [[funktion_als_referenz_sieht_tot_aus]] */
const buecherRoh = fs.readFileSync(path.join(WURZEL, 'js/buecher.js'), 'utf8');
const buecher = buecherRoh
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
if (!/fachbegriffeMitBuchkarte\s*\(\s*\)/.test(buecher))
  befunde.push('js/buecher.js ruft fachbegriffeMitBuchkarte() nicht auf — in js/kern.js allein greift die Zuordnung nicht, weil die Buchvokabel dort noch nicht geladen ist.');
else {
  const iTausch = buecher.indexOf('tauscheDubletten()');
  const iNeu    = buecher.indexOf('fachbegriffeMitBuchkarte()');
  if (iTausch >= 0 && iNeu >= 0 && iNeu < iTausch)
    befunde.push('js/buecher.js: fachbegriffeMitBuchkarte() läuft VOR tauscheDubletten() — der Tausch gibt einer Kapitelkarte womöglich gerade erst den Fortschritt, der hier über die höhere Box entscheidet.');
}

/* ⛔ Und die Reihenfolge: das Nachziehen MUSS hinter `let PROGRESS` stehen.
   Davor ist PROGRESS in der zeitlichen Totzone und die App stürzt beim Start
   ab — ein Fehler, der in keinem Node-Test auffällt, weil er erst im Browser
   passiert. */
/* ⛔ Die Funktion DARF vor `let PROGRESS` stehen — Funktionsdeklarationen sind
   gehoistet, und ausgeführt wird sie erst aus js/buecher.js heraus, lange nach
   dem Start. Gefährlich wäre nur ein AUFRUF auf Modulebene in js/kern.js:
   dann liefe sie beim Laden, und PROGRESS wäre in der zeitlichen Totzone.
   Genau so stand es in meinem ersten Entwurf.

   ⚠️ Und diese Prüfung selbst war schon einmal falsch: sie verglich
   `lastIndexOf(...) < indexOf('let PROGRESS')`. Findet lastIndexOf nichts,
   liefert es **-1**, und -1 ist kleiner als jede Position — der Prüfer meldete
   einen Absturz, den es nicht gab. Ein „nicht gefunden" ist kein „steht davor".
   [[leere_liste_ist_keine_messung]] */
{
  const iDef = kern.indexOf('function fachbegriffeMitBuchkarte(');
  /* Ein Aufruf auf Modulebene erkennt man daran, dass er NICHT eingerückt in
     einer anderen Funktion steht. Gesucht wird deshalb am Zeilenanfang. */
  const aufrufOben = /^\s{0,2}fachbegriffeMitBuchkarte\s*\(\s*\)/m.test(kern);
  if (iDef < 0)
    befunde.push('js/kern.js: fachbegriffeMitBuchkarte() ist nicht definiert.');
  else if (aufrufOben)
    befunde.push('js/kern.js ruft fachbegriffeMitBuchkarte() auf Modulebene auf — dann läuft sie beim Laden, PROGRESS ist in der zeitlichen Totzone und die App stürzt beim Start ab. Der Aufruf gehört nach js/buecher.js.');
}

/* ---------- 3. Steht noch etwas doppelt? ---------- */

/* ⛔⛔ DIE LETZTE ḤARAKA BLEIBT STEHEN — sonst ist dieser Prüfer eine
   Fehlalarm-Maschine.

   Ohne sie fielen أَنْتَ „du (m.)" und أَنْتِ „du (f.)" zusammen, ebenso ـكَ
   „dein" und كَ „wie". Gemessen: mit grober Normalisierung meldete der Prüfer
   **34** Dubletten, fast alle unecht.

   ⚠️ Und das ist kein hypothetisches Problem: am 08.09.2026 um 02:16:35 hat
   genau dieser Fehler die Karte أَنْتِ ausgeblendet, weil der Doppelt-Tausch
   sie für أَنْتَ hielt. js/kern.js trägt dafür seit dem 16.09. eine einmalige
   Reparatur. Derselbe Fehler zweimal wäre unverzeihlich.
   [[kennzeichen_mit_zwei_ursachen]] */
const nackt = x => {
  const s = String(x || '').normalize('NFC').replace(/ـ/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
  /* Alles außer dem LETZTEN Vokalzeichen entfernen: die Endung ist im
     Arabischen der Kasus und wechselt je nach Satz, die Zeichen davor gehören
     zum Wort. */
  const zeichen = [...s];
  const letzte = zeichen.length ? zeichen[zeichen.length - 1] : '';
  const istHaraka = c => /[ً-ٰٓ]/.test(c);
  const rumpf = zeichen.slice(0, -1).filter(c => !istHaraka(c)).join('');
  return rumpf + (istHaraka(letzte) ? letzte : (istHaraka(zeichen[zeichen.length - 1] || '') ? '' : letzte));
};
const zugeordnet = new Set(mitTausch.map(f => String(f.id)));
const doppelt = [];
for (const f of F){
  if (zugeordnet.has(String(f.id))) continue;
  const k = nackt(f.ar);
  /* Dieselbe Schreibung UND eine Bedeutung, die sich überschneidet — sonst
     zählten أَنْتَ und أَنْتِ als Dublette, und die sind es nicht. */
  /* ⛔ Auch in den BUCHABZÜGEN suchen, nicht nur in vocab-data.js. Genau dort
     stand Elias' zweites مُضَافٌ (50473, madina-1 Kapitel 24) — ein Prüfer, der
     nur den Lernbestand kennt, hätte den gemeldeten Fall nicht gefunden.
     Belegt durch den Störtest: ohne die Zeile blieb er grün, nachdem die
     Zuordnung entfernt war. */
  const treffer = [...buchWort.values()].filter(w => w.chapter !== 'personal' && nackt(w.ar) === k);
  if (treffer.length) doppelt.push(f.id + ' ' + f.ar + ' ↔ ' + treffer.map(t => t.id).join(','));
}
/* ⛔⛔ DIESE LISTE IST KEIN DEFEKT, SONDERN EINE FRAGE AN ELIAS — deshalb steht
   sie nicht in `befunde`, sondern bekommt einen eigenen Ausgang (Exit 2).

   Gemessen am 23.09.2026: **30** Fachbegriffe tragen dieselbe Schreibung wie
   eine Buchvokabel. مُضَافٌ war nur der eine, den Elias gesehen hat. Seine
   Grundregel vom 16.09.2026 („bei meinen eigenen wörtern das was im kapitel
   ist bevorzugen") würde auf alle passen — aber dreißig Karten
   zusammenzuführen ist eine Wirkung, die er kennen muss, bevor sie eintritt.
   Was nur aus MEINER Begründung folgt, ist eine Frage an ihn, kein Bau.
   [[wirkung_an_der_quelle_stilllegen]] · [[antwort_auf_meine_frage_ist_keine_freigabe]]

   ⚠️ Und die Liste ist noch nicht sauber: zwei Fachbegriffe können auf
   DIESELBE Buchvokabel zeigen (ـكَ „dein" und كَ „wie" beide auf 49843) —
   dann ist höchstens einer von beiden die Dublette. Die Bedeutung entscheidet
   das, und die steht hier bewusst dabei, statt dass der Prüfer sie rät. */
let zumEntscheiden = doppelt;

/* ---------- 4. Der echte Ladetest ---------- */

/* ⭐⭐ ALLES BISHERIGE LIEST QUELLTEXT. Das belegt, dass die Zeilen dastehen —
   nicht, dass sie wirken. Hier wird js/kern.js wirklich ausgeführt und danach
   gemessen, was in VOCAB_DATA steht: genau die Frage, die Elias gestellt hat
   („ich möchte eigentlich nur eins haben").
   ⚠️ Schlägt das Laden fehl, ist das selbst der wichtigste Befund — dann
   startet die App beim Nutzer gar nicht. Genau so hätte sich die zeitliche
   Totzone gezeigt, die mein erster Entwurf enthielt. */
{
  const el = () => ({ style:{}, classList:{add(){},remove(){},toggle(){},contains:()=>false},
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, appendChild(){}, querySelector:()=>null, querySelectorAll:()=>[],
    closest:()=>null, getAttribute:()=>null, setAttribute(){}, focus(){},
    getBoundingClientRect:()=>({width:0,height:0,top:0,left:0}) });
  const dom = { getElementById: el, querySelector: el, querySelectorAll: () => [],
                createElement: el, addEventListener(){}, body: el(), documentElement: el() };
  const speicher = {};
  const c = {
    window:{ addEventListener(){}, matchMedia:()=>({matches:false,addEventListener(){}}),
             location:{href:''}, navigator:{userAgent:'node',language:'de'} },
    document: dom,
    localStorage:{ getItem:k=>speicher[k] ?? null, setItem:(k,v)=>{speicher[k]=String(v);},
                   removeItem:k=>{delete speicher[k];}, clear(){} },
    navigator:{ userAgent:'node', language:'de', onLine:true },
    console:{ log(){}, warn(){}, error(){}, info(){} },
    Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval,
    fetch: () => Promise.reject(new Error('kein Netz im Test')),
    __raus:{}
  };
  c.globalThis = c; c.self = c; c.window.document = dom; c.window.localStorage = c.localStorage;
  vm.createContext(c);

  let geladen = true, ladeFehler = '';
  /* ⚠️ Nur was js/kern.js wirklich braucht, und in DER Reihenfolge, in der
     index.html es lädt. js/saetze.js steht bewusst nicht dabei: es setzt
     SETTINGS voraus, das erst kern.js anlegt — im ersten Anlauf lud der Test
     es davor und meldete „die App lädt nicht mehr", obwohl die App in Ordnung
     war. Ein Prüfer, der seine eigene Ladereihenfolge erfindet, misst sie. */
  for (const datei of ['vocab-data.js', 'grammar-data.js', 'data/fachbegriffe.js',
                       'data/beispielsaetze.js', 'js/kern.js']){
    try { vm.runInContext(fs.readFileSync(path.join(WURZEL, datei), 'utf8'), c, { filename: datei }); }
    catch(e){ geladen = false; ladeFehler = datei + ': ' + e.message; break; }
  }

  /* ⛔⛔ DIE BUCHVOKABELN NACHLADEN — sonst misst dieser Test das Gegenteil.
     Kapitel 24 steht in data/vokabeln-madina-1.js, und die lädt js/buecher.js
     erst, wenn das Buch geöffnet wird. Ohne diesen Schritt fehlt die Zielkarte,
     die Zuordnung greift nicht, und der Test meldet „bleibt doppelt" — genau
     das, was er vor dieser Zeile gemeldet hat.
     ⚠️ js/buecher.js selbst wird NICHT geladen: es bringt Fetch, Bildschirme
     und halbe Startlogik mit. Hier zählt nur, dass die Zielkarte im Bestand
     ist, wenn fachbegriffeMitBuchkarte() läuft — und genau das stellt der
     Aufruf in js/buecher.js in der echten App sicher. */
  if (geladen){
    try {
      const roh = fs.readFileSync(path.join(WURZEL, 'data/vokabeln-madina-1.js'), 'utf8');
      vm.runInContext(roh + `
        ;(function(){
          /* Die Abzüge schreiben nach window.VOKABELN["<buch>"] — gemessen im
             Kopf der Datei, nicht geraten. Ein erfundener Variablenname wäre
             hier besonders heimtückisch: die Liste bliebe leer, und der Test
             meldete „bleibt doppelt" über eine Zuordnung, die in Wahrheit greift. */
          const liste = (typeof window !== 'undefined' && window.VOKABELN)
            ? window.VOKABELN['madina-1'] : null;
          if (Array.isArray(liste)){
            const da = new Set(VOCAB_DATA.map(w => String(w.id)));
            for (const w of liste) if (!da.has(String(w.id))) VOCAB_DATA.push(w);
          }
        })();`, c, { filename: 'data/vokabeln-madina-1.js' });
      vm.runInContext("typeof fachbegriffeMitBuchkarte === 'function' && fachbegriffeMitBuchkarte()", c);
    } catch(e){ befunde.push('Ladetest: die Buchvokabeln ließen sich nicht nachladen — ' + e.message); }
  }

  if (!geladen){
    befunde.push('Die App lädt nicht mehr — ' + ladeFehler
      + '. Das ist kein Prüferproblem: mit diesem Fehler startet der Vokabeltrainer beim Nutzer nicht.');
  } else {
    const V2 = vm.runInContext("typeof VOCAB_DATA !== 'undefined' ? VOCAB_DATA : null", c);
    if (!Array.isArray(V2)){
      befunde.push('Nach dem Laden ist VOCAB_DATA nicht lesbar — der Ladetest kann nichts belegen.');
    } else {
      for (const f of mitTausch){
        const nochDa = V2.some(w => String(w.id) === String(f.id));
        if (nochDa) befunde.push(`Ladetest: ${f.id} steht nach dem Start immer noch in VOCAB_DATA — das Wort bliebe doppelt, genau wie vorher.`);
        const ziel = V2.find(w => String(w.id) === String(f.buchTausch));
        if (!ziel) befunde.push(`Ladetest: die Buchvokabel ${f.buchTausch} ist nach dem Start nicht in VOCAB_DATA — dann fehlt das Wort ganz.`);
        else if (ziel.de !== f.de)
          befunde.push(`Ladetest: ${f.buchTausch} heißt „${ziel.de}" statt „${f.de}". Elias wollte „gleiche beschreibung und nennung und alles".`);
      }
      console.log('Ladetest: js/kern.js lädt, VOCAB_DATA hat ' + V2.length + ' Einträge.');
    }
  }
}

/* ---------- Ausgabe ---------- */

console.log('--- Fachbegriffe, die schon im Buch stehen ---\n');
console.log('Fachbegriffe:                ' + F.length);
console.log('mit Zuordnung (buchTausch):  ' + mitTausch.length);
for (const f of mitTausch){
  const z = buchWort.get(String(f.buchTausch));
  console.log('   ' + String(f.id).padEnd(18) + f.ar.padEnd(14) + '→ ' + String(f.buchTausch).padEnd(8)
            + (z ? z.ar + '  „' + String(z.de).slice(0, 34) + '"' : '⛔ nicht gefunden'));
  if (z) console.log('     die Karte heißt danach: „' + f.de + '"');
}

if (befunde.length){
  console.log('\n✖ ' + befunde.length + ' Befund(e):');
  befunde.forEach(z => console.log('  · ' + z));
  process.exit(1);
}

if (zumEntscheiden.length){
  console.log('\n⬜ ' + zumEntscheiden.length + ' weitere Fachbegriffe tragen dieselbe Schreibung wie eine Buchvokabel:');
  for (const z of zumEntscheiden){
    const [links, rechts] = z.split(' ↔ ');
    const fid = links.split(' ')[0];
    const f = F.find(x => String(x.id) === fid);
    const b = buchWort.get(String(rechts).split(',')[0]);
    console.log('   ' + links.padEnd(30) + '↔ ' + String(rechts).padEnd(14));
    console.log('       hier:  „' + String(f && f.de).slice(0, 58) + '"');
    console.log('       Buch:  „' + String(b && b.de).slice(0, 58) + '"');
  }
  console.log('\n   Elias hat am 22.09.2026 für مُضَافٌ entschieden: „lass das in kapitel 24,');
  console.log('   mache es aber exakt so wie das meine eigene … nimm die höhere box."');
  console.log('   ⛔ Für diese hier ist NICHTS entschieden. Wer sie zusammenführen will,');
  console.log('      trägt `buchTausch` ein — aber erst, wenn er es gesagt hat: dreißig');
  console.log('      Karten auf einmal sind eine Wirkung, die er kennen muss.');
  console.log('   ⚠️ Zwei Einträge können auf dieselbe Buchvokabel zeigen; dann ist');
  console.log('      höchstens einer die Dublette. Die Bedeutungen stehen deshalb dabei.');
  process.exit(2);
}

console.log('\n✅ Jede Zuordnung zeigt auf eine echte Karte, die App liest das Feld, der Fortschritt wird nachgezogen — und nichts steht doppelt.');
process.exit(0);
