#!/usr/bin/env node
/* pruefe-satzmodus-aktuell.mjs — hält der Satzmodus mit seinen Vokabeln Schritt?
 * ==========================================================================
 *
 * Elias am 24.09.2026 (Goal „Satzmodus und alle Modi aktuell halten"):
 *   „ich möchte das das automatisch geguckt wird ob man den satzmodus mit
 *    etwas erweitern kann. du sollst automatisch das machen und die app immer
 *    aktuell halten. ich denke die routinen für mittwoch und sonntag bieten
 *    sich dafür gut an. … jemand soll auch prüfen ob es immer aktuell sind die
 *    sätze und ob neue vokabeln sowohl innerhalb der übung bzw fragestellung
 *    als auch der beispielsätze und auswahlmöglichkeiten gibt"
 *
 * Vier Teile, gemessen an der App selbst (vm, derselbe Kontext wie
 * pruefe-uebersetzen.mjs) und an SEINER Kapitelauswahl (.stand-app.json):
 *
 *   A  Jede Form seiner Regelkarten — Hinweiswörter (Übung 11), Fragewörter
 *      (13), Pronomen (14) — und jede seiner Endungs-Karteikarten (15, seit
 *      v612) steht in der Auswahl ihrer Übung und wird mindestens einmal
 *      gefragt. Eine Form ohne Satz ist ein Befund (Exit 2): dafür fehlt ein
 *      belegter Satz.
 *   B  Jede Aufgabe dieser drei Übungen hat ihre Lösung in der Auswahl, keine
 *      Auswahl nennt ein Wort zweimal, und bei den Fragewörtern steht neben der
 *      Lösung kein zweites Wort derselben Bedeutung („was?" = مَا und مَاذَا).
 *      Verstoß = Exit 1.
 *   C  Balance: wie viel Prozent der Sätze enthalten ein Wort aus seinen
 *      NEUESTEN Kapiteln (höchstes Kapitel je Buch seiner Auswahl)? 0 % ist ein
 *      Befund (Exit 2). Der Richtwert „etwa jeder fünfte Satz" ist MEIN
 *      Vorschlag, nicht seiner — deshalb nur Anzeige, keine Grenze.
 *   D  Welche Wörter der neuesten Kapitel stehen in KEINEM Satz des
 *      Satzmodus? Die Liste ist Arbeit für die Wartung (Mi/So), kein Fehler.
 *   E  Jede Antwort ungefähr gleich oft, in JEDER Auswahl-Übung (Elias,
 *      25.09.2026: „es sollen bewusst ungefähr gleichviele von jeder antwort
 *      geben damit jede antwort gleich oft ungefähr drankommt" · „das sollte
 *      auch bei den anderen aufgaben so sein mit reihum"): in den ersten k
 *      Aufgaben — k = Zahl der verschiedenen Lösungen — steht jede Lösung genau
 *      einmal (uebungMischen in js/uebung.js). Verstoß = Exit 1.
 *   F  Genitiv (Elias, 25.09.2026: „es sollen mehrere sein im genitiv aus
 *      unterschiedlichsten gründen. lasse auch bei den genitiv präpositionen
 *      immer durchrutieren sodass ich jede mal sehe"): jede Aufgabe von
 *      Übung 5 hat mindestens zwei Wörter im Genitiv aus mindestens zwei
 *      Gründen, und in Übung 4 und 5 kommt in den ersten k Aufgaben jede der
 *      k Präpositionen/ظُرُوف einmal. Verstoß = Exit 1. Welche seiner acht
 *      Präpositionen (Karte f19-jarr) in Übung 5 noch fehlen, steht im
 *      Bericht — Arbeit für neue Sätze aus seinen Büchern.
 *   G  Die Tanwīn-Namen heißen auf „-tayn" (Elias, 25.09.2026: „bei den
 *      antworten mit tanweed sollte so dummatayn, kasratayn, fathatayn stehen
 *      und nicht tan"). Verstoß = Exit 1.
 *   I  Kein zweites خَبَر direkt hinter einem خَبَر (Elias, 25.09.2026, zu
 *      „Namen nach Familienwörtern (هَذَا أَخِي عِيسَى) … oder sollen solche
 *      Sätze vorerst draußen bleiben?": „vorerst draußen"). Der Zerleger liest
 *      den Namen dort als zweites خَبَر — daran erkennt ihn dieser Teil, egal
 *      welche Routine den Satz aufnimmt. Dieselbe Doppelung stand bis v622 in
 *      22 Sätzen „هَذَا الـX صِفَةٌ" (Nomen mit Artikel nach dem Hinweiswort);
 *      kommt sie zurück, meldet dieser Teil auch das. Nach Komma oder
 *      Doppelpunkt ist es eine Aufzählung, kein Verstoß. Verstoß = Exit 1.
 *
 * ⚠️ Was er „einzeln frei" geschaltet hat, steht nur in seinem Browser — hier
 * zählt die Kapitelauswahl UND die Wörter, die die App SELBST für ihn
 * freischaltet (FREISCHALTEN_AUF_WUNSCH in js/kern.js, seit 16.09.2026 auf
 * seinen Wunsch: هَؤُلَاءِ أُولَئِكَ مَتَى أَيٌّ). Ohne sie meldete dieser
 * Prüfer bis 25.09.2026 „Übung 11: jene, Plural ohne Satz" — und ich fragte
 * Elias, ob ich „jene" freischalten soll. Es war seit dem 17.09. frei, und
 * Übung 11 fragte es längst (gemessen mit seinem abgeglichenen Stand: 187
 * Aufgaben, keine Form ohne Satz). Die übrigen einzeln freigeschalteten
 * Wörter sieht dieser Prüfer weiterhin nicht: eine Lücke hier kann in seiner
 * App schon geschlossen sein — vor jeder Frage an ihn seinen Stand lesen.
 * [[einzeln_frei_ist_nur_im_browser]] [[leere_liste_ist_keine_messung]]
 *
 * Aufruf:  node werkzeuge/pruefe-satzmodus-aktuell.mjs            Bericht
 *          node werkzeuge/pruefe-satzmodus-aktuell.mjs --stoertest acht Störungen
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STOER = process.argv.includes('--stoertest');

function stummesElement(){
  return { style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    dataset:{}, children:[], value:'', textContent:'', innerHTML:'', disabled:false,
    addEventListener(){}, removeEventListener(){}, appendChild(){}, querySelector(){ return null; },
    querySelectorAll(){ return []; }, closest(){ return null; }, getAttribute(){ return null; },
    setAttribute(){}, focus(){}, getBoundingClientRect(){ return {width:0,height:0,top:0,left:0}; } };
}

/* Die App laden, wie der Browser es tut — plus die Buchkarten seiner Auswahl
   mit ihren Sätzen aus data/beispielsaetze.js (so kommen sie auch in der App
   in den Satzmodus). */
