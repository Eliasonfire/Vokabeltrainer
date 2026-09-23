/* ============================================================================
   Die Übersetzungsübung — tut sie, was Elias verlangt hat?
   ============================================================================

   Sein Auftrag vom 22.09.2026, 21:15:
     „es sollte auch im satzmodus eine übung geben, wo mir ein satz gegeben wird
      und den soll ich dann ins deutsche übersetzten. wenn ich falsch mache muss
      erkannt werden was falsch ist und warum und mir das dann zeigen"
     „und die richtige deutsche überstzung und halt warum"

   Geprüft wird an ECHTEN Sätzen aus data/beispielsaetze.js, nicht an
   ausgedachten. Ein Test mit selbst gebauten Daten misst den Nachbau.

   ---------------------------------------------------------------------------
   ZWEI SEITEN, UND BEIDE SIND PFLICHT
   ---------------------------------------------------------------------------
   ⭐ Elias' Grundsatz für diese Übung: großzügig beim Richtigzählen, streng
   beim Benennen eines Fehlers. Daraus folgen genau zwei Messungen:

     A) Die MUSTERÜBERSETZUNG selbst muss als richtig durchgehen — und ebenso
        ein paar harmlose Abweichungen (Kleinschreibung, fehlende Satzzeichen,
        „vom" statt „von dem"). Fällt das durch, bestraft die Übung Deutsch
        statt Arabisch.
     B) Eine GEZIELT VERFÄLSCHTE Übersetzung muss den passenden Befund
        auslösen — und zwar den richtigen, nicht irgendeinen. Das ist der
        Störtest: ein Prüfer, der nur „findet", findet auch dort etwas, wo
        nichts ist. [[leere_liste_ist_keine_messung]]

   ⛔ Und eine dritte, die leicht vergessen wird: die Übung darf bei einer
   unbekannten, aber sinnvollen Formulierung NICHT behaupten, sie wisse, was
   falsch ist. Dafür gibt es den `ratlos`-Zweig, und der wird hier mitgemessen.

   Aufruf:  node werkzeuge/pruefe-uebersetzen.mjs
            node werkzeuge/pruefe-uebersetzen.mjs --laut   (jeden Fall zeigen)
   Exit 0 = in Ordnung, 1 = ein Befund.
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const laut   = process.argv.includes('--laut');

/* ---------- Die App in einem Kontext laden, wie der Browser es tut ----------
   ⛔ Nicht jede Datei einzeln importieren: js/uebersetzen.js ruft Funktionen
   auf, die in js/uebung.js, js/saetze.js und js/kern.js stehen. Wer sie
   nachbaut, prüft den Nachbau. Deshalb ein gemeinsamer Kontext mit einem
   Minimal-DOM — genug, damit die Verdrahtung am Dateiende nicht stirbt. */
function stummesElement(){
  const el = {
    style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; }
  };
  return el;
}
const DOM = {
  getElementById(){ return stummesElement(); },
  querySelector(){ return stummesElement(); },
  querySelectorAll(){ return []; },
  createElement(){ return stummesElement(); },
  addEventListener(){}, body: stummesElement(), documentElement: stummesElement()
};

const ctx = {
  window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; },
           location:{ href:'' }, navigator:{ userAgent:'node', language:'de' } },
  document: DOM,
  localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; },
                 setItem(k,v){ this._d[k]=String(v); }, removeItem(k){ delete this._d[k]; } },
  navigator:{ userAgent:'node', language:'de', onLine:true },
  console, Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval,
  __raus:{}
};
ctx.globalThis = ctx;
ctx.self = ctx;
ctx.window.document = DOM;
ctx.window.localStorage = ctx.localStorage;
/* ⛔⛔ OHNE DIESE ZEILE MISST DER PRÜFER ETWAS ANDERES, ALS ER SAGT.

   js/saetze.js bricht ohne `SETTINGS` mit „SETTINGS is not defined" ab — und
   dort steht wortKern(). Ohne wortKern findet uebsBedeutung() keine einzige
   Vokabel, und die Prüfung „Wort ausgelassen" fällt still aus. Im ersten Lauf
   sah das aus wie „erkennt nur 58 %", also wie ein Befund über die Übung.
   Tatsächlich war es ein Befund über den Prüfer.
   ⚠️ Deshalb steht unten auch eine Zusicherung, dass wortKern erreichbar ist:
   eine Voraussetzung, die still wegfallen kann, gehört gemessen.
   [[leere_liste_ist_keine_messung]] · [[ausfall_ist_unsichtbar_gebaut]] */
