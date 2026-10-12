/* ersatz-bauen.mjs -- schreibt aus den Vorschlägen (ersatz-zuordnen.mjs) und den Entscheidungen von Hand
 * die Ersatzdatenbank: je Buch data-ersatz/vokabeln-<buch>.js im selben Format wie data/vokabeln-<buch>.js,
 * dazu das Verzeichnis data-ersatz/buecher.js (Format von data/buecher.js), die Belegdatei, die Liste
 * „nicht gefunden" und die Liste „Unterschiede".
 *
 * Elias, 11.10.2026: „1:1 ersatzdatenbank von den vokabeln die alle nicht von mir stammen" · „genauso
 * organisiert … wie die bei arabicroots" · „für das deutsche will ich im optimalfall auch eine quelle haben".
 * Von Claude stammt: was als „belegt" zählt (Arabisch, Deutsch und Wortart je mit Fundstelle), und dass ein
 * Platz erst dann in der Datei steht, wenn er belegt ist — eine halbe Karte lässt sich nicht lernen.
 *
 * Was von selbst übernommen wird:
 *   Arabisch und Formen  wenn das Wörterbuch genau EINEN Eintrag mit denselben Vokalzeichen hat
 *   Deutsch              wenn eine Quelle ein deutsches Wort nennt, das sich mit dem Sinn der Karte deckt
 * Alles andere entscheidet die Hand: data-ersatz/hand/<buch>.json, je Kennung
 *   { "felder": { "de": { "w": "…", "wo": "…", "q": "…" } }, "leer": ["root"], "ref": "…", "status": "nicht-gefunden", "grund": "…" }
 *
 * Für Plätze, die keine Quelle des Zuordners belegt, gibt es seit dem 12.10.2026 zwei weitere Abgleiche, deren
 * Funde eine Sitzung von Hand einträgt (Elias: „guck nach weiteren möglichkeiten sie zu besorgen"):
 * ersatz-bama-abgleich.mjs (Buckwalters Stammliste, Quelle „bama") und ersatz-lane.mjs (Lanes Lexikon, Quelle
 * „lane"). Beide nennen die Bedeutung nur auf Englisch -- das Deutsch solcher Plätze ist von Claude danach
 * geschrieben, trägt die Quelle „claude" und zählt als „ohne deutsche Quelle".
 *
 * Die WURZEL kommt seit dem 12.10.2026 auch von selbst aus Lanes Lexikon, wo keine andere Quelle eine nennt:
 * „ersatz-lane.mjs --wurzeln" sieht nach und schreibt data-ersatz/arbeit/lane-wurzeln.json, der Bau hier trägt ein
 * (Quelle „lane", Fundstelle mit Stichwort und Nummer). Anlass: der Probelauf des Wechsels zeigte, dass von den 331
 * Wörtern aus Elias' freigeschalteten Kapiteln nach einem Wechsel 58 unvollständig wären, 53 davon ohne Wurzel.
 * Die Regeln dazu stammen von Claude: nur eine Lücke wird gefüllt, und nur, solange das Arabisch der Karte noch
 * das Stichwort ist. Bewacht von eiche-ersatz-zuordner.mjs, Abschnitt 7.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):  node werkzeuge/ersatz-bauen.mjs [--knapp]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { abzugOrdner, istErsatzkarte } from './datenquelle.mjs';
import { vergleich as wortform, ladeBama, standardDatei, geruest, nachBW, ausBW, wurzelSchluessel, wurzelWert, laneDateiname, laneFuehrtWurzel } from './ersatz-bama-lib.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const ERSATZ = path.join(REPO, 'data-ersatz');
const BUECHER = ['madina-1', 'madina-2', 'madina-3', 'bayna-yadayk-1', 'bayna-yadayk-2', 'bayna-yadayk-3', 'bayna-yadayk-4', 'quran'];
const FELDER = ['ar', 'de', 'type', 'gender', 'sg', 'pl', 'femSg', 'femPl', 'root', 'past', 'present', 'imperative', 'masdar', 'note'];
const voll = v => v !== null && v !== undefined && String(v).trim() !== '';
const nfc = t => String(t ?? '').normalize('NFC').trim();
const DIREKT = ['direkt', 'dewikt', 'enwikt-tab', 'schluessel', 'arabdict', 'buch', 'wikipedia'];
const schreibe = (datei, text) => { fs.writeFileSync(datei + '.neu', text, 'utf8'); fs.renameSync(datei + '.neu', datei); };
const liesJson = (datei, sonst) => fs.existsSync(datei) ? JSON.parse(fs.readFileSync(datei, 'utf8')) : sonst;

const zuordnung = fs.readFileSync(path.join(ERSATZ, 'arbeit', 'zuordnung.jsonl'), 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z));
/* Der Bestand ist der Abzug von arabicroots: in data/ -- oder in data-abzug/, solange auf die Ersatzdatenbank
 * umgeschaltet ist (datenquelle.mjs). Die Regel „wie die Karte" und die Liste der Unterschiede messen gegen ihn;
 * läge an seiner Stelle die Ersatzdatenbank selbst, wäre jede Karte mit sich selbst „wortgleich". */
function ladeBestand(buch) {
  const datei = path.join(abzugOrdner(REPO), 'vokabeln-' + buch + '.js');
  if (!fs.existsSync(datei)) return null;
  const fenster = {};
  vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei });
  const karten = fenster.VOKABELN[buch];
  if (karten.some(istErsatzkarte)) throw new Error(datei + ': das sind Karten der Ersatzdatenbank, nicht der Abzug von arabicroots — nichts gebaut („node werkzeuge/ersatz-wechsel.mjs --stand“ zeigt die Lage)');
  return karten;
}

/* Deutsch aus den Kandidaten: erst die direkte Quelle (arabisches und deutsches Wort stehen beieinander),
 * sonst der Weg über das Englische. Die Reihenfolge folgt den Bedeutungen, wie die Karte sie bisher nennt. */
function deutschAus(satz) {
  // Der Schlüssel zum Lehrbuch geht vor, wenn er das Wort als Stichwort führt (gleiche Schreibung bis auf die
  // Schlussendung) und sein Deutsch sich mit dem Sinn der Karte deckt. Deckt es sich nicht, aber ein Wörterbuch
  // nennt direkt ein passendes Wort, bleibt das Wörterbuch; sonst gilt die Zeile aus der Lektion des Kapitels.
  const schAlle = (satz.deutsch || []).filter(d => !d.erkl && d.sch && d.sch.kopf);
  const sch = schAlle.filter(d => d.sch.streng);
  // deckt sich das Deutsch, genügt in der Lektion des Kapitels auch eine Zeile, die nur in der Schreibweise abweicht
  const schDeckt = schAlle.find(d => d.deckt && d.sch.lektion) || sch.find(d => d.deckt);
  if (schDeckt) return { w: schDeckt.de, wo: schDeckt.wo, q: 'schluessel' };
  const k = (satz.deutsch || []).filter(d => d.deckt && !d.erkl && !d.sch);
  const direkt = k.filter(d => d.sicher === 'vokalisiert');
  // führt die Zeile nur das Verb, die Karte aber „Verb + Verhältniswort", gilt ihr Deutsch nicht von selbst
  const schLektion = sch.find(d => d.sch.lektion && !d.sch.nurErstes);
  if (!direkt.length && schLektion) return { w: schLektion.de, wo: schLektion.wo, q: 'schluessel' };
  const wahl = direkt.length ? direkt : k.filter(d => d.sicher === 'kette');
  if (!wahl.length) return null;
  const woerter = [], orte = [];
  for (const d of wahl) { if (!woerter.some(w => w.toLowerCase() === d.de.toLowerCase())) { woerter.push(d.de); if (orte.length < 4) orte.push(d.wo); } }
  return { w: woerter.slice(0, 4).join(', '), wo: orte.join(' · '), q: direkt.length ? 'direkt' : 'kette' };
}

