#!/usr/bin/env node
/* test-funktionsanzeige.mjs — bewacht die Funktionsanzeige der Infokarte gegen Zeilen, die zu einem
 * ANDEREN Wort mit denselben Buchstaben gehören (13.10.2026).
 *
 * Elias am 20.08.2026: „So sollen alle infokarten ihre jeweilige funktion auch bekommen."
 * Die Listen in js/irab.js führen nur Buchstaben, keine Vokalzeichen. Beim Nachmessen der Gruppe
 * „Koran häufigste" zeigten deshalb 22 Karten aller Bücher eine falsche Zeile: das Verb „verstehen"
 * hieß „Personalpronomen" (fa + hum), „akzeptieren" eine „Zeit- oder Ortsangabe" (qabla), „Ärmel"
 * ein „Fragewort" (kam), „Leute" hatte „die Endung ändert sich nie" (a + hal).
 *
 * Bewacht (die Regeln sind von Claude, nicht von Elias bestellt — so steht es auch in js/irab.js):
 *   K1  Eine Verbkarte zeigt nur „Verb".
 *   K2  Auf der Karte zählt ihre eigene Buchstabenfolge — weder wa / fa noch die Fragepartikel
 *       werden abgetrennt.
 *   K3  Eine Nomen- oder Adjektivkarte mit Tanwin un / in bekommt aus den Listen nichts.
 *   B   Was bleiben muss: „heute" (als Adjektiv geführt) und „welcher" (Partikel mit Tanwin)
 *       behalten ihre Zeilen; Hinweiswort, Ortsangabe, Genitivpräposition, Fragewort stehen weiter da.
 *   D   aw, ammā und allā stehen selbst in der Liste und behalten „die Endung ändert sich nie".
 *   P   Ein Personalpronomen ist immer unveränderlich — auf der Karte und im Satz.
 *   V   Im SATZ wird eine Vorsilbe (Fragepartikel, wa, fa) nur abgetrennt, wenn der Buchstabe danach
 *       weder Sukun noch Schadda trägt, das Hamza nicht Damma / Kasra / Sukun trägt und das Wort
 *       kein Tanwin un / in hat. Wo wirklich wa-hum oder a-hādhā dasteht, bleibt es dabei.
 * Dann am echten Bestand: die 255 Karten der Koran-Gruppe (immer) und alle Buchkarten (wenn data/
 * auf diesem Rechner liegt) — keine Verbkarte mit einer zweiten Zeile, keine Nomenkarte mit Tanwin
 * und einer Zeile aus den Listen, keine Karte ohne Auskunft.
 * Jede Regel hat einen Störtest am ECHTEN Quelltext (js/irab.js, im Speicher verändert), der sie rot
 * werden lassen muss.
 *
 * Kein arabisches Wort ist hier getippt: die Probewörter stehen als Codepunkte da, mit Umschrift.
 *
 *   node test-funktionsanzeige.mjs     Exit 0 = alles grün, alle Störtests schlagen an
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const W = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(W, p), 'utf8');
const gibt = p => fs.existsSync(path.join(W, p));
const QUELLE = lies('js/irab.js');
const u = (...cp) => String.fromCodePoint(...cp).normalize('NFC');

/* ---------- Probewörter (Codepunkte; Umschrift und Bedeutung dahinter) ---------- */
const FAHIMA  = u(0x641, 0x64E, 0x647, 0x650, 0x645, 0x64E);            /* fahima  „verstehen"        — fa + hum   */
const QABILA  = u(0x642, 0x64E, 0x628, 0x650, 0x644, 0x64E);            /* qabila  „akzeptieren"      — qabla      */
const GHADA   = u(0x63A, 0x64E, 0x62F, 0x64E, 0x627);                   /* ghadā   „aufbrechen"       — ghadan     */
const KUMM    = u(0x643, 0x64F, 0x645, 0x651, 0x64C);                   /* kumm    „Ärmel"            — kam        */
const NAAM    = u(0x646, 0x64E, 0x639, 0x64E, 0x645, 0x64C);            /* naʿam   „Nutztiere"        — naʿam „ja" */
const AHL     = u(0x623, 0x64E, 0x647, 0x652, 0x644, 0x64C);            /* ahl     „Leute" (mit Tanwin)            */
const AHL0    = u(0x623, 0x64E, 0x647, 0x652, 0x644);                   /* ahl     ohne Endzeichen, wie in einem Buch */
const AHLU    = u(0x623, 0x64E, 0x647, 0x652, 0x644, 0x64F);            /* ahlu    im Satz, vor einem Genitiv      */
const WAHM0   = u(0x648, 0x64E, 0x647, 0x652, 0x645);                   /* wahm    „Einbildung"       — wa + hum   */
const WAHMUN  = u(0x648, 0x64E, 0x647, 0x652, 0x645, 0x64C);            /* wahmun                                  */
const FAHMUN  = u(0x641, 0x64E, 0x647, 0x652, 0x645, 0x64C);            /* fahmun  „Verstehen"        — fa + hum   */
const WAFIYY  = u(0x648, 0x64E, 0x641, 0x650, 0x64A, 0x651);            /* wafiyy  „worttreu"         — wa + fī    */
const HADHA   = u(0x647, 0x64E, 0x630, 0x64E, 0x627);                   /* hādhā   „dieser"                        */
const INDA    = u(0x639, 0x650, 0x646, 0x652, 0x62F, 0x64E);            /* ʿinda   „bei"                           */
const MIN     = u(0x645, 0x650, 0x646, 0x652);                          /* min     „von"                           */
const MAN     = u(0x645, 0x64E, 0x646, 0x652);                          /* man     „wer"                           */
const AW      = u(0x623, 0x64E, 0x648, 0x652);                          /* aw      „oder"                          */
const AMMA    = u(0x623, 0x64E, 0x645, 0x651, 0x64E, 0x627);            /* ammā    „was … betrifft"                */
const ALLA    = u(0x623, 0x64E, 0x644, 0x651, 0x64E, 0x627);            /* allā    „dass nicht"                    */
const ALYAWM  = u(0x627, 0x644, 0x652, 0x64A, 0x64E, 0x648, 0x652, 0x645, 0x64F);   /* al-yawmu „heute"            */
const AYY     = u(0x623, 0x64E, 0x64A, 0x651, 0x64C);                   /* ayy     „welcher" (mit Tanwin)          */
const HUMA    = u(0x647, 0x64F, 0x645, 0x64E, 0x627);                   /* humā    „sie beide"                     */
const ANTUM   = u(0x623, 0x64E, 0x646, 0x652, 0x62A, 0x64F, 0x645, 0x652);          /* antum   „ihr"               */
const ANTA    = u(0x623, 0x64E, 0x646, 0x652, 0x62A, 0x64E);            /* anta    „du"                            */
const AYNA    = u(0x623, 0x64E, 0x64A, 0x652, 0x646, 0x64E);            /* ayna    „wo"                            */
const AMNUN   = u(0x623, 0x64E, 0x645, 0x652, 0x646, 0x64C);            /* amn     „Sicherheit"       — a + min    */
const AHHALA  = u(0x623, 0x64E, 0x647, 0x651, 0x64E, 0x644, 0x64E);     /* ahhala  „befähigen"        — a + hal    */
const UHIMMA  = u(0x623, 0x64F, 0x647, 0x650, 0x645, 0x651, 0x64E);     /* uhimma  (Probe: Hamza mit Damma) — a + hum */
const AKAMUN  = u(0x623, 0x64E, 0x643, 0x64E, 0x645, 0x64C);            /* akam    „Hügel" (Probe: Tanwin)  — a + kam */
const AHADHA  = u(0x623, 0x64E, 0x647, 0x64E, 0x630, 0x64E, 0x627);     /* a-hādhā „ist dies …?"                   */
const WAHUM   = u(0x648, 0x64E, 0x647, 0x64F, 0x645, 0x652);            /* wa-hum  „und sie"                       */
const AHUM    = u(0x623, 0x64E, 0x647, 0x64F, 0x645, 0x652);            /* a-hum   „sind sie …?"                   */
const FAHUWA  = u(0x641, 0x64E, 0x647, 0x64F, 0x648, 0x64E);            /* fa-huwa „so ist er"                     */
const AHADHA0 = u(0x623, 0x647, 0x630, 0x627);                          /* a-hādhā ohne Vokalzeichen               */
const WAHUM0  = u(0x648, 0x647, 0x645);                                 /* wa-hum  ohne Vokalzeichen               */