ctx.SETTINGS = { buecher:{ 'madina-1': [] }, wrongOnly:false, eigene:true, fachbegriffe:true };
vm.createContext(ctx);

const geladen = [];
const gescheitert = [];
/* Die Reihenfolge ist die des index.html: Daten zuerst, dann die Module.
   ⚠️ Bis 23.09.2026 stand hier „die des index.html" über einer anderen
   Reihenfolge, und lehrbuch-saetze.js fehlte ganz — mit ihr fehlten 42 Sätze,
   die die Übung zeigt. Nachgemessen an index.html Z7319–7376. */
const DATEIEN = [
  'vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js',
  'grammar-data.js', 'lehrbuch-saetze.js', 'js/irab.js', 'js/saetze.js',
  'js/uebersetzen.js', 'js/uebung.js'
];
for (const f of DATEIEN){
  const p = path.join(WURZEL, f);
  if (!fs.existsSync(p)){ gescheitert.push(f + ' — Datei fehlt'); continue; }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); geladen.push(f); }
  catch(e){ gescheitert.push(f + ' — ' + e.message); }
}

/* ⛔ Holen über eine Auswertung IM Kontext: `const` landet nicht am globalen
   Objekt. Genau daran ist die erste Messung dieses Abends gescheitert, und
   ein `catch { continue; }` daneben ließ es wie „nicht vorhanden" aussehen. */
function hole(name){
  try { return vm.runInContext(`typeof ${name} !== 'undefined' ? ${name} : undefined`, ctx); }
  catch(e){ return undefined; }
}

const uebersetzungPruefen = hole('uebersetzungPruefen');
const uebersetzungRueckmeldung = hole('uebersetzungRueckmeldung');
const analysiereSatz = hole('analysiereSatz');
const setzeLexikon   = hole('setzeLexikon');
const VOCAB_DATA     = hole('VOCAB_DATA');
const BEISPIELSAETZE = hole('BEISPIELSAETZE');
const alleSaetze     = hole('alleSaetze');
const uebsBedeutung       = hole('uebsBedeutung');
const uebsBedeutungsWorte = hole('uebsBedeutungsWorte');
const uebsStamm           = hole('uebsStamm');
const uebungBezugswort    = hole('uebungBezugswort');

const befunde = [];
const melde = z => befunde.push(z);

if (!uebersetzungPruefen) melde('js/uebersetzen.js: uebersetzungPruefen() ist nicht erreichbar.');
/* Die Voraussetzung der halben Prüfung — siehe die Begründung bei SETTINGS. */
if (typeof hole('wortKern') !== 'function')
  melde('js/saetze.js: wortKern() ist nicht erreichbar. Ohne sie findet uebsBedeutung() keine Vokabel, und „Wort ausgelassen" fällt lautlos aus — die Zahlen unten wären dann falsch, nicht die Übung.');
if (!analysiereSatz)      melde('js/irab.js: analysiereSatz() ist nicht erreichbar.');
if (!BEISPIELSAETZE)      melde('data/beispielsaetze.js: BEISPIELSAETZE ist nicht erreichbar.');
if (typeof alleSaetze !== 'function')
  melde('js/saetze.js: alleSaetze() ist nicht erreichbar. Ohne sie prüft der Prüfer nicht die Sätze, die die Übung wirklich zeigt.');
if (befunde.length){
  console.log('✖ Der Prüfer kann nicht messen:');
  befunde.forEach(z => console.log('  · ' + z));
  gescheitert.forEach(z => console.log('  · nicht geladen: ' + z));
  process.exit(1);
}
if (typeof setzeLexikon === 'function' && Array.isArray(VOCAB_DATA)) setzeLexikon(VOCAB_DATA);

/* ---------- Die Sätze ---------- */

