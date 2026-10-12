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
 * Aufruf (aus dem Repo-Wurzelverzeichnis):  node werkzeuge/ersatz-bauen.mjs [--knapp]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

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
function ladeBestand(buch) {
  const datei = path.join(REPO, 'data', 'vokabeln-' + buch + '.js');
  if (!fs.existsSync(datei)) return null;
  const fenster = {};
  vm.runInContext(fs.readFileSync(datei, 'utf8'), vm.createContext({ window: fenster }), { filename: datei });
  return fenster.VOKABELN[buch];
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
 *     Ein Zusatz, den nur die KARTE führt („Stern (Himmelskörper)"), zählt NICHT: er steht in keiner Quelle. Ob er
 *     von der Karte kommen darf, entscheidet Elias (offene Frage, Stand 12.10.2026).
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
stand.unterschiede = { gesamt: unterschiede.length, jeFeld: {} };
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
if (handFehler.length) { console.log(`HAND:${handFehler.length} Entscheidung(en) passen nicht zu den Quellen:`); for (const f of handFehler.slice(0, 20)) console.log('  ✗ ' + f); process.exitCode = 1; }
console.log(`GEBAUT: ${sum.belegt} von ${sum.plaetze} Plätzen belegt · ${sum.offen} offen · ${sum.nichtGefunden} nicht gefunden · Deutsch direkt ${sum.deutschDirekt}, über das Englische ${sum.deutschKette}, aus belegten Teilen ${sum.deutschTeile}, ohne deutsche Quelle ${sum.deutschOhneQuelle} · Unterschiede zum Bestand: ${unterschiede.length}`);