const UNV = 'die Endung ändert sich nie';
/* Woran eine Zeile aus den Listen zu erkennen ist (deutscher Teil — der arabische steht in js/irab.js). */
const LISTENZEILE = [UNV, 'Personalpronomen', 'Fragewort', 'Hinweiswort', 'Genitivpräposition',
                     'Zeit- oder Ortsangabe', 'Das Wort danach steht im Genitiv', 'Rufpartikel'];

/* ---------- js/irab.js in einer eigenen Welt (dieselben Ersatzstücke wie pruefe-funktionen.js) ---------- */
function welt(code){
  const ctx = { window: {}, console, document: undefined };
  ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(`
    function escapeHtml(s){ return String(s == null ? '' : s); }
    var SETTINGS = { buecher: null };
    function aktivesBuch(){ return 'madina-1'; }
    var STILLE_FEHLER_HIER = [];
    function stillerFehler(wo, e){ STILLE_FEHLER_HIER.push(wo + ': ' + (e && e.message || e)); }
  `, ctx);
  vm.runInContext(code, ctx, { filename: 'js/irab.js' });
  const hol = n => vm.runInContext(n, ctx);
  return { ctx, zeilen: k => hol('funktionenVon')(k) || [], unv: w => !!hol('istIndeklinabel')(w),
           still: () => hol('STILLE_FEHLER_HIER') };
}