/* ⛔⛔ DIE SÄTZE, DIE DIE ÜBUNG WIRKLICH ZEIGT — nicht die, die gerade greifbar sind.

   Bis 23.09.2026 las dieser Prüfer nur data/beispielsaetze.js: 227 Sätze. Die
   Übung zeigt aber alles aus alleSaetze() (js/saetze.js) — die Beispielsätze
   der Karten aus vocab-data.js, die Lehrbuchsätze und die längeren Sätze — und
   dazu die Sätze der Buchvokabeln. Zusammen 434. Der Satz, an dem Elias'
   Kommentarfaden hing (هَذَا حَجَرٌ قَدِيمٌ وَثَقِيلٌ, Karte 45780), war nicht
   dabei. Gemessen wurde also die knappe Hälfte, und die grüne Zeile unten
   sprach für das Ganze. [[liste_zeigt_nur_eine_oberflaeche]]

   Jetzt: alleSaetze() aus der App selbst, plus die Buchvokabel-Sätze, die in
   der App erst js/buecher.js an VOCAB_DATA hängt. Doppelte Sätze zählen einmal. */
const saetze = [];
const schonText = new Set();
const schonId   = new Set();
function nimm(id, sentAr, sentDe){
  if (!sentAr || !String(sentDe || '').trim()) return;
  const text = sentAr + '|' + sentDe;
  if (schonText.has(text)) return;
  schonText.add(text);
  let eigen = String(id);
  while (schonId.has(eigen)) eigen += '′';   // gleiche Kennung, anderer Satz
  schonId.add(eigen);
  saetze.push({ id: eigen, sentAr, sentDe });
}
for (const s of alleSaetze()) nimm(s.id, s.sentAr, s.sentDe);
for (const [id, s] of Object.entries(BEISPIELSAETZE)) if (s) nimm(id, s.sentAr, s.sentDe);

const zeilenVon = new Map();
for (const s of saetze){
  try { zeilenVon.set(s.id, analysiereSatz(s.sentAr)); }
  catch(e){ zeilenVon.set(s.id, []); }
}

/* ---------- A) Die Musterübersetzung muss durchgehen ---------- */

/* ⚠️ Vier Abwandlungen, die jeder Mensch schreiben würde und die alle richtig
   sind. Wer hier durchfällt, prüft Rechtschreibung statt Grammatik. */
/* ⛔ Die ersten vier ändern nur die SCHREIBWEISE. Die letzten zwei ändern das
   DEUTSCH — und genau dort lagen am 23.09.2026 zwei Fehler, die die ersten vier
   nie finden konnten:
   · „Das ist …" statt „Dies ist …": 82 von 83 fielen als „Wort fehlt: dies"
     durch. Es ist die natürlichste Übersetzung von هَذَا.
   · „vom Händler" statt „des Händlers": 27 von 46 fielen durch, obwohl
     js/uebersetzen.js genau diese Fassung im Kopf als richtig nennt.
   Beide greifen nur, wo das Muster die Stelle hat; sonst `null` = entfällt. */
const HARMLOS = [
  ['unverändert',        de => de],
  ['klein geschrieben',  de => de.toLowerCase()],
  ['ohne Satzzeichen',   de => de.replace(/[.,!?;:]/g, '')],
  ['zusätzliche Leerzeichen', de => '  ' + de.replace(/ /g, '  ') + ' '],
  ['„Das ist" statt „Dies ist"', de => {
    const n = de.replace(/^Dies (ist|sind)\b/, 'Das $1');
    return n !== de ? n : null;
  }],
  ['„vom X" statt „des Xs"', de => {
    const n = de.replace(/\bdes ([A-ZÄÖÜ][a-zäöüß]+?)(es|s)\b/g, 'vom $1');
    return n !== de ? n : null;
  }],
  /* ⛔ 23.09.2026 nachgetragen, nach der Gegenprüfung eines Helfers: v572 zählte
     „Dies ist ein schwerer und alter Stein." für „… alter und schwerer Stein."
     als falsch (adjektivbezug) — neu 10 von 16 solcher Sätze, vorher 1. Zwei
     beigeordnete Adjektive dürfen im Deutschen die Plätze tauschen; keine der
     Fassungen oben hatte das je versucht. */
  ['zwei Adjektive vertauscht', de => {
    const n = de.replace(/\b(ein|eine|einen|einem|einer|eines|der|die|das|den|dem|des)\s+([a-zäöüß]+)\s+und\s+([a-zäöüß]+)\s+(?=[A-ZÄÖÜ])/,
      (_, art, a, b) => art + ' ' + b + ' und ' + a + ' ');
    return n !== de ? n : null;
  }]
];