/* Die Wörter, die js/kern.js beim Start für ihn freischaltet (solange er sie
   nie selbst angefasst hat). null = die Liste ist nicht mehr lesbar — dann
   Ladefehler statt still ohne sie weiterzumessen. */
function aufWunschAus(kernText){
  const m = String(kernText).match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/);
  if (!m) return null;
  return new Set((m[1].match(/'[^']+'|"[^"]+"/g) || []).map(s => s.slice(1, -1)));
}

function ladeApp(){
  const DOM = { getElementById: stummesElement, querySelector: stummesElement, querySelectorAll: () => [],
    createElement: stummesElement, addEventListener(){}, body: stummesElement(), documentElement: stummesElement() };
  const auswahl = JSON.parse(fs.readFileSync(path.join(WURZEL, '.stand-app.json'), 'utf8')).buecher || {};
  const ctx = {
    window:{ addEventListener(){}, matchMedia(){ return { matches:false, addEventListener(){} }; },
      location:{ href:'' }, navigator:{ userAgent:'node', language:'de' }, VOKABELN:{} },
    document: DOM,
    localStorage:{ _d:{}, getItem(k){ return this._d[k] ?? null; }, setItem(k,v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; } },
    navigator:{ userAgent:'node', language:'de', onLine:true },
    console:{ log(){}, warn(){}, error(){}, info(){} }, Date, Math, JSON, Intl, setTimeout, clearTimeout, setInterval, clearInterval
  };
  ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = DOM; ctx.window.localStorage = ctx.localStorage;
  ctx.SETTINGS = { buecher: auswahl, eigene:true, fachbegriffe:true };
  vm.createContext(ctx);
  const DATEIEN = ['vocab-data.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'grammar-data.js',
    'lehrbuch-saetze.js', 'regelsammlung-data.js',
    ...fs.readdirSync(path.join(WURZEL, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)).map(f => 'data/' + f),
    /* v606 (Teil H): js/regeln.js dazu — Übung 9 („Welche Regel?") ruft
       regelAusgeblendet(), ohne die Datei warf baue() still und die Übung sah
       im Prüfer leer aus (im Pane gemessen: 281 Aufgaben). */
    'js/irab.js', 'js/saetze.js', 'js/uebersetzen.js', 'js/regeln.js', 'js/uebung.js'];
  const fehlt = [];
  for (const f of DATEIEN){
    try { vm.runInContext(fs.readFileSync(path.join(WURZEL, f), 'utf8'), ctx, { filename: f }); }
    catch (e){ fehlt.push(f + ': ' + e.message); }
  }
  const hole = n => { try { return vm.runInContext(`typeof ${n} !== 'undefined' ? ${n} : undefined`, ctx); } catch (e){ return undefined; } };
  const VD = hole('VOCAB_DATA'), BS = hole('BEISPIELSAETZE') || {};
  const bekannt = new Set(VD.map(w => String(w.id)));
  const aufWunsch = aufWunschAus(fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8'));
  if (!aufWunsch) fehlt.push('js/kern.js: FREISCHALTEN_AUF_WUNSCH nicht lesbar — ohne die Liste meldet Übung 11 „jene" als Lücke, obwohl seine App es fragt');
  for (const [buch, liste] of Object.entries(ctx.window.VOKABELN || {})){
    const kap = auswahl[buch] || [];
    for (const w of liste) if ((kap.includes(Number(w.chapter)) || (aufWunsch && aufWunsch.has(String(w.id)))) && !bekannt.has(String(w.id))){
      const s = BS[w.id] || {};
      VD.push({ ...w, sentAr: w.sentAr || s.sentAr, sentDe: w.sentDe || s.sentDe });
      bekannt.add(String(w.id));
    }
  }
  /* ⛔ Die BESTELLTEN Fachbegriffe gehören dazu (v612, 25.09.2026) — in der App
     hängt js/kern.js sie in VOCAB_DATA ein (FACHBEGRIFF_AUFTRAG), und ihre
     Sätze stehen damit im Satzmodus. Dieser Lader lädt kern.js nicht: bis v611
     maß er 366 Sätze, die App hat 402, und die Endungen-Übung (15) sah hier gar
     keine Endung — ihre Auswahl SIND diese Karten. Gegengemessen: mit ihnen
     dieselben Verstöße, nur größere Zahlen. */
  { const FV = hole('FACHBEGRIFF_VOKABELN') || [], FA = hole('FACHBEGRIFF_AUFTRAG') || {};
    for (const w of FV) if (Object.prototype.hasOwnProperty.call(FA, String(w.id)) && !bekannt.has(String(w.id))){ VD.push(w); bekannt.add(String(w.id)); } }
  ctx.istBekannt = w => !!w && (w.chapter === 'personal' || bekannt.has(String(w.id)));
  return { ctx, hole, auswahl, fehlt, bekannt, aufWunsch: aufWunsch || new Set() };
}

const nackt = s => String(s || '').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا')
  .replace(/[.،؟?!«»:؛"„“”()]/g, '').trim();
const kern = s => nackt(s).replace(/^(و|ف|ب|ل)?(ال)?/, '');
/* ⛔ DIE KARTENFORM WIRD NICHT BESCHNITTEN (25.09.2026). kern() schneidet ein
   و ف ب ل am Wortanfang ab — richtig am Satzwort (وَالْكِتَابُ), falsch an der
   Karte: aus فَتَاةٌ wurde „تاة", und „junge Frau" (45910) stand als „in keinem
   Satz", obwohl mb1-63-4 الْفَتَاةُ enthält. Zweiwortkarten (مَدْرَسَةٌ
   مُتَوَسِّطَةٌ, 45908) konnten nie treffen, weil jedes Satzwort einzeln
   verglichen wurde. Jetzt: Karte nur ohne Artikel; Satzwort mit UND ohne
   Vorsilbe; dazu das Wortpaar. Störtest 3c. */
const karteKern = s => String(s || '').trim().split(/\s+/).map(w => nackt(w).replace(/^ال/, '')).join(' ');
const satzKerne = w => [...new Set([nackt(w).replace(/^ال/, ''), kern(w)])];
function satzTreffer(worte, neuKern, praesensTreffer){
  const t = [];
  worte.forEach((w, i) => {
    let hit = null;
    for (const k of satzKerne(w)){
      hit = (k.length > 1 && neuKern.get(k)) || (praesensTreffer ? praesensTreffer(k) : null);
      if (!hit && i + 1 < worte.length) hit = neuKern.get(k + ' ' + nackt(worte[i + 1]).replace(/^ال/, '')) || null;
      if (hit) break;
    }
    if (hit) t.push(hit);
  });
  return t;
}

function messen(app){
  const { hole, auswahl } = app;
  const UEB = hole('UEBUNGEN') || [], analysiere = hole('analysiereSatz');
  vm.runInContext('UEB_WORTGRUPPEN = {}', app.ctx);
  /* ⛔ Wie uebungenAufbauen(): erst das Lexikon aus seinem Wortschatz. Ohne das
     (bis 25.09.2026) galten Verben seiner neuesten Kapitel nicht als Verb — in
     „نَظَرَ الطَّالِبُ إِلَى النَّجْمِ." wurde الطَّالِبُ zum مُضَاف إِلَيْه. */
  vm.runInContext('if (typeof setzeLexikon === "function") setzeLexikon(VOCAB_DATA)', app.ctx);
  const pool = hole('alleSaetze')();
  const zerlegt = pool.map(s => { try { return { s, z: analysiere(s.sentAr) }; } catch (e){ return { s, z: null }; } });
  const ergebnis = { pool: pool.length, uebungen: {}, verstoesse: [] };
  /* Übung 15 (Endungen, v612) hat keine Regelkarte: ihre Formen sind seine
     Endungs-Karteikarten, gelesen von uebEndungGlieder() — derselben Funktion
     wie in der App. */
  for (const [id, karte] of [['isara', 'f19-isara'], ['fragewort', 'f19-fragen'], ['pronomen', 'f19-pronomen'], ['endungen', null]]){
    const U = UEB.find(u => u.id === id);
    const glieder = karte ? hole('uebKartenGlieder')(karte) : ((hole('uebEndungGlieder') || (() => []))());
    const gefragt = new Map(glieder.map(g => [g.form, 0]));
    let aufgaben = 0;
    for (const { s, z } of zerlegt){
      if (!z || !U) continue;
      let a = []; try { a = U.baue(z, s) || []; } catch (e){ ergebnis.verstoesse.push(`${id}: baue() wirft — ${e.message}`); }
      for (const x of a){
        aufgaben++;
        if (gefragt.has(x.loesung)) gefragt.set(x.loesung, gefragt.get(x.loesung) + 1);
        const werte = x.optionen.map(o => o.wert);
        if (!werte.includes(x.loesung)) ergebnis.verstoesse.push(`${id}: Lösung fehlt in der Auswahl — ${s.id || s.sentAr}`);
        if (new Set(werte).size !== werte.length) ergebnis.verstoesse.push(`${id}: ein Wort steht zweimal zur Wahl — ${s.id || s.sentAr}`);
        if (id === 'fragewort'){
          const bed = hole('uebBedeutung'), gl = glieder.concat(hole('uebGruppe')(karte, () => false));
          const deVon = w => (gl.find(g => g.form === w) || {}).de;
          if (x.optionen.some(o => o.wert !== x.loesung && bed(deVon(o.wert)) === bed(deVon(x.loesung))))
            ergebnis.verstoesse.push(`fragewort: zwei Wörter „${deVon(x.loesung)}" zur Wahl — ${s.id || s.sentAr}`);
        }
      }
    }
    ergebnis.uebungen[id] = { nr: U && U.nr, aufgaben, formen: glieder.length,
      ohneSatz: [...gefragt].filter(([, n]) => !n).map(([f]) => ({ form: f, de: (glieder.find(g => g.form === f) || {}).de })) };
  }
  // E: in JEDER Auswahl-Übung (art 'wahl') jede Antwort ungefähr gleich oft —
  // die ersten k Aufgaben haben k verschiedene Lösungen (uebungMischen).
  const mischen = hole('uebungMischen');
  ergebnis.gleichOft = [];
  /* ⭐ Und je Antwort gleich viele (Elias, 25.09.2026: „wenn es ingesamt 30
     sätze zu dieser übung gibt dann sollte jede antwort 10 sätze haben"): in der
     gemischten Runde hat jede Antwort min(Vorrat, Deckel) Aufgaben, Deckel =
     die seltenste, aber mindestens UEB_JE_ANTWORT_MIN. */
  const MIN_JE = hole('UEB_JE_ANTWORT_MIN') || 10;
  ergebnis.jeAntwort = [];
  const gleichViele = (U, liste, schluessel) => {
    if (!mischen || !liste.length) return;
    const voll = new Map(), runde = new Map();
    for (const x of liste){ const k = schluessel(x); voll.set(k, (voll.get(k) || 0) + 1); }
    for (const x of mischen(U, liste)){ const k = schluessel(x); runde.set(k, (runde.get(k) || 0) + 1); }
    const deckel = Math.max(Math.min(...voll.values()), MIN_JE);
    for (const [k, v] of voll) if ((runde.get(k) || 0) !== Math.min(v, deckel))
      ergebnis.verstoesse.push(`${U.id}: nicht je Antwort gleich viele — „${k}" ${runde.get(k) || 0} statt ${Math.min(v, deckel)}`);
    const unter = [...voll].filter(([, v]) => v < MIN_JE).map(([k, v]) => `${k} ${v}`);
    ergebnis.jeAntwort.push(`${U.nr}: je ${deckel}` + (unter.length ? ` · unter ${MIN_JE}: ${unter.join(', ')}` : ''));
  };
  for (const U of UEB.filter(u => u.art === 'wahl')){
    const liste = [];
    for (const { s, z } of zerlegt){ if (!z) continue; try { liste.push(...(U.baue(z, s) || [])); } catch (e){ /* B meldet baue()-Fehler */ } }
    const loesungen = new Set(liste.map(x => String(x.loesung)));
    const erste = mischen ? mischen(U, liste).slice(0, loesungen.size).map(x => String(x.loesung)) : [];
    ergebnis.gleichOft.push(`${U.nr}: ${loesungen.size}`);
    if (loesungen.size > 1 && new Set(erste).size !== loesungen.size)
      ergebnis.verstoesse.push(`${U.id}: nicht jede Antwort gleich oft — in den ersten ${loesungen.size} Aufgaben nur ${new Set(erste).size} verschiedene Lösungen`);
    gleichViele(U, liste, x => String(x.loesung));
  }
  // F: Genitiv — Übung 5 nur schwer, Übung 4 und 5 reihum nach Präposition.
  const gruende = hole('uebGenitivGruende');
  ergebnis.genitiv = {};
  for (const id of ['jarr-paar', 'alle-majrur']){
    const U = UEB.find(u => u.id === id);
    if (!U){ ergebnis.verstoesse.push(`${id}: Übung fehlt`); continue; }
    const liste = [];
    for (const { s, z } of zerlegt){
      if (!z) continue;
      let a = []; try { a = U.baue(z, s) || []; } catch (e){ ergebnis.verstoesse.push(`${id}: baue() wirft — ${e.message}`); }
      for (const x of a){
        liste.push(x);
        if (id === 'jarr-paar'){
          /* Elias, 25.09.2026: „auch hier die sätze schwerer machen wie beim
             genitiv davor und mit mehr präpositionen im satz". */
          const p = z.filter(t => t.rolle === 'حَرْف جَرّ').length;
          const n = z.filter((t, i) => t.rolle === 'حَرْف جَرّ' && z[i + 1] && z[i + 1].erwartet === 'jarr').length;
          if (p < 2 || n < 2) ergebnis.verstoesse.push(`jarr-paar: zu leicht (weniger als zwei Präpositionen mit Genitiv) — ${s.id || s.sentAr}`);
        }
        if (id === 'alle-majrur'){
          const g = gruende ? gruende(z) : [];
          if (g.length < 2 || new Set(g.map(y => y.grund)).size < 2)
            ergebnis.verstoesse.push(`alle-majrur: zu leicht (weniger als zwei Genitive aus zwei Gründen) — ${s.id || s.sentAr}`);
          if (!x.aufloesung) ergebnis.verstoesse.push(`alle-majrur: keine Begründung nach der Antwort — ${s.id || s.sentAr}`);
        }
      }
    }
    const zaehl = new Map();
    for (const x of liste) for (const k of (x.reihum || [])) zaehl.set(k, (zaehl.get(k) || 0) + 1);
    const korb = x => (x.reihum || []).slice().sort((p, q) => (zaehl.get(p) - zaehl.get(q)) || (p < q ? -1 : p > q ? 1 : 0))[0] || '—';
    const koerbe = new Set(liste.map(korb));
    const erste = mischen ? mischen(U, liste).slice(0, koerbe.size).map(korb) : [];
    if (koerbe.size > 1 && new Set(erste).size !== koerbe.size)
      ergebnis.verstoesse.push(`${id}: Präpositionen nicht reihum — in den ersten ${koerbe.size} Aufgaben nur ${new Set(erste).size} verschiedene`);
    gleichViele(U, liste, korb);
    ergebnis.genitiv[id] = { aufgaben: liste.length, koerbe: [...koerbe], schluessel: [...zaehl.keys()] };
  }
  /* Übung 2 (Elias, 25.09.2026: „hier müssen die sätze auch wesentlich länger
     werden und mit mehreren adjektiven. auch möchte ich im selben modus das du
     nach dem manut fragst"): jede Aufgabe aus einem Satz mit mindestens zwei
     Adjektiven, mindestens eines davon نَعْت; beide Fragen kommen vor. */
  {
    const U2 = UEB.find(u => u.id === 'nat'), wortart = hole('wortart');
    let fragen = new Set(), n2 = 0;
    for (const { s, z } of zerlegt){
      if (!z || !U2) continue;
      let a = []; try { a = U2.baue(z, s) || []; } catch (e){ ergebnis.verstoesse.push(`nat: baue() wirft — ${e.message}`); }
      if (!a.length) continue;
      n2 += a.length; a.forEach(x => fragen.add((x.reihum || [])[0]));
      const nat = z.filter(t => String(t.rolle).includes('نَعْت')).length;
      const adj = nat + z.filter(t => String(t.rolle) === 'خَبَر' && wortart && wortart(t.wort) === 'adjective').length;
      if (!nat || adj < 2) ergebnis.verstoesse.push(`nat: zu leicht (weniger als zwei Adjektive) — ${s.id || s.sentAr}`);
    }
    if (n2 && !(fragen.has('nat') && fragen.has('manut'))) ergebnis.verstoesse.push('nat: fragt nicht nach نَعْت UND مَنْعُوت');
    ergebnis.genitiv.nat = n2;
  }
  const karteJarr = (hole('FOLGE19_KARTEN') || []).find(k => k.id === 'f19-jarr');
  const acht = karteJarr ? karteJarr.gruppen[0].merkmale.map(m => String(m).split('–')[0].trim()) : [];
  /* ⛔ Vorkommen, nicht Korb (25.09.2026): ein Korb ist das SELTENSTE Stichwort
     einer Aufgabe. Kam mit satz-lang-19 (إِلَى + بِ) ein Satz dazu, wurde by1-102-1
     zum Korb عِنْدَ — und إِلَى stand hier als „ohne schweren Satz", obwohl es in
     zwei Aufgaben vorkommt. Gefragt ist, ob er die Präposition in einem schweren
     Satz SIEHT. Störtest 18. */
  const inFuenf = new Set(ergebnis.genitiv['alle-majrur'] ? ergebnis.genitiv['alle-majrur'].schluessel : []);
  const kernVon = hole('uebPraepKern');
  ergebnis.genitiv.fehlen = acht.filter(p => {
    const k = p.length <= 2 ? kernVon(p).charAt(0) + 'ـ' : kernVon(p);
    return !inFuenf.has(k) && !(k === 'إلى' && inFuenf.has('الى'));
  });
  // G: Tanwīn-Namen auf „-tayn"
  for (const h of (hole('HARAKA_WAHL') || []))
    if (/tan$/.test(h.wert) && !/tayn$/.test(String(h.text)))
      ergebnis.verstoesse.push(`Tanwīn-Name nicht auf „-tayn": ${h.text}`);
  // C + D: neueste Kapitel = höchstes Kapitel je Buch seiner Auswahl
  const neueste = Object.entries(auswahl).filter(([, k]) => k.length).map(([b, k]) => [b, Math.max(...k)]);
  const VD = hole('VOCAB_DATA');
  const neu = VD.filter(w => neueste.some(([b, k]) => w.book === b && Number(w.chapter) === k));
  const neuKern = new Map();
  for (const w of neu) for (const f of [w.ar, w.sg, w.pl, w.femSg].filter(Boolean)) for (const t of String(f).split('/')) neuKern.set(karteKern(t), w);
  /* ⛔ VERBEN ZÄHLEN AUCH IM PRÄSENS UND FUTUR (25.09.2026). Verglichen wurde nur
     mit ar/sg/pl/femSg — bei einem Verb ist ar die Vergangenheit (كَنَسَ). Nach
     v610 (16 Sätze aus Kapitel 4 mit سَأَكْنُسُ, يَغْسِلُ, سَيَكْوِي …) stieg der
     Anteil deshalb nicht, er FIEL (7,4 → 7,3 %). Jetzt auch der Präsensstamm
     (present ohne Vorsilbe); am Satzwort werden سَـ und die Vorsilbe أ ت ي ن
     abgeschnitten, und eine Personenendung (ون ين ان وا) probeweise. */
  const neuPraesens = new Map();
  for (const w of neu) if (w.type === 'verb') for (const t of String(w.present || '').split('/').filter(Boolean)){
    const k = kern(t);
    if (/^[اتين]/.test(k) && k.length > 3) neuPraesens.set(k.slice(1), w);
  }
  const praesensTreffer = k => {
    const ohneS = k.replace(/^س(?=[اتين])/, '');
    if (!/^[اتين]/.test(ohneS)) return null;
    const stamm = ohneS.slice(1);
    for (const x of [stamm, stamm.replace(/(ون|ين|ان|وا)$/, '')]) if (x.length > 1 && neuPraesens.has(x)) return neuPraesens.get(x);
    return null;
  };
  let mitNeu = 0; const getroffen = new Set();
  for (const { s } of zerlegt){
    const t = satzTreffer(String(s.sentAr).split(/\s+/), neuKern, praesensTreffer);
    if (t.length){ mitNeu++; t.forEach(w => getroffen.add(String(w.id))); }
  }
  // H: das PFLICHTPROGRAMM für JEDE Übung (SATZMODUS-PFLICHTPROGRAMM.md) — auch
  // für eine neue, ohne Liste. Elias, 25.09.2026: „prüfer sollten das dann
  // nachprüfen" und „ja richtig" auf: jede Übung reihum, jede Antwort gleich
  // oft, genug Sätze — auch jede neue Übung, ohne dass sie jemand einträgt.
  ergebnis.pflicht = []; ergebnis.pflichtLuecken = [];
  const satzTeileF = hole('satzTeile');
  let teile = null; try { teile = satzTeileF ? satzTeileF() : null; } catch (e){ teile = null; }
  for (const U of UEB){
    const liste = [];
    for (const { s, z } of zerlegt){ if (!z) continue; try { liste.push(...(U.baue(z, s) || [])); } catch (e){ /* B/F melden baue()-Fehler */ } }
    const imTeil = teile ? [1, 2].filter(t => (teile[t] || []).includes(U.id)) : [];
    if (teile && imTeil.length !== 1) ergebnis.verstoesse.push(`${U.id}: steht in ${imTeil.length} Teilen statt in genau einem (satzTeile)`);
    if (!liste.length){ ergebnis.pflichtLuecken.push(`${U.nr} ${U.id}: keine Aufgabe in seiner Auswahl`); continue; }
    /* reihum nach der Frage (Antippen-Übungen mit einem `reihum`-Schlüssel je
       Aufgabe, z. B. مُبْتَدَأ/خَبَر): in den ersten k Aufgaben jede der k Fragen.
       Mehrere Schlüssel je Aufgabe (Präpositionen) prüft Teil F. */
    const einzel = liste.filter(x => Array.isArray(x.reihum) && x.reihum.length === 1);
    if (einzel.length === liste.length && mischen){
      const k = new Set(liste.map(x => String(x.reihum[0]))).size;
      const erste = mischen(U, liste).slice(0, k).map(x => String(x.reihum[0]));
      if (k > 1 && new Set(erste).size !== k)
        ergebnis.verstoesse.push(`${U.id}: nicht reihum — in den ersten ${k} Aufgaben nur ${new Set(erste).size} verschiedene Fragen`);
    }
    if (liste.length < MIN_JE) ergebnis.pflichtLuecken.push(`${U.nr} ${U.id}: nur ${liste.length} Aufgaben (Pflicht: mindestens ${MIN_JE})`);
    ergebnis.pflicht.push(`${U.nr} ${U.id}: ${liste.length} Aufgaben` + (imTeil.length === 1 ? ` · Teil ${imTeil[0]}` : ''));
  }
  const nummern = UEB.map(u => u.nr).sort((a, b) => a - b);
  if (nummern.some((n, i) => n !== i + 1)) ergebnis.verstoesse.push(`Nummern nicht linear 1–${UEB.length}: ${nummern.join(',')}`);
  if (!fs.existsSync(path.join(WURZEL, 'SATZMODUS-PFLICHTPROGRAMM.md'))) ergebnis.verstoesse.push('SATZMODUS-PFLICHTPROGRAMM.md fehlt');
  // I: kein zweites خَبَر direkt hinter einem خَبَر — Name nach Familienwort
  //    („vorerst draußen", Elias 25.09.2026) oder ein Rückfall des Zerlegers.
  for (const { s, z } of zerlegt){
    if (!z) continue;
    for (let i = 1; i < z.length; i++){
      if (String(z[i-1].rolle || '').startsWith('خَبَر') && String(z[i].rolle || '').startsWith('خَبَر')
          && !/[،,:؛]$/.test(String(z[i-1].wort || '')))
        ergebnis.verstoesse.push(`zweites خَبَر hinter ${z[i-1].wort} (${s.id || s.sentAr}) — Name nach Familienwort? Elias 25.09.2026: „vorerst draußen"`);
    }
  }
  ergebnis.neueste = neueste; ergebnis.neuWoerter = neu.length;
  ergebnis.anteil = pool.length ? Math.round(1000 * mitNeu / pool.length) / 10 : 0;
  ergebnis.mitNeu = mitNeu;
  ergebnis.ohneSatzNeu = neu.filter(w => !getroffen.has(String(w.id))).map(w => `${w.de} (${w.book} K${w.chapter}, ${w.id})`);
  return ergebnis;
}

function bericht(e){
  const z = [];
  z.push(`Satzvorrat: ${e.pool} Sätze (seine Auswahl: ${e.neueste.map(([b, k]) => `${b} bis K${k}`).join(', ')})`);
  for (const [id, u] of Object.entries(e.uebungen)){
    z.push(`Übung ${u.nr} ${id}: ${u.aufgaben} Aufgaben · ${u.formen} Formen auf seiner Karte · ohne Satz: ${u.ohneSatz.length ? u.ohneSatz.map(x => `„${x.de}"`).join(', ') : '—'}`);
  }
  if (e.genitiv){
    for (const id of ['jarr-paar', 'alle-majrur']) if (e.genitiv[id])
      z.push(`Genitiv ${id}: ${e.genitiv[id].aufgaben} Aufgaben · reihum über ${e.genitiv[id].koerbe.length}: ${e.genitiv[id].koerbe.join(' ')}`);
    z.push(`Präpositionen seiner Karte ohne schweren Satz in Übung 5: ${e.genitiv.fehlen.length ? e.genitiv.fehlen.join(' ') : '—'}`);
  }
  if (e.jeAntwort && e.jeAntwort.length) z.push(`Je Antwort gleich viele (Übung: Deckel · seltene Antworten brauchen Sätze):\n   ${e.jeAntwort.join('\n   ')}`);
  if (e.pflicht && e.pflicht.length) z.push(`Pflichtprogramm je Übung (Teil H):\n   ${e.pflicht.join('\n   ')}`
    + (e.pflichtLuecken.length ? `\n   Lücken: ${e.pflichtLuecken.join(' · ')}` : ''));
  z.push(`Balance: ${e.anteil} % der Sätze (${e.mitNeu} von ${e.pool}) enthalten ein Wort aus den neuesten Kapiteln — Richtwert (MEIN Vorschlag): etwa 20 %`);
  z.push(`Neueste Kapitel: ${e.neuWoerter} Wörter, davon ${e.ohneSatzNeu.length} in keinem Satz` + (e.ohneSatzNeu.length ? ':\n   ' + e.ohneSatzNeu.slice(0, 40).join('\n   ') : ''));
  return z.join('\n');
}

const app = ladeApp();
if (app.fehlt.length){ console.log('⛔ Ladefehler:\n  ' + app.fehlt.join('\n  ')); process.exit(1); }
/* shuffle() steht in js/kern.js, das der Lader nicht lädt — uebungMischen() (Teil E) braucht es.
   Dieselbe Rückgabe wie dort: eine gemischte KOPIE. */
if (typeof app.hole('shuffle') !== 'function')
  vm.runInContext('function shuffle(arr){ const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }', app.ctx);

if (STOER){
  let rot = 0;
  /* Die Zahl der Störtests wird GEZÄHLT — bis 25.09.2026 stand „alle 11" fest
     in der Schlusszeile und stimmte nach dem zwölften nicht mehr. */
  let anzahl = 0;
  const ok = (name, bedingung) => { anzahl++; console.log(`${bedingung ? '✔' : '✘'} Störtest: ${name}`); if (!bedingung) rot++; };
  // 1. Eine erfundene Form auf seiner Karte, zu der es keinen Satz gibt → Teil A muss sie nennen.
  const karten = app.hole('FOLGE19_KARTEN');
  const isara = karten.find(k => k.id === 'f19-isara');
  isara.gruppen[0].merkmale.push('\u0630\u064E\u064A\u0652\u0646\u0650\u0643\u064E – Störtest-Form');
  let e = messen(app);
  ok('erfundene Kartenform ohne Satz wird gemeldet', e.uebungen.isara.ohneSatz.some(x => x.de === 'Störtest-Form'));
  isara.gruppen[0].merkmale.pop();
  // 2. Eine Übung, deren Aufgabe die Lösung nicht zur Wahl stellt → Teil B muss rot werden.
  const U = app.hole('UEBUNGEN').find(u => u.id === 'pronomen'), echt = U.baue;
  U.baue = function(z, s){ return (echt.call(this, z, s) || []).map(a => ({ ...a, optionen: a.optionen.filter(o => o.wert !== a.loesung).concat([{ wert: 'x', text: 'x' }]) })); };
  e = messen(app);
  ok('Lösung fehlt in der Auswahl → Verstoß', e.verstoesse.some(v => v.startsWith('pronomen: Lösung fehlt')));
  U.baue = echt;
  // 3. Ein neuestes Kapitel ohne ein einziges Wort im Satzvorrat → Teil C meldet 0 %.
  const alt = JSON.stringify(app.auswahl);
  for (const b of Object.keys(app.auswahl)) app.auswahl[b] = [999];
  e = messen(app);
  ok('Balance 0 % wird erkannt', e.anteil === 0);
  Object.assign(app.auswahl, JSON.parse(alt));
  // 3b. Ohne die Präsensformen der neuesten Verben muss der Anteil SINKEN — sonst
  //     zählt der Präsens-Zweig (25.09.2026) gar nicht mit.
  {
    const vorher = messen(app).mitNeu;
    const verben = app.hole('VOCAB_DATA').filter(w => w.type === 'verb' && w.present);
    const gemerkt = verben.map(w => w.present);
    verben.forEach(w => { w.present = ''; });
    const ohne = messen(app).mitNeu;
    verben.forEach((w, i) => { w.present = gemerkt[i]; });
    ok(`Präsens der neuesten Verben zählt (${vorher} Sätze, ohne Präsens ${ohne})`, ohne < vorher);
  }
  // 3c. Kartenwort mit ف am Anfang (فَتَاةٌ) und Zweiwortkarte (مَدْرَسَةٌ مُتَوَسِّطَةٌ)
  //     werden im Satz gefunden — mit dem alten Schnitt an der Karte (kern) nicht.
  {
    const m = new Map([[karteKern('فَتَاةٌ'), { id: 'a' }], [karteKern('مَدْرَسَةٌ مُتَوَسِّطَةٌ'), { id: 'b' }]]);
    const t = satzTreffer('وَمَنْ هَذِهِ الْفَتَاةُ؟ هُوَ فِي الْمَدْرَسَةِ الْمُتَوَسِّطَةِ.'.split(/\s+/), m, null).map(x => x.id);
    ok('Kartenwort mit ف am Anfang und Zweiwortkarte werden gefunden', t.includes('a') && t.includes('b'));
    const alt = new Map([[kern('فَتَاةٌ'), { id: 'a' }]]);
    ok('Gegenprobe: mit dem alten Schnitt an der Karte fände er فَتَاةٌ nicht', !satzTreffer(['الْفَتَاةُ'], alt, null).length);
  }
  // 4. uebungMischen wieder nur gemischt → Teil E muss rot werden (Übung 11: 98 von 152 Aufgaben haben هَذَا).
  vm.runInContext('globalThis.__echtMischen = uebungMischen; uebungMischen = function(m, l){ return shuffle(l.slice()); };', app.ctx);
  e = messen(app);
  ok('nur gemischt statt reihum → Verstoß', e.verstoesse.some(v => v.startsWith('isara: nicht jede Antwort')));
  vm.runInContext('uebungMischen = globalThis.__echtMischen;', app.ctx);
  // 5. Übung 4/5 wieder nur gemischt → Teil F muss rot werden.
  vm.runInContext('globalThis.__echtMischen = uebungMischen; uebungMischen = function(m, l){ return l.some(a => a && Array.isArray(a.reihum)) ? shuffle(l.slice()) : globalThis.__echtMischen(m, l); };', app.ctx);
  e = messen(app);
  ok('Präpositionen nur gemischt statt reihum → Verstoß', e.verstoesse.some(v => / Präpositionen nicht reihum/.test(v)));
  vm.runInContext('uebungMischen = globalThis.__echtMischen;', app.ctx);
  // 6. Übung 5 wieder mit jedem Satz, der EIN Genitiv-Wort hat → Teil F muss rot werden.
  const U5 = app.hole('UEBUNGEN').find(u => u.id === 'alle-majrur'), echt5 = U5.baue;
  U5.baue = function(z){ const ziele = z.map((t, i) => t.erwartet === 'jarr' ? i : -1).filter(i => i >= 0); return ziele.length ? [{ frage: 'x', ziele, art: 'mehrfach', aufloesung: 'x' }] : []; };
  e = messen(app);
  ok('Übung 5 wieder leicht → Verstoß', e.verstoesse.some(v => v.startsWith('alle-majrur: zu leicht')));
  U5.baue = echt5;
  // 6b. Übung 4 wieder mit jedem Satz, der EINE Präposition hat → Teil F muss rot werden.
  const U4 = app.hole('UEBUNGEN').find(u => u.id === 'jarr-paar'), echt4 = U4.baue;
  U4.baue = function(z){ const i = z.findIndex(t => t.rolle === 'حَرْف جَرّ'); return i >= 0 ? [{ frage: 'x', ziele: [i], art: 'mehrfach', reihum: ['x'] }] : []; };
  e = messen(app);
  ok('Übung 4 wieder leicht → Verstoß', e.verstoesse.some(v => v.startsWith('jarr-paar: zu leicht')));
  U4.baue = echt4;
  // 6c. Übung 2 wieder mit jedem Satz, der EIN نَعْت hat → muss rot werden.
  const U2 = app.hole('UEBUNGEN').find(u => u.id === 'nat'), echt2 = U2.baue;
  U2.baue = function(z){ const i = z.findIndex(t => String(t.rolle).includes('نَعْت')); return i >= 0 ? [{ frage: 'x', ziele: [i], art: 'mehrfach', reihum: ['nat'] }] : []; };
  e = messen(app);
  ok('Übung 2 wieder leicht → Verstoß', e.verstoesse.some(v => v.startsWith('nat: zu leicht') || v.startsWith('nat: fragt nicht')));
  U2.baue = echt2;
  // 7. Ein Tanwīn-Name wieder auf „-tan" → Teil G muss rot werden.
  const hw = app.hole('HARAKA_WAHL'), altText = hw[1].text;
  hw[1].text = 'ـٌ  Ḍammatān';
  e = messen(app);
  ok('Tanwīn-Name „-tan" → Verstoß', e.verstoesse.some(v => v.startsWith('Tanwīn-Name')));
  hw[1].text = altText;
  // 8. Wieder ungedeckelt (Nominativ 557 gegen Genitiv 240) → „je Antwort gleich viele" muss rot werden.
  vm.runInContext('globalThis.__echtGleich = uebungGleichViele; uebungGleichViele = function(l){ return shuffle(l.slice()); };', app.ctx);
  e = messen(app);
  ok('je Antwort NICHT gleich viele → Verstoß', e.verstoesse.some(v => v.startsWith('kasus: nicht je Antwort gleich viele')));
  vm.runInContext('uebungGleichViele = globalThis.__echtGleich;', app.ctx);
  // 9. Eine NEUE Übung ohne Aufgabe → Teil H (Pflichtprogramm) muss sie melden, ohne Liste.
  const UEBL = app.hole('UEBUNGEN');
  UEBL.push({ id: 'stoer-neu', nr: UEBL.length + 1, name: 'Störtest', art: 'wahl', baue: () => [] });
  e = messen(app);
  ok('neue Übung ohne Aufgabe → Pflichtprogramm meldet sie', (e.pflichtLuecken || []).some(v => v.includes('stoer-neu')));
  UEBL.pop();
  // 10. Eine NEUE Endungs-Karte ohne Satz (v612) → Teil A muss sie nennen: die
  //     Auswahl von Übung 15 kommt live aus seinen Karten, nicht aus einer Liste.
  const VDL = app.hole('VOCAB_DATA');
  VDL.push({ id: 'stoer-suffix', ar: 'ـكُمَا', de: 'die Besitzendung „euer beider“ — Störtest', type: 'particle', chapter: 'personal', regel: 'possessiv-endungen-01' });
  e = messen(app);
  ok('neue Endungs-Karte ohne Satz → Teil A meldet sie', (e.uebungen.endungen && e.uebungen.endungen.ohneSatz || []).some(x => /Störtest/.test(x.de)));
  VDL.pop();
  // 11. Die Wörter, die die App selbst für ihn freischaltet, zählen mit (25.09.2026):
  //     ohne sie meldet Übung 11 wieder „jene, Plural" — genau die falsche Lücke von damals.
  {
    const weg = VDL.filter(w => app.aufWunsch.has(String(w.id)));
    for (const w of weg){ VDL.splice(VDL.indexOf(w), 1); app.bekannt.delete(String(w.id)); }
    e = messen(app);
    ok(`ohne die ${weg.length} auf seinen Wunsch freigeschalteten Wörter fehlt „jene" wieder`, weg.length > 0 && e.uebungen.isara.ohneSatz.some(x => /jene/.test(String(x.de))));
    for (const w of weg){ VDL.push(w); app.bekannt.add(String(w.id)); }
  }
  // 12. Ist die Liste in js/kern.js nicht mehr lesbar → Ladefehler statt still ohne sie.
  ok('FREISCHALTEN_AUF_WUNSCH unlesbar → erkannt', aufWunschAus('const ANDERS = [1];') === null
    && aufWunschAus("const FREISCHALTEN_AUF_WUNSCH = ['1', '2'];").size === 2);
  // 18. „ohne schweren Satz" zählt das VORKOMMEN: fällt jede Aufgabe mit عَنْ weg,
  //     muss عَنْ gemeldet werden — und إِلَى, das nur in Aufgaben mit einem
  //     selteneren Stichwort steht, darf NICHT gemeldet werden.
  {
    const U5b = app.hole('UEBUNGEN').find(u => u.id === 'alle-majrur'), echt5b = U5b.baue;
    U5b.baue = function(z, s){ return (echt5b.call(this, z, s) || []).filter(a => !(a.reihum || []).includes('عن')); };
    e = messen(app);
    U5b.baue = echt5b;
    const f = e.genitiv.fehlen.join(' ');
    ok(`ohne Aufgabe mit عَنْ meldet Übung 5 es als fehlend (${f || '—'})`, /عَنْ/.test(f));
    const f2 = messen(app).genitiv.fehlen.join(' ');
    ok(`إِلَى steht in schweren Sätzen und fehlt nicht (${f2 || '—'})`, !/إِلَى/.test(f2));
  }
  // 19. Ein Satz mit Namen nach Familienwort im Satzvorrat → Teil I meldet ihn.
  //     Elias 25.09.2026: „vorerst draußen".
  vm.runInContext('globalThis.__echtAlle = alleSaetze; alleSaetze = () => globalThis.__echtAlle().concat([{ id: "stoer-name", sentAr: "هَذَا أَخِي عِيسَى." }]);', app.ctx);
  e = messen(app);
  vm.runInContext('alleSaetze = globalThis.__echtAlle;', app.ctx);
  ok('Name nach Familienwort im Satzvorrat → Teil I meldet ihn', e.verstoesse.some(v => v.includes('stoer-name')));
  ok('ohne ihn meldet Teil I nichts', !messen(app).verstoesse.some(v => v.startsWith('zweites خَبَر')));
  // 20. Der Zerleger liest „هَذَا الـX صِفَةٌ" wieder mit zweitem خَبَر → Teil I meldet es.
  {
    const an = app.hole('analysiereSatz');
    vm.runInContext('globalThis.__echtAn = analysiereSatz; analysiereSatz = s => globalThis.__echtAn(s).map(t => String(t.rolle).startsWith("gehört zum Hinweiswort") ? { ...t, rolle: "خَبَر" } : t);', app.ctx);
    e = messen(app);
    vm.runInContext('analysiereSatz = globalThis.__echtAn;', app.ctx);
    const n = e.verstoesse.filter(v => v.startsWith('zweites خَبَر')).length;
    ok(`Zerleger wie vor v622 (هَذَا الـX als خَبَر) → Teil I meldet ${n} Sätze`, n >= 20 && typeof an === 'function');
  }
  console.log(rot ? `\n⛔ ${rot} von ${anzahl} Störtest(s) schlagen NICHT an` : `\n✅ alle ${anzahl} Störtests schlagen an`);
  process.exit(rot ? 1 : 0);
}

const e = messen(app);
console.log(bericht(e));
if (e.verstoesse.length){ console.log('\n⛔ ' + e.verstoesse.length + ' Verstöße:\n  ' + e.verstoesse.slice(0, 20).join('\n  ')); process.exit(1); }
const luecken = Object.values(e.uebungen).reduce((n, u) => n + u.ohneSatz.length, 0) + (e.anteil === 0 ? 1 : 0)
  + (e.pflichtLuecken ? e.pflichtLuecken.length : 0);
console.log(luecken ? `\n⚠️ ${luecken} Lücke(n) — Arbeit für die Wartung (Mi/So), kein Werkzeugfehler` : '\n✅ alles aktuell');
process.exit(luecken ? 2 : 0);