/* ---------- die Zusicherungen an Probekarten ---------- */
function pruefe(code){
  const f = [];
  let w;
  try { w = welt(code); } catch (e){ return ['LADEN: ' + e.message]; }
  const sag = (ok, nr, text) => { if (!ok) f.push(nr + ': ' + text); };
  const genau = (karte, soll) => JSON.stringify(w.zeilen(karte)) === JSON.stringify(soll);
  const hat = (karte, teil) => w.zeilen(karte).some(z => z.includes(teil));

  /* K1 — eine Verbkarte zeigt nur „Verb" */
  sag(genau({ ar: FAHIMA, type: 'verb' }, ['Verb']), 'K1', 'fahima („verstehen") zeigt nur „Verb" — nicht „Personalpronomen"');
  sag(genau({ ar: QABILA, type: 'verb' }, ['Verb']), 'K1', 'qabila („akzeptieren") zeigt nur „Verb" — nicht „Zeit- oder Ortsangabe"');
  sag(genau({ ar: GHADA, type: 'verb' }, ['Verb']), 'K1', 'ghadā („aufbrechen") zeigt nur „Verb" — nicht „die Endung ändert sich nie"');

  /* K2 — die eigene Buchstabenfolge, keine abgetrennte Vorsilbe */
  sag(genau({ ar: WAFIYY, type: 'adjective' }, ['Adjektiv']), 'K2', 'wafiyy („worttreu") zeigt nur „Adjektiv" — nicht „Genitivpräposition"');
  sag(genau({ ar: WAHM0, type: 'noun' }, ['Nomen']), 'K2', 'wahm („Einbildung", ohne Endzeichen) zeigt nur „Nomen" — nicht „Personalpronomen"');
  sag(genau({ ar: AHL0, type: 'noun' }, ['Nomen']), 'K2', 'ahl (ohne Endzeichen) zeigt nur „Nomen"');

  /* K3 — Nomen / Adjektiv mit Tanwin un / in */
  sag(genau({ ar: KUMM, type: 'noun' }, ['Nomen']), 'K3', 'kumm („Ärmel") zeigt nur „Nomen" — nicht „Fragewort"');
  sag(genau({ ar: NAAM, type: 'noun' }, ['Nomen']), 'K3', 'naʿam („Nutztiere") zeigt nur „Nomen" — nicht „die Endung ändert sich nie"');
  sag(genau({ ar: AHL, type: 'noun' }, ['Nomen']), 'K3', 'ahl („Leute") zeigt nur „Nomen"');

  /* B — was bleiben muss */
  sag(hat({ ar: ALYAWM, type: 'adjective' }, UNV), 'B1', '„heute" (als Adjektiv geführt, ohne Tanwin) behält „die Endung ändert sich nie"');
  sag(hat({ ar: AYY, type: 'particle' }, 'Fragewort') && hat({ ar: AYY, type: 'particle' }, UNV), 'B2', '„welcher" (Partikel mit Tanwin) behält „Fragewort" und „die Endung ändert sich nie"');
  sag(hat({ ar: HADHA, type: 'particle' }, 'Hinweiswort') && hat({ ar: HADHA, type: 'particle' }, UNV), 'B3', 'hādhā zeigt „Hinweiswort" und „die Endung ändert sich nie"');
  sag(hat({ ar: INDA, type: 'particle' }, 'Zeit- oder Ortsangabe') && hat({ ar: INDA, type: 'particle' }, 'Genitiv'), 'B3', 'ʿinda zeigt die Ortsangabe und die Wirkung');
  sag(hat({ ar: MIN, type: 'particle' }, 'Genitivpräposition') && !hat({ ar: MIN, type: 'particle' }, 'Fragewort'), 'B3', 'min ist Genitivpräposition, kein Fragewort');
  sag(hat({ ar: MAN, type: 'particle' }, 'Fragewort') && !hat({ ar: MAN, type: 'particle' }, 'Genitivpräposition'), 'B3', 'man ist Fragewort, keine Genitivpräposition');

  /* D — aw, ammā, allā stehen selbst in der Liste */
  for (const [name, wort] of [['aw', AW], ['ammā', AMMA], ['allā', ALLA]]){
    sag(hat({ ar: wort, type: 'particle' }, UNV), 'D1', name + ' zeigt auf der Karte „die Endung ändert sich nie"');
    sag(w.unv(wort), 'D1', name + ' gilt im Satz als unveränderlich');
  }

  /* P — ein Personalpronomen ist immer unveränderlich */
  sag(hat({ ar: HUMA, type: 'particle' }, 'Personalpronomen') && hat({ ar: HUMA, type: 'particle' }, UNV), 'P1', 'humā zeigt „Personalpronomen" und „die Endung ändert sich nie"');
  sag(w.unv(ANTUM), 'P2', 'antum gilt im Satz als unveränderlich (Nun mit Sukun — nur die Form selbst zählt)');
  sag(w.unv(ANTA) && w.unv(AYNA), 'P2', 'anta und ayna gelten im Satz als unveränderlich');

  /* V — die Vorsilbe im Satz */
  sag(!w.unv(AHLU), 'V1', 'ahlu ist im Satz NICHT unveränderlich (Ha mit Sukun: kein a + hal)');
  sag(!w.unv(WAHMUN), 'V1', 'wahmun ist NICHT unveränderlich (kein wa + hum)');
  sag(!w.unv(FAHMUN), 'V1', 'fahmun ist NICHT unveränderlich (kein fa + hum)');
  sag(!w.unv(AMNUN), 'V1', 'amnun ist NICHT unveränderlich (kein a + min)');
  sag(!w.unv(AHHALA), 'V2', 'ahhala ist NICHT unveränderlich (Ha mit Schadda: kein a + hal)');
  sag(!w.unv(UHIMMA), 'V3', 'ein Hamza mit Damma ist nicht die Fragepartikel');
  sag(!w.unv(AKAMUN), 'V4', 'ein Wort mit Tanwin un ist nicht Fragepartikel + Listenwort');
  sag(w.unv(AHADHA), 'V5', 'a-hādhā bleibt unveränderlich (Fragepartikel + hādhā)');
  sag(w.unv(WAHUM) && w.unv(FAHUWA), 'V5', 'wa-hum und fa-huwa bleiben unveränderlich');
  sag(w.unv(AHUM), 'V5', 'a-hum bleibt unveränderlich');
  sag(w.unv(AHADHA0) && w.unv(WAHUM0), 'V5', 'ohne Vokalzeichen bleibt es beim Abtrennen wie bisher');

  sag((w.still() || []).length === 0, 'Z1', 'kein stiller Listenfehler während der Proben');
  return f;
}