/* „Wie die Karte": nennen die Quellen zu einem Wort GENAU die deutschen Wörter der bisherigen Karte, steht das Deutsch im
 * Wortlaut der Karte da — dann ändert sich bei einem Wechsel für Elias an dieser Karte nichts.
 * Elias, 12.10.2026, als von 4414 Karten 1601 wortgleich waren: „das ist sehr wenig, guck mal nach damit wir mehr
 * identische bekommen". Und schon am 11.10.2026: „wo anders suchst nach den selben begriffen".
 *
 * Alles Weitere stammt von Claude — die Grenze, und was als „dieselben Wörter" gilt:
 *   JEDES Glied der Karte (getrennt an / ; , außerhalb von Klammern; die Zählung „(1)" trennt ebenfalls) muss als Wort
 *   eines Kandidaten dastehen. Jeder Kandidat der Quellen zählt, auch einer, dessen Seite nur dieselben BUCHSTABEN
 *   trägt: dieselben Buchstaben und dasselbe deutsche Wort wie auf der Karte — das ist das Wort der Karte. Nicht zählen
 *   Erklärungen, und eine Zeile des Schlüssels nur bei strenger Übereinstimmung des Stichworts (sonst käme das Deutsch
 *   eines Nachbarworts herein; so geschehen bei 47793, „idhan“ statt „idha“). Als Kandidat zählt zuletzt auch das
 *   Deutsch, das ohne diese Regel auf der Ersatzkarte stünde: dann ändern sich nur Trennzeichen und Reihenfolge, und
 *   seine Fundstelle und die Sorte des Belegs bleiben (auch „ohne deutsche Quelle").
 *   Fehlt ein einziges Glied, bleibt alles, wie es ist — eine halb übernommene Karte gibt es nicht.
 * „Dasselbe Wort" ist es auch, wenn nur etwas OHNE INHALT anders ist (zweite Fassung, 12.10.2026):
 *   · der Artikel vorn, auf EINER Seite: „die Leute" = „Leute". Nicht „einen Nomen" = „ein Nomen" — zwei verschiedene
 *     Artikel sind ein Unterschied, und einen Schreibfehler der Karte soll die Regel nicht hereinholen.
 *   · Satzzeichen: „danke!" = „danke", „so ... wie" = „so wie"
 *   · die Kürzel „etw.", „jdn.", „jdm." für „etwas", „jemanden", „jemandem"
 *   · bei Verben die Platzhalter „etwas", „jemanden", „jemandem" selbst: „verweigern" = „etwas verweigern".
 *     NIE „sich": „verbreiten" und „sich verbreiten" sind zwei Bedeutungen.
 *   · ein Zusatz in Klammern, den nur die QUELLE führt: „ursprüngliche Form (eines Wortes)" = „ursprüngliche Form".
 *     Ein Zusatz, den nur die KARTE führt („Stern (Himmelskörper)"), zählt NICHT: er steht in keiner Quelle. Elias am
 *     12.10.2026 auf die Frage, ob solche Zusätze von seiner bisherigen Karte abgeschrieben werden sollen (Beispiel
 *     „(1) Haus; (2) Vers (Poesie)" gegen „Haus, Vers"; es ging um 124 Karten): „dann nicht übernehmen".
 *     Das ist SEINE Entscheidung, keine Grenze von Claude — sie wird nur auf sein Wort geändert.
 *   · dieselben Wörter in derselben Reihenfolge, nur anders getrennt: der Karte fehlt ein Komma, das die Quelle setzt.
 * Von der Karte stammen damit Reihenfolge, Trennzeichen, Zählung, Schreibung, Artikel und Satzzeichen; belegt ist
 * jedes Wort für sich, die Fundstellen stehen im Beleg. */
