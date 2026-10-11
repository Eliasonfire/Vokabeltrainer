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
schreibe(path.join(ERSATZ, 'stand.json'), JSON.stringify(stand, null, 1));

const sum = { plaetze: 0, belegt: 0, nichtGefunden: 0, offen: 0, deutschDirekt: 0, deutschKette: 0, deutschTeile: 0, deutschOhneQuelle: 0 };
for (const buch of BUECHER) {
  const z = stand.buecher[buch];
  for (const k of Object.keys(sum)) sum[k] += z[k];
  if (!process.argv.includes('--knapp')) console.log(`${buch}: ${z.belegt} von ${z.plaetze} belegt · ${z.offen} offen · ${z.nichtGefunden} nicht gefunden · Deutsch direkt ${z.deutschDirekt}, über das Englische ${z.deutschKette}, ohne deutsche Quelle ${z.deutschOhneQuelle}`);
}
if (verbformenWeg) console.log(`Verbformen an Karten, die keine Verben sind, weggelassen: ${verbformenWeg}`);
if (handFehler.length) { console.log(`HAND:${handFehler.length} Entscheidung(en) passen nicht zu den Quellen:`); for (const f of handFehler.slice(0, 20)) console.log('  ✗ ' + f); process.exitCode = 1; }
console.log(`GEBAUT: ${sum.belegt} von ${sum.plaetze} Plätzen belegt · ${sum.offen} offen · ${sum.nichtGefunden} nicht gefunden · Deutsch direkt ${sum.deutschDirekt}, über das Englische ${sum.deutschKette}, aus belegten Teilen ${sum.deutschTeile}, ohne deutsche Quelle ${sum.deutschOhneQuelle} · Unterschiede zum Bestand: ${unterschiede.length}`);