let rot = 0;
const befunde = pruefe(QUELLE);
if (befunde.length){ rot = 1; console.log('❌ Befunde an den Probekarten:'); befunde.forEach(b => console.log('   ' + b)); }
else console.log('✅ Probekarten: K1 bis K3, B, D, P, V — alles wie zugesichert');

/* ---------- der echte Bestand ---------- */
{
  const w = welt(QUELLE);
  /* `streng`: zählt eine Karte ohne Auskunft als Befund? Für die Koran-Gruppe ja (sie liegt im Repo). Für die
     Buchkarten wird die Zahl nur genannt — sein Fenster misst pruefe-funktionen.js, und ein neuer Abzug mit einer
     unbekannten Wortart soll dort auffallen, nicht hier jede Auslieferung sperren. */
  const pruefeKarten = (karten, name, streng = true) => {
    let verbMehr = 0, tanwinListe = 0, leer = 0;
    const zeig = [];
    for (const k of karten){
      if (!k || !k.ar) continue;
      const z = w.zeilen(k);
      if (!z.length || (z.length === 1 && z[0] === 'Wort')) { leer++; zeig.push(`${k.id} zeigt nichts oder nur „Wort"`); }
      if (k.type === 'verb' && !(z.length === 1 && z[0] === 'Verb')) { verbMehr++; zeig.push(`${k.id} (Verb) zeigt: ${z.join(' | ')}`); }
      if ((k.type === 'noun' || k.type === 'adjective') && /[\u064C\u064D]/.test(k.ar)
          && z.some(t => LISTENZEILE.some(l => t.includes(l)))) { tanwinListe++; zeig.push(`${k.id} (${k.type}, Tanwin) zeigt: ${z.join(' | ')}`); }
    }
    const ok = !verbMehr && !tanwinListe && (!leer || !streng);
    console.log((ok ? '✅ ' : '❌ ') + name + ': ' + karten.length + ' Karten — Verbkarten mit zweiter Zeile ' + verbMehr
      + ', Nomen/Adjektive mit Tanwin und Listenzeile ' + tanwinListe + ', ohne Auskunft ' + leer);
    if (!ok){ rot = 1; zeig.slice(0, 8).forEach(t => console.log('   ' + t)); }
    return ok;
  };

  /* Die Koran-Gruppe: dieselben Karten, die die App baut — koranKarten() aus js/buecher.js. */
  const buecher = lies('js/buecher.js');
  const m = buecher.match(/function koranKarten\(\)\{[\s\S]*?\n\}\n/);
  if (!m){ rot = 1; console.log('❌ koranKarten() in js/buecher.js nicht gefunden — die Koran-Gruppe ist NICHT gemessen.'); }
  else {
    const k = { }; vm.createContext(k);
    vm.runInContext(lies('koran-haeufig-data.js') + "\n;const KORAN_BUCH = 'koran-haeufig';\nfunction koranListe(){ return KORAN_HAEUFIG; }\n" + m[0]
      + '\n;globalThis.__K = koranKarten();', k);
    const karten = k.__K || [];
    if (karten.length < 200){ rot = 1; console.log('❌ Koran-Gruppe: nur ' + karten.length + ' Karten gelesen (erwartet über 200).'); }
    pruefeKarten(karten, 'Koran häufigste');
    const ahl = karten.filter(x => String(x.ar).normalize('NFC') === AHL);
    if (ahl.length !== 1){ rot = 1; console.log('❌ Koran-Gruppe: die Karte ahl („Leute") steht ' + ahl.length + '-mal da (erwartet 1) — die Probe am Anlass fehlt.'); }
    else if (JSON.stringify(w.zeilen(ahl[0])) !== JSON.stringify(['Nomen'])){ rot = 1; console.log('❌ Koran-Gruppe: ahl zeigt ' + w.zeilen(ahl[0]).join(' | ') + ' statt nur „Nomen".'); }
    else console.log('✅ Koran-Gruppe: die Karte ahl (' + ahl[0].id + ', der Anlass) zeigt nur „Nomen"');
  }

  /* Alle Buchkarten — nur, wenn die Abzüge auf diesem Rechner liegen (data/ ist nicht im Repo). */
  if (gibt('data/buecher.js')){
    const b = { window: {} }; b.globalThis = b; vm.createContext(b);
    vm.runInContext(lies('data/buecher.js') + '\n;globalThis.__B = (typeof BUECHER !== "undefined") ? BUECHER : [];', b);
    let n = 0;
    for (const buch of (b.__B || [])) if (buch.datei && gibt(buch.datei)) { try { vm.runInContext(lies(buch.datei), b); n++; } catch (e){ console.log('   ! ' + buch.datei + ': ' + e.message); } }
    const alle = [];
    for (const liste of Object.values(b.window.VOKABELN || {})) for (const k of liste) alle.push(k);
    if (!alle.length) console.log('   (keine Buchkarten geladen — nur die Koran-Gruppe gemessen)');
    else {
      pruefeKarten(alle, 'Buchkarten aus ' + n + ' Büchern', false);
      /* Was bleiben muss, am echten Bestand: „heute" aus Madina 1 behält seine Zeile. */
      const heute = alle.filter(x => String(x.ar).normalize('NFC') === ALYAWM);
      if (heute.length && !heute.every(x => w.zeilen(x).some(t => t.includes(UNV)))){ rot = 1; console.log('❌ „heute" hat seine Zeile „die Endung ändert sich nie" verloren.'); }
      else if (heute.length) console.log('✅ „heute" (' + heute.length + ' Karte) behält „die Endung ändert sich nie"');
    }
  } else console.log('   (data/ fehlt auf diesem Rechner — die Buchkarten sind NICHT gemessen, nur die Koran-Gruppe)');
}