let aGeprueft = 0;
const aFehler = [];
for (const s of saetze){
  for (const [wie, mach] of HARMLOS){
    const text = mach(s.sentDe);
    if (text == null) continue;
    const erg = uebersetzungPruefen(s, zeilenVon.get(s.id), text);
    aGeprueft++;
    if (!erg.richtig){
      aFehler.push({ id: s.id, wie, de: s.sentDe,
        grund: erg.befunde.map(b => b.art).join('+') || (erg.ratlos ? 'ratlos' : 'fehlend:' + erg.fehlend) });
    }
  }
}

/* ---------- B) Störtest: jede Fehlerart muss sich auslösen lassen ---------- */

/* Jede Verfälschung greift nur dort, wo ihr Beleg vorliegt — sonst wäre der
   Störtest selbst erfunden. Sie liefert den Text und die Fehlerart, die die
   Prüfung nennen MUSS. */
const STOERUNGEN = [
  {
    art: 'ausgelassen',
    /* Das letzte Inhaltswort streichen. Ein Satz, der danach identisch ist,
       taugt als Störfall nicht und wird übersprungen. */
    mach(s){
      const w = s.sentDe.replace(/[.!?]+$/, '').split(/\s+/);
      return w.length >= 4 ? w.slice(0, -1).join(' ') : null;
    }
  },
  {
    art: 'aussage',
    /* Die Kopula streichen — aus dem Satz wird eine Wortgruppe. */
    mach(s){
      const ohne = s.sentDe.replace(/\b(ist|sind)\b\s*/i, '');
      return ohne !== s.sentDe ? ohne : null;
    }
  },
  {
    art: 'bestimmtheit',
    /* „der/die/das" gegen „ein/eine" tauschen — gleich viele Wörter. */
    mach(s){
      const t = s.sentDe.replace(/\bDie\b/, 'Eine').replace(/\bdie\b/, 'eine')
                        .replace(/\bDer\b/, 'Ein').replace(/\bder\b(?!\s)/, 'ein');
      return t !== s.sentDe ? t : null;
    }
  },
  {
    art: 'besitzer',
    mach(s){
      const t = s.sentDe.replace(/\bMein\b/, 'Dein').replace(/\bmein(e|en|em|er|es)?\b/, (m)=>'dein'+(m.slice(4)||''));
      return t !== s.sentDe ? t : null;
    }
  },
  {
    art: 'genus',
    /* Das Hinweiswort vor einem Nomen in die falsche Form bringen: „Dieses
       Haus" → „Dieser Haus". ⛔ Bis 23.09.2026 fehlte dieser Fall hier — und
       die Prüfung dahinter schlug nie an: 0 von 47, „Dieses Händler ist reich"
       galt als richtig. Ein Störtest, der eine Fehlerart auslässt, bescheinigt
       ihr nichts. [[leere_liste_ist_keine_messung]] */
    mach(s){
      const TAUSCH = { Dieser:'Dieses', Dieses:'Dieser', Diese:'Dieser', dieser:'dieses', dieses:'dieser', diese:'dieser' };
      const m = s.sentDe.match(/\b(Dieser|Dieses|Diese|dieser|dieses|diese)\s+(?=[A-ZÄÖÜ])/);
      return m ? s.sentDe.replace(m[0], TAUSCH[m[1]] + ' ') : null;
    }
  },
  {
    art: 'nah-fern', erwartet: 'ausgelassen',
    /* „dieses" durch „jenes" ersetzen — nah gegen fern, هَذَا gegen ذَلِكَ.
       Das ist KEIN Genusfehler und darf nicht als solcher benannt werden; es
       fehlt aber das richtige Wort. Bewacht die Ausnahme vom 23.09.2026, die
       „Das ist" für „Dies ist" gelten lässt: sie darf „jenes" nicht mit
       durchwinken. */
    mach(s){
      const TAUSCH = { Dieser:'Jener', Dieses:'Jenes', Diese:'Jene', Dies:'Jenes',
                       dieser:'jener', dieses:'jenes', diese:'jene', dies:'jenes' };
      const m = s.sentDe.match(/\b(Dieser|Dieses|Diese|Dies|dieser|dieses|diese|dies)\b/);
      return m ? s.sentDe.replace(m[0], TAUSCH[m[1]]) : null;
    }
  },
  /* ⭐ Die letzten zwei Fehlerarten, seit 23.09.2026 — vorher prüfte der Störtest
     vier von sieben, und die fünfte (Genus) war genau deshalb unbemerkt tot.
     Beide greifen nur, wo die Analyse ihren Beleg findet und die Wörter eine
     Vokabel haben; gemessen am selben Abend: 38 von 38 und 11 von 12. */
  {
    art: 'idafa',
    /* Die beiden Wörter der إِضَافَة im Muster vertauschen: „das Buch des
       Lehrers" → „das Lehrers des Buch". Das Deutsch wird schief — gezählt
       wird nur, dass die Reihenfolge erkannt wird. */
    mach(s, zeilen){
      for (let i = 0; i < zeilen.length - 1; i++){
        const a = zeilen[i], b = zeilen[i + 1];
        if (!/\(مُضَاف\)/.test(String(a.rolle || ''))) continue;
        if (!String(b.rolle || '').startsWith('مُضَاف إِلَيْه')) continue;
        const w = s.sentDe.split(/\s+/);
        const pA = musterPos(w, a.rein || a.wort), pB = musterPos(w, b.rein || b.wort);
        if (pA < 0 || pB < 0 || pA === pB) continue;
        const xa = nackt(w[pA]), xb = nackt(w[pB]);
        w[pA] = w[pA].replace(xa, xb); w[pB] = w[pB].replace(xb, xa);
        return w.join(' ');
      }
      return null;
    }
  },
  {
    art: 'adjektivbezug',
    /* Das Adjektiv aus seiner Stelle nehmen und vor ein ANDERES Nomen des
       Satzes setzen — dann beschreibt es im Deutschen das falsche Wort. */
    mach(s, zeilen){
      if (typeof uebungBezugswort !== 'function') return null;
      for (let i = 0; i < zeilen.length; i++){
        const z = zeilen[i];
        if (!/نَعْت/.test(String(z.rolle || ''))) continue;
        const bezug = uebungBezugswort(zeilen, i, null);
        if (!bezug) continue;
        const w = s.sentDe.split(/\s+/);
        const pAdj = musterPos(w, z.rein || z.wort), pBez = musterPos(w, bezug);
        if (pAdj < 0 || pBez < 0) continue;
        let pX = -1;
        for (const x of zeilen){
          const wx = x.rein || x.wort;
          if (!wx || wx === bezug || wx === (z.rein || z.wort)) continue;
          if (/نَعْت|حَرْف|ضَمِير/.test(String(x.rolle || ''))) continue;
          const p = musterPos(w, wx);
          if (p >= 0 && p !== pAdj && p !== pBez){ pX = p; break; }
        }
        if (pX < 0) continue;
        const adj = nackt(w[pAdj]);
        const ohne = w.filter((_, j) => j !== pAdj);
        ohne.splice(pX > pAdj ? pX - 1 : pX, 0, adj);
        return ohne.join(' ');
      }
      return null;
    }
  },
  /* ⛔ Die zwei Störfälle, die v572 durchließ — gefunden am 23.09.2026 von einer
     Gegenprüfung mit 2.590 Angriffen, nicht von diesem Prüfer. Beide hängen an
     „Das ist", der Fassung, die v572 erst möglich gemacht hat. */
  {
    /* „Das ist ein armer Mann." für „Dieser Mann ist arm." — aus dem Satz wird
       eine Wortgruppe: هَذَا رَجُلٌ فَقِيرٌ statt هَذَا الرَّجُلُ فَقِيرٌ. Die Regel
       dazu (hadha-al-kein-satz-01) ist ausgeblendet; erkannt wird der Fall über
       die Bestimmtheit (Kopf von js/uebersetzen.js). Gemessen vorher: 21 von
       21 als richtig gezählt. */
    art: 'wortgruppe statt satz', erwartet: 'bestimmtheit',
    mach(s){
      const m = s.sentDe.match(/^(Dieser|Diese|Dieses) ([A-ZÄÖÜ][a-zäöüß]+) ist ([a-zäöüß]+)\.$/);
      if (!m || /(e|er|el|en)$/.test(m[3])) return null;   // nur regelmäßige Endungen, keine geratene Beugung
      const [art, endung] = m[1] === 'Dieser' ? ['ein', 'er'] : m[1] === 'Diese' ? ['eine', 'e'] : ['ein', 'es'];
      return 'Das ist ' + art + ' ' + m[3] + endung + ' ' + m[2] + '.';
    }
  },
  {
    /* „Das ist der alte und schwere Stein." für „Dies ist ein alter und
       schwerer Stein." — mit „Dies ist der …" erkannt, mit „Das ist der …"
       nicht: das hinweisende „das" zählte als Artikel und fehlte als
       Inhaltswort. */
    /* Nah gegen fern, wenn der Satz ZWEI Hinweiswörter hat (Befund 4 der
       Gegenprüfung vom 23.09.2026): „Das ist Zucker und dies ist Milch." für
       „Dies ist Zucker und jenes ist Milch." galt als richtig — das „das" vorn
       deckte jedes Hinweiswort im ganzen Satz, und „dies" stand ja da. */
    art: 'nah-fern bei zwei Hinweiswörtern', erwartet: 'ausgelassen',
    mach(s){
      if (!/^Dies (ist|sind)\b/.test(s.sentDe)) return null;
      const TAUSCH = { jener:'dieser', jenes:'dieses', jene:'diese', Jener:'Dieser', Jenes:'Dieses', Jene:'Diese' };
      const vorn = s.sentDe.replace(/^Dies (ist|sind)\b/, 'Das $1');
      const n = vorn.replace(/\b(jener|jenes|jene|Jener|Jenes|Jene)\b/, w => TAUSCH[w]);
      return n !== vorn ? n : null;
    }
  },
  {
    /* Und die Gegenrichtung ohne „das": „Wer ist dieser? Jener ist ein Imam."
       für „Wer ist jener? Jener ist ein Imam." galt als richtig, weil „jener"
       an ANDERER Stelle noch vorkam — die Genusprüfung übersprang dies- gegen
       jen- ausdrücklich, und die Vollständigkeit fand das Wort. */
    art: 'nah statt fern', erwartet: 'ausgelassen',
    mach(s){
      const TAUSCH = { jener:'dieser', jenes:'dieses', jene:'diese', Jener:'Dieser', Jenes:'Dieses', Jene:'Diese' };
      const treffer = s.sentDe.match(/\b(jener|jenes|jene|Jener|Jenes|Jene)\b/g) || [];
      if (treffer.length < 2) return null;   // bei einem einzigen fehlt es ganz — das prüft „nah-fern" oben
      return s.sentDe.replace(/\b(jener|jenes|jene|Jener|Jenes|Jene)\b/, w => TAUSCH[w]);
    }
  },
  {
    art: 'bestimmt mit „Das ist"', erwartet: 'bestimmtheit',
    mach(s){
      const m = s.sentDe.match(/^Dies ist (ein|eine) ([a-zäöüß]+?)(er|es|e) und ([a-zäöüß]+?)(er|es|e) ([A-ZÄÖÜ][a-zäöüß]+)\.$/);
      if (!m || m[3] !== m[5]) return null;
      const artikel = m[1] === 'eine' ? 'die' : m[3] === 'es' ? 'das' : m[3] === 'er' ? 'der' : null;
      if (!artikel) return null;
      return 'Das ist ' + artikel + ' ' + m[2] + 'e und ' + m[4] + 'e ' + m[6] + '.';
    }
  }
];