const wieKarte = [];
const wkNorm = t => nfc(t).toLowerCase().replace(/\s+/g, ' ').trim();
const WK_ARTIKEL = /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/;
const WK_KUERZEL = [[/(^|\s)etw\.?(?=\s|$)/g, '$1etwas'], [/(^|\s)j(?:md|d)n\.?(?=\s|$)/g, '$1jemanden'], [/(^|\s)j(?:md|d)m\.?(?=\s|$)/g, '$1jemandem'], [/(^|\s)j(?:md|d)s\.?(?=\s|$)/g, '$1jemandes'], [/(^|\s)j(?:md|d)\.?(?=\s|$)/g, '$1jemand']];
// Kürzel ausgeschrieben, Satzzeichen weg; Klammern, Schrägstrich, Komma und der Bindestrich im Wort bleiben
const wkGrund = t => { let x = wkNorm(t); for (const [re, lang] of WK_KUERZEL) x = x.replace(re, lang); return x.replace(/[!?.…"„“”‚‘’':]/g, ' ').replace(/\s+/g, ' ').replace(/(^| )-(?= |$)/g, '$1').replace(/\s+/g, ' ').trim(); };
// nur FREI stehende Klammern: „(Ess)tisch" und „der (all-)Weise" bleiben, wie sie sind
const wkOhneKlammern = t => t.replace(/(^|\s)\([^()]*\)(?=[\s,;\/]|$)/g, '$1').replace(/\s+/g, ' ').trim();
const wkOhnePlatzhalter = t => t.replace(/(^|\s)(?:etwas|jemanden|jemandem|jemandes|jemand)(?=\s|$)/g, '$1').replace(/\s+/g, ' ').trim();
const wkGlieder = text => {
  const aus = [];
  let tiefe = 0, akt = '';
  for (const c of nfc(text).replace(/\(\s*\d+\s*\)/g, ';')) {
    if (c === '(') tiefe++;
    else if (c === ')') tiefe = Math.max(0, tiefe - 1);
    if (tiefe === 0 && (c === '/' || c === ';' || c === ',')) { aus.push(akt); akt = ''; } else akt += c;
  }
  aus.push(akt);
  return aus.map(wkNorm).filter(Boolean);
};
const wkFlach = (text, ohneKlammern) => { let x = wkGrund(nfc(text).replace(/\(\s*\d+\s*\)/g, ' ')); if (ohneKlammern) x = wkOhneKlammern(x); return x.replace(/[,;\/]/g, ' ').replace(/\s+/g, ' ').trim(); };
function wieDieKarte(alt, s, jetzt) {
  if (!alt || !voll(alt.de)) return null;
  const g = wkGlieder(alt.de);
  if (!g.length) return null;
  const verb = alt.type === 'verb';
  const taugt = d => !d.erkl && (!d.sch || d.sch.streng === true);
  // erst die Quellen, zuletzt das Deutsch, das ohnehin dastünde: nennt eine Quelle dasselbe Wort, gewinnt die Quelle
  const kandidaten = (s.deutsch || []).filter(taugt);
  if (jetzt && voll(jetzt.w)) kandidaten.push({ de: jetzt.w, wo: jetzt.wo, q: jetzt.q, ohnehin: true });
  const genau = new Map(), mitArtikel = new Map(), ohneArtikel = new Map(), flach = new Map();
  const merke = (karte, k, d) => { if (k && !karte.has(k)) karte.set(k, d); };
  for (const d of kandidaten) {
    const roh = String(d.de);
    // Beim Deutsch, das ohnehin dastünde, zählt nur, was AUSSERHALB von Klammern steht: in der Klammer steht dort oft ein
    // Zusatz von Claude ohne deutsche Quelle, und der soll nicht mit der Fundstelle des Worts davor zur Karte werden
    // (gesehen an 46830: „willfahren (sich fügen, sich unterwerfen, gehorchen)" wäre als „sich unterwerfen" mit der
    // Fundstelle von „willfahren" dagestanden).
    for (const teil of new Set(d.ohnehin ? [roh, ...wkGlieder(roh)] : [roh, ...roh.split(/\s*[,;\/]\s*/), ...wkGlieder(roh)])) {
      merke(genau, wkNorm(teil), d);
      const g0 = wkGrund(teil);
      for (const k of new Set([g0, wkOhneKlammern(g0)])) for (const k2 of verb ? [k, wkOhnePlatzhalter(k)] : [k]) {
        merke(mitArtikel, k2, d);
        if (WK_ARTIKEL.test(k2)) merke(ohneArtikel, k2.replace(WK_ARTIKEL, ''), d);
      }
    }
    merke(flach, wkFlach(roh, false), d);
    merke(flach, wkFlach(roh, true), d);
  }
  let alleGenau = true;
  const finde = x => {
    if (genau.has(x)) return genau.get(x);
    alleGenau = false;
    const c0 = wkGrund(x);
    for (const c of verb ? [c0, wkOhnePlatzhalter(c0)] : [c0]) {
      if (!c) continue;
      if (mitArtikel.has(c)) return mitArtikel.get(c);
      if (ohneArtikel.has(c)) return ohneArtikel.get(c);
      // Artikel nur auf der Seite der Karte: dann muss die Quelle das Wort OHNE Artikel führen
      if (WK_ARTIKEL.test(c)) { const c1 = c.replace(WK_ARTIKEL, ''); if (c1 && mitArtikel.has(c1)) return mitArtikel.get(c1); }
    }
    return null;
  };
  let treffer = g.map(finde);
  if (treffer.some(t => !t)) {
    const d = flach.get(wkFlach(alt.de, false));
    if (!d) return null;
    treffer = [d]; alleGenau = false;
  }
  const ohnehin = treffer.some(t => t.ohnehin);
  // der Vermerk über einen Zusatz von Claude gilt nur, solange die Karte überhaupt eine Klammer trägt
  const ort = t => t.ohnehin && !nfc(alt.de).includes('(') ? String(t.wo || '').replace(' · der Zusatz in Klammern ist von Claude, ohne deutsche Quelle', '') : t.wo;
  const orte = [...new Set(treffer.map(ort))].slice(0, 4);
  const wie = ohnehin ? 'Wortlaut wie die bisherige Karte: ihre Wörter standen hier schon — anders gesetzt, oder es standen weitere Wörter oder ein Zusatz in Klammern daneben'
    : alleGenau ? 'Wortlaut wie die bisherige Karte: jedes ihrer Wörter nennt die Quelle zu diesem Wort'
      : 'Wortlaut wie die bisherige Karte: die Quelle nennt dieselben Wörter zu diesem Wort — anders sind nur Artikel, Satzzeichen, Platzhalter („etwas“, „jemanden“) oder ein Zusatz der Quelle in Klammern';
  const q = ohnehin ? jetzt.q : treffer.every(t => t.q === 'schluessel') ? 'schluessel' : treffer.some(t => t.sicher !== 'kette') ? 'direkt' : 'kette';
  return { w: nfc(alt.de), wo: orte.join(' · ') + ' · ' + wie, q };
}

const plaetze = [], unterschiede = [], nichtGefunden = [], handFehler = [], verzeichnis = [];
const stand = { erzeugt: new Date().toISOString(), buecher: {} };
let verbformenWeg = 0;
/* EINZAHL UND VERGANGENHEIT SIND OFT DAS WORT SELBST (12.10.2026, Regel von Claude). Ein Nomen steht im Wörterbuch in
 * der Einzahl, ein Verb in der Vergangenheit (3. Person m. Einzahl) — die Karte führt im Feld dann dasselbe Wort noch
 * einmal. Wo ein Platz nicht aus einem Wörterbucheintrag belegt ist (Übersetzungstabelle, arabdict, Buckwalters
 * Liste, Lane), setzte bisher niemand das Feld: gemessen fehlte so die Einzahl an 52 Nomen und die Vergangenheit an
 * 73 Verben, die die bisherige Karte hat. OB das Wort der Karte selbst die Einzahl oder die Vergangenheit ist, sagt
 * die bisherige Karte (ihr Feld nennt ihr eigenes Wort) — sie ist dabei nur die Probe; der WERT ist das Arabisch der
 * Ersatzkarte mit dessen Fundstelle. Führt die bisherige Karte dort ein ANDERES Wort (die Karte trägt eine Mehrzahl
 * oder eine Befehlsform), bleibt das Feld offen. Verglichen wird mit Vokalzeichen, ohne die Schlussendung. */
const gleichesWort = (a, b) => wortform(nfc(a), { artikelWeg: false }) === wortform(nfc(b), { artikelWeg: false });
const SELBST = [['noun', 'sg', 'die Einzahl'], ['verb', 'past', 'die Vergangenheit (3. Person m. Einzahl)']];
const selbst = { sg: 0, past: 0 };
/* GESCHLECHT AUS DER ENDUNG (13.10.2026, Regel von Claude). An 148 Ersatzkarten fehlte das Geschlecht, das die bisherige
 * Karte hat: arabdict, der Buchschlüssel und Buckwalters Liste nennen keines. Ein Nomen, das in der EINZAHL auf Ta marbuta
 * endet, ist weiblich — das ist die Regel der Grammatik, keine Angabe einer Quelle, und so steht es im Beleg.
 * Nachgemessen an den Ersatzkarten dieser Art, deren Geschlecht eine Quelle nennt (ein Wort, die Einzahl der Karte ist
 * das Wort selbst): 562 weiblich, 3 männlich („Kalif", „Rufer", und eine Mehrzahl, die als ihre eigene Einzahl geführt
 * ist). Alle drei führt auch die bisherige Karte als männlich — nennt sie „männlich", bleibt das Feld deshalb offen;
 * sie ist dabei nur der Einspruch, nie die Quelle des Werts. Gilt nur als LÜCKE, nie für eine Fügung, nie für eine
 * Karte ohne Einzahl oder mit einer anderen Einzahl (dann trägt sie eine Mehrzahl). */
const TA_MARBUTA = String.fromCodePoint(0x629);
const ZEICHEN_WEG = new RegExp('[' + String.fromCodePoint(0x64B) + '-' + String.fromCodePoint(0x652) + String.fromCodePoint(0x670) + String.fromCodePoint(0x640) + ']', 'g');
const ENDUNG_WEIBLICH = 'Endung Ta marbuta am Wort in der Einzahl: weiblich. Das ist die Regel der Grammatik, keine Angabe einer Quelle — nachgemessen an 565 Nomen dieser Art, deren Geschlecht eine Quelle nennt: 562 weiblich; die drei anderen führt auch die bisherige Karte als männlich, und dann bleibt das Feld offen. Die Zuordnung stammt von Claude';
const endung = { gesetzt: 0 };
/* WURZEL AUS BUCKWALTERS STAMMLISTE (12.10.2026, Regel von Claude). Die Stammliste (BAMA 1.0, liegt nur lokal) führt
 * ihre Lemmata unter Wurzelzeilen („;--- Wurzel"). Roh taugen die nicht als Quelle — gemessen: an 582 von 2893 Karten
 * mit bekannter Wurzel nennt die Zeile eine andere (sie steht nicht vor jedem Lemma, manche Lemmata hängen unter der
 * Zeile davor; zweilautige Zeilen meinen bald eine verdoppelte, bald eine schwache Wurzel; „w/y" legt sich nicht
 * fest). Sie gilt deshalb nur unter drei Bedingungen, und nur als LÜCKE (nach Wiktionary, Lanes Stichwort, Grundform):
 *   (I)   die Zeile ist (ohne ihre Zählnummer) eine Wurzel aus drei oder vier Radikalen; eine zweilautige zählt nur
 *         als verdoppelte, wenn das Wort den zweiten Radikal sichtbar doppelt führt (zweimal oder mit Schadda)
 *   (II)  ihre Radikale stehen in dieser Reihenfolge in den Buchstaben des Worts (schwache dürfen fehlen)
 *   (III) Lanes Lexikon führt eine Seite dieser Wurzel IN DIESER SCHREIBUNG (abgelegt von ersatz-lane.mjs).
 *         „Führt" heißt: die Seite nennt wenigstens ein Stichwort mit Vokalzeichen (laneFuehrtWurzel). Neun abgelegte
 *         Seiten nennen nur die blanke Wurzel als Verweis auf die andere Schreibung — die zählen nicht.
 *         „In dieser Schreibung" betrifft den schwachen letzten Radikal: Waw und Ya sind bei Lane zwei Seiten. Der WERT
 *         ist immer die Zeile der Stammliste; Lane bestätigt sie nur. Führt Lane die Wurzel allein unter der ANDEREN
 *         Schreibung, widersprechen sich die zwei Quellen, und es gilt keine. (Bis zum 12.10.2026 abends galt dann
 *         Lanes Schreibung, und bei beiden Schreibungen keine. Nachgemessen an 106 Karten, deren Wurzel eine andere
 *         Quelle nennt: so 58 gleich, 7 anders, 41 ohne Entscheidung; mit der Regel hier 95 gleich, 4 anders, 7 ohne.
 *         Der Seitenname sagt beim Alif maqsura nichts über Waw oder Ya — die Seite „nbY" führt ein Verb mit Waw.)
 *         Wurde nach der Seite dieser Schreibung noch NIE gefragt (weder abgelegt noch als „gibt es nicht" gemerkt,
 *         quellen/lane/ohne-seite.json), bleibt die Karte offen und der Schlüssel kommt nach
 *         arbeit/lane-fehlende-seiten.json; „ersatz-lane.mjs --seiten --holen" holt diese Seiten, danach wird neu
 *         gebaut. (Bis dahin fragte dort nur die Wurzel der BISHERIGEN Karte nach Seiten — eine Karte, deren Wurzel
 *         allein die Stammliste nennt, fand nie eine.)
 * Nie für einen Eigennamen (Kategorie der Stammliste, oder die Quelle der Karte führt das Wort als Namen — „Khartum"
 * steht in der Stammliste ohne Artikel als gewöhnliches Nomen) und nie für ein Wort auf Kasratan (schwacher Schluss).
 * Das Lemma muss der Karte gleichen (mit Vokalzeichen, ohne Schlussendung) und zur Wortart passen (Verb zu Verb), und
 * alle solchen Lemmata müssen unter DERSELBEN Zeile stehen. Gemessen mit (I) und (II): 2692 gleich der bekannten
 * Wurzel, 32 gleich bis auf Waw/Ya, 42 anders; mit (III) an den Karten ohne Wurzel: 181 wie der Bestand, 1 anders. */
const BAMA_DATEI = standardDatei(REPO), LANE_SEITEN = path.join(ERSATZ, 'quellen', 'lane', 'seiten');
const bamaNach = new Map();
if (fs.existsSync(BAMA_DATEI)) for (const l of ladeBama(BAMA_DATEI)) { const s = wortform(l.ar, { artikelWeg: false }); (bamaNach.get(s) || bamaNach.set(s, []).get(s)).push(l); }
const RADIKALE = new Set([...">btvjHxd*rzs$SDTZEgfqklmnhwy"]);
const KASRATAN = String.fromCodePoint(0x64D);
const SCHADDA = String.fromCodePoint(0x651), KURZZEICHEN = '[' + String.fromCodePoint(0x64B) + '-' + String.fromCodePoint(0x650) + ']*';
const stammliste = { gesetzt: 0, warten: 0, fehlend: {} };
// Was über Lanes Seite zu einem Schlüssel bekannt ist: „fuehrt" (abgelegt, mit Stichwörtern), „verweist" (abgelegt, nur
// die blanke Wurzel als Verweis), „keine" (der Abruf ergab: gibt es nicht), „unbekannt" (nie danach gefragt)
const laneOhneSeite = liesJson(path.join(ERSATZ, 'quellen', 'lane', 'ohne-seite.json'), {});
const _laneLage = new Map();
function laneSeite(k) {
  if (!_laneLage.has(k)) {
    const datei = path.join(LANE_SEITEN, laneDateiname(k));
    _laneLage.set(k, fs.existsSync(datei) ? (laneFuehrtWurzel(fs.readFileSync(datei, 'utf8')) ? 'fuehrt' : 'verweist') : laneOhneSeite[k] ? 'keine' : 'unbekannt');
  }
  return _laneLage.get(k);
}
function wurzelAusStammliste(ar, typ, id) {
  const wort = nfc(ar);
  // Ein Wort auf Kasratan ist ein Nomen mit schwachem Schluss („ein Feindlicher"): ohne die Endung gliche es einem
  // ANDEREN Lemma (gesehen am 12.10.2026: es bekam die Wurzel von „wiederholt"). Dann gilt die Stammliste nicht.
  if (!bamaNach.size || /\s/.test(wort) || wort.endsWith(KASRATAN)) return null;
  const alle = bamaNach.get(wortform(wort)) || bamaNach.get(wortform(wort, { artikelWeg: false })) || [];
  const passend = alle.filter(l => (typ === 'verb') === !!l.verb);
  // Eigennamen (Länder, Städte) führt die Stammliste auch unter Wurzelzeilen — ein Name hat aber keine Wurzel, die
  // man lernen könnte (Elias, 12.10.2026, zu Ländernamen: „ja wenns keine wurzel gibt dann leer lassen")
  // — erkannt an der Kategorie der Stammliste oder daran, dass ihre englische Bedeutung groß geschrieben ist („Kuwait"
  // steht dort als gewöhnliches Nomen)
  const eigenname = l => l.staemme.some(s => /prop/i.test(s.kat) || /PROP/.test(s.pos)) || (l.glossen.length > 0 && l.glossen.every(g => /^[A-Z]/.test(g)));
  // Ein Funktionswort (Kategorie „FW…" der Stammliste: Fragewort, Partikel, Präposition) steht dort auch unter einer
  // Wurzelzeile, hat aber keine Wurzel — gesehen am 12.10.2026 an „warum nicht …?" (Karte der Wortart „expression").
  // Gesperrt ist nur, wo JEDES passende Lemma ein Funktionswort ist: steht daneben ein Nomen gleicher Schreibung
  // unter derselben Zeile („Seite" neben „neben"), ist es dessen Wurzel.
  const funktionswort = l => l.staemme.some(s => /^FW/.test(s.kat));
  if (passend.some(eigenname) || (passend.length > 0 && passend.every(funktionswort))) return null;
  const zeilen = [...new Set(passend.map(l => l.wurzel).filter(Boolean))];
  if (zeilen.length !== 1) return null;
  const roh = zeilen[0].replace(/\(\d+\)$/, '');
  if (roh.includes('/')) return null;
  let rad = [...roh].map(c => ("'><&}|".includes(c) ? '>' : c));
  const buchstaben = [...nachBW(geruest(wort))];
  if (rad.length === 2) {
    const doppelt = buchstaben.filter(c => c === rad[1]).length >= 2 || new RegExp(ausBW(rad[1]) + KURZZEICHEN + SCHADDA).test(wort);
    if (!doppelt) return null;
    rad = [rad[0], rad[1], rad[1]];
  }
  if (rad.length < 3 || rad.length > 4 || rad.some(c => !RADIKALE.has(c))) return null;
  let i = 0, davor = null;
  for (const r of rad) {
    const schwach = 'wy'.includes(r), hamza = r === '>';
    const trifft = c => c === r || (schwach && 'wyAY'.includes(c)) || (hamza && "'>&}<|A".includes(c));
    let j = i;
    while (j < buchstaben.length && !trifft(buchstaben[j])) j++;
    if (j < buchstaben.length) i = j + 1;
    else if (!(schwach || r === davor)) return null;
    davor = r;
  }
  const eigen = ausBW(rad.join(' '));
  // (III) Es zählen nur die Seiten, deren Name GENAU diese Wurzel ergibt (beim schwachen letzten Radikal also nicht
  // die Seite der anderen Schreibung); der Wert ist die Zeile der Stammliste, Lane bestätigt sie
  const eigene = wurzelSchluessel(eigen).filter(k => wurzelWert(k, eigen) === eigen);
  const seite = eigene.find(k => laneSeite(k) === 'fuehrt');
  if (!seite) {
    // Nach einer Seite dieser Schreibung wurde noch nie gefragt: offen, und der Schlüssel kommt auf die Liste
    const fehlt = eigene.filter(k => laneSeite(k) === 'unbekannt');
    for (const k of fehlt) (stammliste.fehlend[k] = stammliste.fehlend[k] || []).push(String(id));
    if (fehlt.length) stammliste.warten++;
    return null;
  }
  // Führt Lane daneben auch die Wurzel mit dem ANDEREN schwachen Radikal, steht das im Beleg: dort ist die Zeile der
  // Stammliste etwas öfter anders als die Wurzel aus einer dritten Quelle (gemessen 3 von 41, sonst 1 von 58)
  const andere = wurzelSchluessel(eigen).find(k => wurzelWert(k, eigen) && wurzelWert(k, eigen) !== eigen && laneSeite(k) === 'fuehrt');
  return { w: eigen, wo: `Buckwalter Arabic Morphological Analyzer 1.0, Stammliste: das Lemma „${(passend.find(l => !funktionswort(l)) || passend[0]).id}“ steht unter der Wurzelzeile „${zeilen[0]}“, und deren Radikale stehen in dieser Reihenfolge im Wort; Lanes Lexikon führt diese Wurzel (Seite „${seite}“)${andere ? ` — daneben auch die mit dem anderen schwachen Radikal (Seite „${andere}“), hier steht die der Stammliste —` : ''}, nennt das Wort aber nicht als Stichwort. Die Zuordnung über die Stammliste stammt von Claude` };
}
/* Wurzeln aus Lanes Lexikon für Karten, denen keine andere Quelle eine nennt (ersatz-lane.mjs --wurzeln schreibt
 * die Datei; fehlt sie, ändert sich nichts). */
const laneWurzeln = liesJson(path.join(ERSATZ, 'arbeit', 'lane-wurzeln.json'), {}).eintraege || {};
const lane = { eintraege: Object.keys(laneWurzeln).length, gesetzt: 0, hatSchon: 0, anderesWort: 0 };
fs.mkdirSync(path.join(ERSATZ, 'hand'), { recursive: true });

for (const buch of BUECHER) {
  const bestand = ladeBestand(buch);
  const nachId = new Map((bestand || []).map(k => [String(k.id), k]));
  const hand = liesJson(path.join(ERSATZ, 'hand', buch + '.json'), {});
  const saetze = zuordnung.filter(s => s.buch === buch);
  const karten = [], belege = {};
  const z = stand.buecher[buch] = { plaetze: saetze.length, belegt: 0, nichtGefunden: 0, offen: 0, deutschDirekt: 0, deutschKette: 0, deutschTeile: 0, deutschOhneQuelle: 0, vonHand: 0 };
  for (const s of saetze) {
    plaetze.push({ id: s.id, buch, kap: s.kap, platz: s.platz });
    const h = hand[s.id] || {};
    const felder = {};
    // Stufe mit Stern: der Eintrag der Quelle hat eine ANDERE Wortart als die Karte (etwa das Verb zu einer Karte, die
    // dessen Befehlsform als Ausruf führt). Dann stimmen die Formen nicht von selbst — übernommen wird erst, wenn die
    // Hand es mit „artOk" bestätigt. Gefunden am 11.10.2026 an „tafaddal": ohne diese Sperre stünde die Vergangenheit da.
    if (s.vorschlag && (!String(s.stufe).includes('*') || h.artOk === true)) for (const f of FELDER) if (s.vorschlag[f] && voll(s.vorschlag[f].w)) felder[f] = { w: nfc(s.vorschlag[f].w), wo: s.vorschlag[f].wo, q: s.vorschlag[f].q || 'enwikt' };
    const de = deutschAus(s);
    if (de) felder.de = de;
    // Hand: „de" nennt die deutschen Wörter, die aus den Kandidaten der Quellen gelten sollen (die Fundstellen kommen von dort);
    // „deEigen" ist ein Deutsch ohne deutsche Quelle, von Claude nach der englischen Bedeutung der Quelle geschrieben.
    if (Array.isArray(h.de) && h.de.length) {
      const orte = [], fehlend = [];
      let direkt = false, nurSchluessel = true;
      for (const wort of h.de) {
        const k = (s.deutsch || []).filter(d => !d.erkl && d.de === wort);
        const beste = k.find(d => d.sicher === 'vokalisiert') || k.find(d => d.sicher === 'kette') || k[0];
        if (!beste) { fehlend.push(wort); continue; }
        if (beste.sicher !== 'kette') direkt = true;
        if (beste.q !== 'schluessel') nurSchluessel = false;
        if (orte.length < 4) orte.push(beste.wo);
      }
      if (fehlend.length) { handFehler.push(`${buch} ${s.id}: „${fehlend.join('“, „')}“ steht nicht unter den Kandidaten der Quellen`); }
      else {
        felder.de = { w: h.de.join(', '), wo: orte.join(' · '), q: nurSchluessel ? 'schluessel' : direkt ? 'direkt' : 'kette' };
        // „deZusatz": eine Erklärung in Klammern hinter dem belegten Wort; sie ist von Claude und steht so im Beleg
        if (voll(h.deZusatz)) { felder.de.w += ` (${nfc(h.deZusatz)})`; felder.de.wo += ' · der Zusatz in Klammern ist von Claude, ohne deutsche Quelle'; }
      }
    } else if (h.deTeile && voll(h.deTeile.w)) {
      // Fügung: das Deutsch ist von Claude aus den deutschen Wörtern gebaut, die die Quellen zu den einzelnen Teilen nennen
      // … oder aus dem Deutsch, das die Quellen zur GRUNDFORM nennen (die Karte führt deren Mehrzahl oder weibliche Form)
      const bekannt = new Set([...(s.teile || []).flatMap(t => t.de || []), ...(s.deutsch || []).filter(d => !d.erkl).map(d => d.de)]);
      const teile = h.deTeile.teile || [];
      const fehlt = teile.filter(t => !bekannt.has(t));
      const ausGrundform = teile.length && teile.every(t => (s.deutsch || []).some(d => d.de === t));
      if (!teile.length || fehlt.length) handFehler.push(`${buch} ${s.id}: deTeile nennt ${teile.length ? '„' + fehlt.join('“, „') + '“, das steht bei keinem Teil der Fügung und unter keinem Kandidaten' : 'keine Teile'}`);
      else felder.de = { w: nfc(h.deTeile.w), wo: (ausGrundform ? 'von Claude gebildet aus den deutschen Wörtern, die die Quellen zu diesem Wort oder seiner Grundform nennen: ' : 'von Claude zusammengesetzt aus den deutschen Wörtern, die die Quellen zu den Teilen der Fügung nennen: ') + teile.map(t => `„${t}“`).join(', '), q: 'teile' };
    } else if (voll(h.deEigen)) {
      const en = ((s.vorschlag && s.vorschlag._en) || []).slice(0, 2).join(' ; ');
      // Stufe „W": das Wort steht nur im französischen Wiktionary; dann ist dessen Bedeutung die Vorlage
      const fr = ((s.vorschlag && s.vorschlag._fr) || []).slice(0, 2).join(' ; ');
      felder.de = { w: nfc(h.deEigen), wo: 'ohne deutsche Quelle — von Claude geschrieben' + (en ? ` nach der englischen Bedeutung in ${s.ref ? 'en.wiktionary „' + s.ref.split('#')[0] + '“' : 'der Quelle'}: „${en}“` : fr ? ` nach der französischen Bedeutung im fr.wiktionary: „${fr}“` : ''), q: 'claude' };
    }
    for (const [f, wert] of Object.entries(h.felder || {})) if (FELDER.includes(f) && wert && voll(wert.w)) felder[f] = { w: nfc(wert.w), wo: wert.wo, q: wert.q || 'hand' };
    // Die Wurzel aus Lanes Lexikon (ersatz-lane.mjs --wurzeln) füllt nur eine LÜCKE: nennt eine andere Quelle oder die
    // Hand eine Wurzel, bleibt die. Und sie gilt nur, solange das Arabisch der Karte noch das Wort ist, das dort als
    // Stichwort gefunden wurde -- ändert sich die Karte, fehlt die Wurzel wieder, bis neu nachgesehen ist.
    // „leer" von Hand (nächste Zeile) nimmt auch sie wieder heraus.
    {
      const lw = laneWurzeln[s.id];
      if (lw && voll(lw.w)) {
        // Eine Wurzel, die nur über die Grundform gefunden ist („enwikt-grundform", ersatz-zuordnen.mjs), ist ein
        // Schluss; das Stichwort bei Lane nennt das Wort selbst und geht ihr vor.
        if (felder.root && felder.root.q !== 'enwikt-grundform') lane.hatSchon++;
        else if (!felder.ar || nfc(felder.ar.w) !== nfc(lw.ar)) lane.anderesWort++;
        else { felder.root = { w: nfc(lw.w), wo: lw.wo, q: 'lane' }; lane.gesetzt++; }
      }
    }
    // Wurzel aus Buckwalters Stammliste (wurzelAusStammliste, oben): nur als Lücke, nur für ein einzelnes Wort, nie für ein Partikel
    // — und nie für einen NAMEN: führt die Quelle der Karte das Wort als Namen (Wortart „name" des Wiktionary-Eintrags),
    // hat es keine Wurzel, die man lernen könnte (Elias, 12.10.2026, zu Ländernamen: „ja wenns keine wurzel gibt dann
    // leer lassen"). Gesehen am selben Abend: „Khartum" — die Stammliste führt ohne Artikel ein gewöhnliches Nomen
    // gleicher Schreibung, und Lane führt dessen Wurzel.
    const quelleIstName = String(s.ref || '').split('#')[1] === 'name';
    if (!felder.root && felder.ar && felder.type && felder.type.w !== 'particle' && !quelleIstName && !(h.leer || []).includes('root')) {
      const b = wurzelAusStammliste(felder.ar.w, felder.type.w, s.id);
      if (b) { felder.root = { w: b.w, wo: b.wo, q: 'bama-wurzel' }; stammliste.gesetzt++; }
    }
    // Einzahl und Vergangenheit als das Wort selbst (SELBST, oben): füllt nur eine Lücke; „leer" von Hand nimmt es wieder heraus
    {
      const altK = nachId.get(s.id);
      if (altK && felder.ar && felder.type) for (const [typ, f, was] of SELBST) {
        if (felder.type.w !== typ || felder[f] || !voll(altK[f]) || (h.leer || []).includes(f)) continue;
        if (!gleichesWort(altK[f], altK.ar) || !gleichesWort(felder.ar.w, altK[f])) continue;
        felder[f] = { w: felder.ar.w, wo: `${felder.ar.wo} — ${was} ist das Wort selbst`, q: felder.ar.q };
        selbst[f]++;
      }
      // Geschlecht aus der Endung (ENDUNG_WEIBLICH, oben): nur als Lücke, nur am Wort in der Einzahl, nie gegen ein
      // „männlich" der bisherigen Karte
      if (felder.type && felder.type.w === 'noun' && !felder.gender && felder.ar && felder.sg && !(h.leer || []).includes('gender')
        && !/\s/.test(nfc(felder.ar.w).trim()) && gleichesWort(felder.sg.w, felder.ar.w)
        && nfc(felder.ar.w).replace(ZEICHEN_WEG, '').trim().endsWith(TA_MARBUTA) && !(altK && altK.gender === 'masculine')) {
        felder.gender = { w: 'feminine', wo: ENDUNG_WEIBLICH, q: 'endung' };
        endung.gesetzt++;
      }
    }
    for (const f of h.leer || []) delete felder[f];
    // „Wie die Karte" (siehe wieDieKarte oben): gilt für jeden Platz, auch nach einer Entscheidung von Hand — nennen die
    // Quellen genau die Wörter der Karte, ist deren Wortlaut das Ziel.
    {
      const wk = wieDieKarte(nachId.get(s.id), s, felder.de);
      if (wk && (!felder.de || nfc(felder.de.w) !== wk.w)) { wieKarte.push({ id: s.id, buch, vorher: felder.de ? felder.de.w : null, jetzt: wk.w }); felder.de = wk; }
    }
    // Verbformen stehen nur an Verben. Im Bestand trägt keine andere Karte Vergangenheit, Gegenwart, Befehlsform oder
    // Masdar (gemessen 12.10.2026: 0 von 4433), und der Satzzerleger der App liest jede Form als Lexikoneintrag mit der
    // Wortart der Karte: eine Fügung mit der Gegenwart „er betet" machte aus dem Verb im Satz eine Aussage
    // (pruefe-saetze.js, Satz by1-48-1). Die Regel stammt von Claude.
    if (felder.type && felder.type.w !== 'verb') for (const f of ['past', 'present', 'imperative', 'masdar']) if (felder[f]) { delete felder[f]; verbformenWeg++; }
    if (Object.keys(h).length) z.vonHand++;
    let status = 'offen', grund = h.grund;
    if (h.status === 'nicht-gefunden') status = 'nicht-gefunden';
    else if (felder.ar && felder.de && felder.type) status = 'belegt';
    else grund = [!felder.ar && 'Arabisch fehlt', !felder.de && 'Deutsch fehlt', !felder.type && 'Wortart fehlt'].filter(Boolean).join(', ') + ` (Stufe ${s.stufe})`;
    belege[s.id] = { status, grund: status === 'belegt' ? undefined : grund, stufe: s.stufe, eintrag: s.ref, felder: status === 'belegt' ? Object.fromEntries(Object.entries(felder).map(([f, x]) => [f, { wo: x.wo, q: x.q }])) : undefined };
    if (status === 'nicht-gefunden') { z.nichtGefunden++; nichtGefunden.push({ id: s.id, buch, kap: s.kap, platz: s.platz, grund: grund || 'ohne Angabe' }); continue; }
    if (status !== 'belegt') { z.offen++; continue; }
    z.belegt++;
    // Sorten des deutschen Belegs: direkt (eine Quelle nennt arabisches und deutsches Wort zusammen) · kette (über das
    // Englische) · teile (von Claude aus belegten Teilen zusammengesetzt) · alles andere gilt als „ohne deutsche Quelle"
    if (DIREKT.includes(felder.de.q)) z.deutschDirekt++;
    else if (felder.de.q === 'kette') z.deutschKette++;
    else if (felder.de.q === 'teile') z.deutschTeile++;
    else z.deutschOhneQuelle++;
    const karte = { id: s.id };
    for (const f of ['ar', 'de', 'type']) karte[f] = felder[f].w;
    karte.chapter = s.kap;
    for (const f of ['gender', 'sg', 'pl', 'femSg', 'femPl', 'root', 'past', 'present', 'imperative', 'masdar', 'note']) karte[f] = felder[f] ? felder[f].w : null;
    karte.book = buch; karte.source = 'ersatz';
    karten.push(karte);
    // Unterschiede zum Bestand: markieren, nicht entscheiden (Elias, 29.07.2026)
    const alt = nachId.get(s.id);
    if (alt) for (const f of FELDER) {
      if (f === 'de' || f === 'note') continue;
      const neu = karte[f], war = alt[f];
      if (!voll(neu) && !voll(war)) continue;
      if (voll(neu) && voll(war) && nfc(neu) === nfc(war)) continue;
      const art = !voll(neu) ? 'fehlt im Ersatz' : !voll(war) ? 'nur im Ersatz' : (s.vergleich && s.vergleich[f]) || 'anders';
      unterschiede.push({ id: s.id, buch, kap: s.kap, feld: f, art, ersatz: voll(neu) ? neu : null, bisher: voll(war) ? war : null });
    }
    if (alt && nfc(karte.de).toLowerCase() !== nfc(alt.de).toLowerCase()) unterschiede.push({ id: s.id, buch, kap: s.kap, feld: 'de', art: 'anderer Wortlaut', ersatz: karte.de, bisher: alt.de });
  }
  schreibe(path.join(ERSATZ, 'vokabeln-' + buch + '.js'),
    `/* Ersatzdatenbank, Buch ${buch}: ${karten.length} von ${saetze.length} Plätzen. Erzeugt von werkzeuge/ersatz-bauen.mjs —\n   nicht von Hand ändern. Fundstellen je Angabe: belege-${buch}.json. */\n(window.VOKABELN = window.VOKABELN || {})[${JSON.stringify(buch)}] = ${JSON.stringify(karten, null, 0).replace(/\},\{/g, '},\n{')};\n`);
  schreibe(path.join(ERSATZ, 'belege-' + buch + '.json'), JSON.stringify(belege, null, 1));
  // Kapitel: wie viele es unter den Plätzen gibt, und wie viele davon mindestens eine Karte bekommen haben
  z.kapitelPlaetze = new Set(saetze.map(s => s.kap)).size;
  z.kapitel = new Set(karten.map(k => k.chapter)).size;
  if (karten.length) verzeichnis.push({ slug: buch, vokabeln: karten.length, kapitel: z.kapitel, datei: 'data/vokabeln-' + buch + '.js' });
}
/* Das Verzeichnis gehört zu den Buchdateien wie data/buecher.js zum Bestand: die App liest daraus, welche Bücher es
 * gibt, und zeigt Karten- und Kapitelzahl je Buch; baue-vokabelpaket.mjs bricht ab, wenn die Zahl nicht zur Datei passt.
 * „datei" nennt den Ort NACH einem Wechsel (data/…), denn dort sucht die App die Buchdateien. Reihenfolge wie im
 * Bestand: nach Kürzel. Ein Buch ohne eine einzige belegte Karte steht nicht darin. */
verzeichnis.sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
if (verzeichnis.length) schreibe(path.join(ERSATZ, 'buecher.js'),
  `/* Verzeichnis der Ersatzdatenbank, im Format von data/buecher.js. Erzeugt von werkzeuge/ersatz-bauen.mjs —\n   nicht von Hand ändern. Die Zahlen nennen, was in den Buchdateien daneben wirklich steht. */\nconst BUECHER = ${JSON.stringify(verzeichnis, null, 1)};\n`);
if (plaetze.length) schreibe(path.join(ERSATZ, 'plaetze.json'), JSON.stringify(plaetze));
schreibe(path.join(ERSATZ, 'nicht-gefunden.json'), JSON.stringify(nichtGefunden, null, 1));
schreibe(path.join(ERSATZ, 'unterschiede.json'), JSON.stringify(unterschiede, null, 1));
// Die Unterschiede nach Feld und Art gezählt (die Liste selbst bleibt in der Reihenfolge der Plätze): so sieht man,
// wo die Arbeit liegt — z. B. wie viele Karten im Arabischen selbst abweichen und wie viele nur in der Schlussendung.
stand.laneWurzeln = lane;
stand.stammliste = { gesetzt: stammliste.gesetzt, warten: stammliste.warten, fehlendeSeiten: Object.keys(stammliste.fehlend).length };
// Die Schlüssel der Wurzelseiten, nach denen bei Lane noch nie gefragt wurde (wurzelAusStammliste, oben) — immer
// geschrieben, auch leer: sonst holte „ersatz-lane.mjs --seiten" nach einem späteren Bau die Liste von gestern.
schreibe(path.join(ERSATZ, 'arbeit', 'lane-fehlende-seiten.json'), JSON.stringify({
  erzeugt: stand.erzeugt,
  hinweis: 'Wurzelseiten von Lanes Lexikon, nach denen noch nie gefragt wurde, je Schlüssel (Buckwalter-Umschrift) die Karten, die darauf warten. Erzeugt von werkzeuge/ersatz-bauen.mjs, gelesen von werkzeuge/ersatz-lane.mjs --seiten. Nicht von Hand ändern.',
  schluessel: stammliste.fehlend,
}, null, 1));
stand.unterschiede ={ gesamt: unterschiede.length, jeFeld: {} };
for (const u of unterschiede) { const f = stand.unterschiede.jeFeld[u.feld] = stand.unterschiede.jeFeld[u.feld] || {}; f[u.art] = (f[u.art] || 0) + 1; }
schreibe(path.join(ERSATZ, 'stand.json'), JSON.stringify(stand, null, 1));
// lokal, zum Nachlesen: an welchen Plätzen „wie die Karte" das Deutsch bestimmt hat, und was vorher dastand
schreibe(path.join(ERSATZ, 'arbeit', 'wie-karte.json'), JSON.stringify(wieKarte, null, 1));
console.log('Deutsch im Wortlaut der bisherigen Karte, weil die Quellen genau diese Wörter nennen: ' + wieKarte.length + ' Plätze geändert (Liste: data-ersatz/arbeit/wie-karte.json)');

const sum = { plaetze: 0, belegt: 0, nichtGefunden: 0, offen: 0, deutschDirekt: 0, deutschKette: 0, deutschTeile: 0, deutschOhneQuelle: 0 };
for (const buch of BUECHER) {
  const z = stand.buecher[buch];
  for (const k of Object.keys(sum)) sum[k] += z[k];
  if (!process.argv.includes('--knapp')) console.log(`${buch}: ${z.belegt} von ${z.plaetze} belegt · ${z.offen} offen · ${z.nichtGefunden} nicht gefunden · Deutsch direkt ${z.deutschDirekt}, über das Englische ${z.deutschKette}, ohne deutsche Quelle ${z.deutschOhneQuelle}`);
}
if (!process.argv.includes('--knapp')) for (const f of FELDER) {
  const arten = stand.unterschiede.jeFeld[f];
  if (arten) console.log(`Unterschiede ${f}: ${Object.values(arten).reduce((a, b) => a + b, 0)} (${Object.entries(arten).sort((a, b) => b[1] - a[1]).map(([art, n]) => art + ' ' + n).join(' · ')})`);
}
if (verbformenWeg) console.log(`Verbformen an Karten, die keine Verben sind, weggelassen: ${verbformenWeg}`);
if (stammliste.gesetzt) console.log(`Wurzel aus Buckwalters Stammliste (Lane führt die Wurzel, nennt das Wort aber nicht): ${stammliste.gesetzt} eingetragen`);
if (stammliste.warten) console.log(`Wurzel aus der Stammliste OFFEN an ${stammliste.warten} Karten: nach ${Object.keys(stammliste.fehlend).length} Wurzelseiten von Lane wurde noch nie gefragt — „node werkzeuge/ersatz-lane.mjs --seiten --holen“, danach neu bauen (Liste: data-ersatz/arbeit/lane-fehlende-seiten.json)`);
if (endung.gesetzt) console.log(`Geschlecht aus der Endung (Ta marbuta am Wort in der Einzahl, keine Quelle nennt es): ${endung.gesetzt} Nomen weiblich`);
if (selbst.sg || selbst.past) console.log(`Das Wort selbst: Einzahl an ${selbst.sg} Nomen und Vergangenheit an ${selbst.past} Verben gesetzt (die bisherige Karte nennt dort ihr eigenes Wort)`);
if (lane.eintraege) console.log(`Wurzeln aus Lanes Lexikon: ${lane.gesetzt} eingetragen · ${lane.hatSchon} übergangen, weil eine andere Quelle die Wurzel nennt · ${lane.anderesWort} übergangen, weil das Arabisch der Karte nicht mehr das Stichwort ist (von ${lane.eintraege} Einträgen in data-ersatz/arbeit/lane-wurzeln.json)`);
if (handFehler.length) { console.log(`HAND:${handFehler.length} Entscheidung(en) passen nicht zu den Quellen:`); for (const f of handFehler.slice(0, 20)) console.log('  ✗ ' + f); process.exitCode = 1; }
console.log(`GEBAUT: ${sum.belegt} von ${sum.plaetze} Plätzen belegt · ${sum.offen} offen · ${sum.nichtGefunden} nicht gefunden · Deutsch direkt ${sum.deutschDirekt}, über das Englische ${sum.deutschKette}, aus belegten Teilen ${sum.deutschTeile}, ohne deutsche Quelle ${sum.deutschOhneQuelle} · Unterschiede zum Bestand: ${unterschiede.length}`);