/* ---------- Störtests am echten Quelltext ---------- */
const STOER = [
  { name: 'K1: Verbkarte läuft wieder durch die Listen', alt: "  if (w.type === 'verb') return [WORTART.verb];\n", neu: '', erwartet: 'K1' },
  { name: 'K2: die Karte trennt wieder wa / fa ab', alt: 'return !beugbar && istGenauInListe(wort, liste);', neu: 'return !beugbar && istInListe(wort, liste);', erwartet: 'K2' },
  { name: 'K3: Tanwin zählt nicht mehr', alt: "const beugbar = (w.type === 'noun' || w.type === 'adjective') && /[\\u064C\\u064D]/.test(wort);", neu: 'const beugbar = false;', erwartet: 'K3' },
  { name: 'K3 zu breit: jedes Nomen und Adjektiv', alt: "const beugbar = (w.type === 'noun' || w.type === 'adjective') && /[\\u064C\\u064D]/.test(wort);", neu: "const beugbar = (w.type === 'noun' || w.type === 'adjective');", erwartet: 'B1' },
  { name: 'K3 trifft auch Partikeln', alt: "const beugbar = (w.type === 'noun' || w.type === 'adjective') && /[\\u064C\\u064D]/.test(wort);", neu: 'const beugbar = /[\\u064C\\u064D]/.test(wort);', erwartet: 'B2' },
  { name: 'Karte fragt wieder die Satz-Regel', alt: 'const karteUnveraenderlich = drin(INDEKLINABEL) || drin(PERSONALPRONOMEN);', neu: 'const karteUnveraenderlich = istIndeklinabel(wort);', erwartet: 'K3' },
  { name: 'P1: Pronomen-Regel fehlt auf der Karte', alt: 'drin(INDEKLINABEL) || drin(PERSONALPRONOMEN);', neu: 'drin(INDEKLINABEL);', erwartet: 'P1' },
  { name: 'P2: Pronomen-Regel fehlt im Satz, wo nur die Form zählt', alt: 'return INDEKLINABEL.includes(roh) || PERSONALPRONOMEN.includes(roh);', neu: 'return INDEKLINABEL.includes(roh);', erwartet: 'P2' },
  { name: 'B3: die Ortsangaben-Liste hängt nicht mehr an der Karte', alt: '  if (drin(ZURUF))            nenn(', neu: '  if (false)            nenn(', erwartet: 'B3' },
  { name: 'D1: aw, ammā, allā fehlen in der Liste', alt: "'\\u0623\\u0648', '\\u0623\\u0645\\u0627', '\\u0623\\u0644\\u0627',", neu: '', erwartet: 'D1' },
  { name: 'V1: die Schranke gibt immer frei', alt: '  return !(m && /[\\u0651\\u0652]/.test(m[1]));', neu: '  return true;', erwartet: 'V1' },
  { name: 'V1: die Schranke liest das Sukun nicht', alt: '/[\\u0651\\u0652]/.test(m[1])', neu: '/[\\u0651]/.test(m[1])', erwartet: 'V1' },
  { name: 'V2: die Schranke liest das Schadda nicht', alt: '/[\\u0651\\u0652]/.test(m[1])', neu: '/[\\u0652]/.test(m[1])', erwartet: 'V2' },
  { name: 'V1: der Satz fragt die Schranke nicht', alt: 'const istIndeklinabel = w => vorsilbeAbtrennbar(w) ? istIndeklinabelMitVorsilbe(w)', neu: 'const istIndeklinabel = w => true ? istIndeklinabelMitVorsilbe(w)', erwartet: 'V1' },
  { name: 'V3: Hamza mit Damma gilt als Fragepartikel', alt: '  if (/^\\u0623[\\u064F\\u0650\\u0652]/.test(rein)) return false;\n', neu: '', erwartet: 'V3' },
  { name: 'V4: Tanwin hinter der Fragepartikel', alt: '  if (/[\\u064C\\u064D]/.test(rein)) return false;\n', neu: '', erwartet: 'V4' },
  { name: 'V3: ohneFragepartikel fragt nicht nach', alt: '  if (!fragepartikelMoeglich(w))\n', neu: '  if (false)\n', erwartet: 'V3' },
  { name: 'V5: die Schranke sperrt alles', alt: '  return !(m && /[\\u0651\\u0652]/.test(m[1]));', neu: '  return false;', erwartet: 'V5' },
];
for (const { name, alt, neu, erwartet } of STOER){
  const n0 = QUELLE.split(alt).length - 1;
  if (n0 !== 1){ console.log(`❌ Störtest „${name}": die Stelle kommt ${n0}-mal vor (erwartet 1)`); rot = 1; continue; }
  const f = pruefe(QUELLE.replace(alt, () => neu));
  const n = f.filter(x => x.startsWith(erwartet + ':')).length;
  if (n) console.log(`✅ Störtest „${name}" schlägt an (${n})`);
  else { console.log(`❌ Störtest „${name}" schlägt NICHT an` + (f.length ? ` — andere Befunde: ${f.slice(0, 2).join(' | ')}` : '')); rot = 1; }
}
console.log(rot ? '\n❌ test-funktionsanzeige: es gibt Befunde.' : `\n✅ test-funktionsanzeige: alle Zusicherungen grün, alle ${STOER.length} Störtests schlagen an.`);
process.exit(rot);