/* Wo steht die Bedeutung dieses arabischen Wortes im Muster? Über dieselben
   Helfer wie die Übung selbst — ein eigener Nachbau prüfte den Nachbau. */
function nackt(w){ return w.replace(/[.,;:!?()„“"]/g, ''); }
function musterPos(worte, arabisch){
  const bed = uebsBedeutungsWorte(uebsBedeutung(arabisch));
  if (!bed.length) return -1;
  for (let i = 0; i < worte.length; i++) if (bed.includes(uebsStamm(worte[i]))) return i;
  return -1;
}

const bGeprueft = {};
const bVerfehlt = {};
for (const st of STOERUNGEN){ bGeprueft[st.art] = 0; bVerfehlt[st.art] = []; }

for (const s of saetze){
  const zeilen = zeilenVon.get(s.id);
  for (const st of STOERUNGEN){
    const text = st.mach(s, zeilen || []);
    if (text == null || !text.trim()) continue;
    /* Die Verfälschung muss den Satz WIRKLICH verändert haben. */
    if (text.trim() === s.sentDe.trim()) continue;
    const erg = uebersetzungPruefen(s, zeilen, text);
    bGeprueft[st.art]++;
    if (erg.richtig){
      bVerfehlt[st.art].push({ id: s.id, de: s.sentDe, statt: text, wie: 'als RICHTIG gezählt' });
    } else if (!erg.befunde.some(b => b.art === (st.erwartet || st.art))){
      bVerfehlt[st.art].push({ id: s.id, de: s.sentDe, statt: text,
        wie: 'erkannt als ' + (erg.befunde.map(b=>b.art).join('+') || 'ratlos') });
    }
  }
}

/* ---------- C) Die Rückmeldung nennt alle drei Stücke ---------- */

/* Elias hat drei Dinge verlangt: WAS falsch ist, WARUM, und die RICHTIGE
   Übersetzung. Die dritte ist die einzige, die immer da sein MUSS — auch im
   ratlos-Zweig. Genau sie fällt beim Umbauen als erste weg. */
const cFehler = [];
let cGeprueft = 0;
for (const s of saetze.slice(0, 60)){
  const erg = uebersetzungPruefen(s, zeilenVon.get(s.id), 'völliger unsinn hier');
  const text = uebersetzungRueckmeldung ? uebersetzungRueckmeldung(erg) : '';
  cGeprueft++;
  if (erg.richtig){ cFehler.push(s.id + ': „völliger unsinn" gilt als richtig'); continue; }
  if (!text.includes(s.sentDe))
    cFehler.push(s.id + ': die Rückmeldung nennt die Musterübersetzung nicht');
}

/* ---------- D) Die genannten Regeln gibt es wirklich ---------- */

/* ⛔⛔ DAS IST DER EIGENTLICHE PFLEGEPUNKT DIESER ÜBUNG.

   js/uebersetzen.js nennt sieben Regelkennungen im Klartext. Wird eine davon in
   grammar-data.js umbenannt oder entfernt, zeigt die Rückmeldung weiter auf sie
   — und „Warum? → Regel" öffnet nichts. Kein Test würde rot, die Übung liefe
   weiter, und Elias bekäme eine Begründung ohne Karte dahinter.
   [[werkzeug_ohne_aufrufer]] · [[zahlen_ohne_beleg]]

   ⚠️ Gelesen werden die Kennungen aus dem QUELLTEXT und nicht aus einer Liste
   hier: eine Liste im Prüfer wäre eine zweite Wahrheit, die beim achten Befund
   vergessen wird. */
const dFehler = [];
const quelltextUebersetzen = fs.readFileSync(path.join(WURZEL, 'js/uebersetzen.js'), 'utf8');
const GRAMMAR_RULES = hole('GRAMMAR_RULES');
const bekannteIds = new Set(Array.isArray(GRAMMAR_RULES) ? GRAMMAR_RULES.map(r => r && r.id) : []);
/* ⛔ GESUCHT WIRD IM KOMMENTARFREIEN QUELLTEXT, NICHT AM AUFRUF.

   Die erste Fassung suchte nach `uebsBefund(… 'id')` und fand 5 von 6: sobald
   eine Kennung in einem ternären Ausdruck steht (`hatKhabar ? 'nat-…' : null`),
   endet der Aufruf nicht mehr mit ihr, und sie fiel durch. Ein Prüfer, der von
   der Schreibweise des Aufrufs abhängt, prüft die Schreibweise.

   Jetzt: Kommentare weg, dann JEDE Zeichenkette, die wie eine Regelkennung
   aussieht. Das erfasst auch Nennungen an Stellen, die es heute noch nicht gibt.
   [[funktion_als_referenz_sieht_tot_aus]] */
const ohneKommentare = quelltextUebersetzen
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const genannt = [...ohneKommentare.matchAll(/['"]([a-z][a-z0-9]*(?:-[a-z0-9]+)+-\d{2})['"]/g)]
  .map(m => m[1]);
const genanntEindeutig = [...new Set(genannt)];
for (const id of genanntEindeutig){
  if (!bekannteIds.has(id)) dFehler.push(id);
}

/* ---------- Ausgabe ---------- */

console.log('--- Übersetzungsübung ---\n');
console.log('Sätze mit Musterübersetzung: ' + saetze.length);
console.log('Module geladen:              ' + geladen.length + ' von ' + DATEIEN.length);
if (gescheitert.length) gescheitert.forEach(z => console.log('   ⚠️ ' + z));

console.log('\nA) Richtige Übersetzungen gehen durch');
console.log('   geprüft: ' + aGeprueft + ' (' + HARMLOS.length + ' Fassungen, die letzten zwei nur wo sie passen) · durchgefallen: ' + aFehler.length);
if (aFehler.length && (laut || aFehler.length <= 12))
  aFehler.slice(0, laut ? 999 : 12).forEach(f =>
    console.log('   ✖ ' + f.id + ' [' + f.wie + '] ' + f.grund + '  — „' + f.de + '"'));
else if (aFehler.length) console.log('   (mit --laut alle zeigen)');

console.log('\nB) Störtest — jede Verfälschung muss ihren Befund auslösen');
for (const st of STOERUNGEN){
  const n = bGeprueft[st.art], v = bVerfehlt[st.art].length;
  const quote = n ? Math.round((n - v) / n * 100) : 0;
  console.log('   ' + st.art.padEnd(14) + String(n).padStart(4) + ' Fälle · erkannt '
            + String(n - v).padStart(4) + ' = ' + quote + '%');
  if (v && laut) bVerfehlt[st.art].slice(0, 6).forEach(x =>
    console.log('        ✖ ' + x.id + ' ' + x.wie + ': „' + x.statt + '"'));
}

console.log('\nC) Die Rückmeldung nennt immer die richtige Übersetzung');
console.log('   geprüft: ' + cGeprueft + ' · ohne Musterübersetzung: ' + cFehler.length);
if (cFehler.length) cFehler.slice(0, 6).forEach(z => console.log('   ✖ ' + z));

console.log('\nD) Die genannten Regeln gibt es in grammar-data.js');
console.log('   genannt: ' + genanntEindeutig.length + ' · unbekannt: ' + dFehler.length);
if (laut || dFehler.length)
  genanntEindeutig.forEach(id => console.log('   ' + (bekannteIds.has(id) ? '✓' : '✖') + ' ' + id));

/* ---------- Urteil ---------- */

/* ⭐ Die Schwellen stehen hier und nicht im Kopf des Lesers.
   A und C sind HART: eine richtige Übersetzung darf nie durchfallen, und die
   Musterübersetzung muss immer dastehen — beides ist Elias' Auftrag im
   Wortlaut. B ist weich, und zwar mit Grund: eine Verfälschung kann zufällig
   einen ANDEREN, ebenfalls richtigen Befund auslösen (wer das letzte Wort
   streicht, ändert oft auch die Bestimmtheit). Gemessen wird deshalb, dass
   überhaupt etwas erkannt wird, und die Quote steht als Zahl da. */
const urteile = [];
if (aFehler.length) urteile.push('A: ' + aFehler.length + ' richtige Übersetzung(en) fallen durch — die Übung ist zu streng.');
if (cFehler.length) urteile.push('C: ' + cFehler.length + ' Rückmeldung(en) ohne die richtige Übersetzung.');
if (dFehler.length) urteile.push('D: js/uebersetzen.js nennt Regel(n), die es in grammar-data.js nicht gibt: ' + dFehler.join(', ') + ' — „Warum? → Regel" öffnet dort nichts.');
if (!genanntEindeutig.length) urteile.push('D: im Quelltext steht keine einzige Regelkennung — entweder ist das Muster von uebsBefund() geändert worden, oder die Übung nennt keine Regeln mehr.');
for (const st of STOERUNGEN){
  const n = bGeprueft[st.art];
  if (!n){ urteile.push('B: für „' + st.art + '" gab es keinen einzigen Störfall — die Fehlerart ist ungeprüft.'); continue; }
  const quote = (n - bVerfehlt[st.art].length) / n;
  if (quote < 0.5) urteile.push('B: „' + st.art + '" wird nur in ' + Math.round(quote*100) + '% der Störfälle erkannt.');
}

if (urteile.length){
  console.log('\n✖ ' + urteile.length + ' Befund(e):');
  urteile.forEach(z => console.log('  · ' + z));
  process.exit(1);
}
console.log('\n✅ Richtiges geht durch, Falsches wird benannt, die Musterübersetzung steht immer dabei.');
process.exit(0);
