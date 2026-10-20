#!/usr/bin/env node
/* pruefe-plural.mjs — der Prüfer für die Mehrzahl auf seinen Karten
 * ==========================================================================
 *
 * Elias, 14.10.2026: „ich glaube wir brauchen einen prüfer auch für plural dann
 * jetzt, passe die routinen warhscheinlich an oder" — kurz nachdem die Mehrzahl
 * nicht mehr hinter Schaltern steht (v685, sein Satz: „plural soll nciht hinter
 * schaltern versteckt sein"). Seitdem steht der Formen-Block immer auf der
 * Lernkarte, ab Kasten 4 verlangt das zweite Tippfeld bei regelmäßiger Mehrzahl
 * die Form (seit 20.10.2026 nur mit seinem Schalter „Mehrzahl mit eintippen",
 * Voreinstellung aus), und die acht weit entfernten (PLURAL_FERN in js/kern.js) haben immer
 * eine eigene Karte. Ein falsches Feld `pl` landet also sofort bei ihm.
 *
 * GEPRÜFT WIRD SEIN BESTAND, so wie die App ihn baut: vocab-data.js, die Kapitel
 * seiner Auswahl (.stand-app.json, fehlt sie: data/lernstand.json) über die
 * ECHTE einhaengen() aus js/buecher.js samt Schreibweisen, die Nachträge
 * (wendeFeldErgaenzungenAn, vor und nach jedem Buch wie in der App), die
 * bestellten Fachbegriffe, seine selbst angelegten Wörter und die einzeln
 * freigeschalteten. Die Gruppe „Koran häufigste" kommt in Teil A und B immer
 * mit: es sind unsere eigenen Daten, und er kann sie jederzeit anhaken.
 * ⚠️ Was er auf dem Gerät selbst an einer Karte geändert hat
 * (wendeWortAenderungenAn), liegt nur in seinem Browser — das sieht hier nichts.
 *
 * DIE FÜNF TEILE (A bis D sind die Fragen, die ihm am 14.10.2026 genannt wurden):
 *
 *  A  Schreibweise (Tor). Jede Form im Feld `pl` hat arabische Buchstaben, keinen
 *     Platzhalter (Wiktionary schreibt „+f" für „regelmäßig, bitte selbst bilden",
 *     siehe eiche-plural-beleg.mjs), keine leere Teilform, ist nicht dieselbe Form
 *     wie die Einzahl — und ihre Buchstaben sind so zusammengesetzt wie in NFC.
 *     Das Tippfeld (pruefeTippen in js/lernen.js) vergleicht OHNE Normalisierung:
 *     steht Alif und ein Hamza-Zeichen als zwei Zeichen da, sagt es bei richtiger
 *     Eingabe „noch nicht". Eine andere REIHENFOLGE von Schadda und Vokal ist kein
 *     Befund: gleiche Anzeige, und das Tippfeld nimmt die Zeichen ohnehin weg
 *     (gemessen 14.10.2026: 28 solche Felder in den Buchdaten — ar, sg und pl —, alle
 *     nur Reihenfolge; davon 7 Mehrzahlen, die zählt dieser Prüfer).
 *
 *  B  „regelmäßig" (Tor). Was regelmäßig ist, entscheidet uebPluralArt()
 *     (js/uebung.js) am Gerüst ohne Vokalzeichen. Hier wird der vokalisierte
 *     Stamm nachgesehen: bei regelmäßig männlicher Mehrzahl ('m') muss die
 *     Mehrzahl genau der Stamm der Einzahl plus ـُون sein — sonst steht
 *     „regelmäßig" über einer anders vokalisierten Form, und eines der beiden
 *     Felder ist falsch. Bei regelmäßig weiblicher ('f') darf sich ein Vokal im
 *     Stamm ändern (وَحْدَةٌ → وَحَدَاتٌ ist richtig): nur ein Hinweis.
 *
 *  C  Kandidaten für PLURAL_FERN (Hinweis). Eine nicht regelmäßige Mehrzahl, für
 *     die keine andere seiner Karten denselben Klang hat (pluralKlangPartner),
 *     und die noch niemand angesehen hat (PLURAL_FERN oder GESEHEN unten).
 *     „Weit entfernt" erkennt keine Regel — die Liste wächst nur auf sein Wort.
 *
 *  D  Vokalzeichen der Mehrzahl (Hinweis). Die Erkennung steht in
 *     pruefe-taschkil.js und wird NICHT nachgebaut: dessen Befunde (--json),
 *     nur Feld pl, nur seine Karten, nur was die App noch so zeigt. Für unsere
 *     eigenen Daten sperrt pruefe-taschkil.js selbst; die Buchdaten sind
 *     fremde Daten und werden dort nur berichtet.
 *
 *  E  Nomen ohne Mehrzahl (Hinweis), ohne erklärte Ausnahme in
 *     data/feld-ausnahmen.js. vorrat.mjs fragt dasselbe in den Kapiteln seines
 *     Fensters; einzeln freigeschaltete Wörter liegen außerhalb und standen bis
 *     heute bei niemandem (gemessen 14.10.2026: zwei).
 *
 * Aufruf:   node werkzeuge/pruefe-plural.mjs
 * Exit 0  = kein Befund in A oder B in unseren Daten (Hinweise sind möglich)
 *      1  = das Werkzeug selbst ist kaputt: eine Eichprobe greift nicht, der
 *           Quelltext ist nicht ausschneidbar, Daten fehlen
 *      2  = ein Befund in A oder B in UNSEREN Daten (vocab-data.js, Nachträge,
 *           Schreibweisen, Koran häufigste, Fachbegriffe, seine Wörter) — vor dem
 *           Ausliefern beheben, und nur mit Beleg.
 * Befunde in den Buchdaten (sein arabicroots-Abzug) färben den Exit NICHT, wie in
 * pruefe-taschkil.js: es sind fremde Daten, und eine Korrektur braucht einen
 * Beleg. Sie stehen unter „Für die Wartung" (Schritt „Mehrzahl prüfen" in
 * Automation/prompts/vokabeltrainer-wartung.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = p => fs.readFileSync(path.join(REPO, p), 'utf8');
const Z = c => String.fromCodePoint(c);

let werkzeugFehler = 0;
const kaputt = text => { werkzeugFehler++; console.log('  ⛔ WERKZEUG: ' + text); };

function schneideFunktion(quelle, kopf){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  let tiefe = 0;
  for (let i = quelle.indexOf('{', a); i >= 0 && i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) return quelle.slice(a, i + 1); }
  }
  throw new Error('kein Ende gefunden: ' + kopf);
}
function schneideBis(quelle, kopf, ende){
  const a = quelle.indexOf(kopf);
  if (a < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  const b = quelle.indexOf(ende, a);
  if (b < 0) throw new Error('Ende nicht gefunden: ' + kopf);
  return quelle.slice(a, b + ende.length);
}
const zeile = (quelle, anfang) => schneideBis(quelle, anfang, '\n');

/* ---------- Schon angesehen: damit Teil C nur NEUES meldet ----------
   Stand 13.10.2026 (Paket A3; To-Do Vokabeltrainer, Übergabe vom 13.10.2026,
   Abschnitt 10): 30 Karten ohne Klang-Partner. Acht davon stehen in PLURAL_FERN
   (js/kern.js) und deshalb hier NICHT. Die übrigen:
     'wartet' = Grenzfall — ER entscheidet, ob er dazugehört (ihm am 13.10. vorgelegt)
     'nah'    = die Mehrzahl sieht der Einzahl ähnlich — MEINE Einordnung (Claude),
                ihm am 13.10. genannt
   Entscheidet er einen 'wartet': weit → in PLURAL_FERN (mit Eselsbrücke, siehe
   test-plural-fern.mjs) und hier heraus; nah → 'nah'.
   ⛔ Nur Karten-IDs, kein Karteninhalt: die meisten Karten stammen aus seinem
   arabicroots-Abzug. Welche Wörter es sind, sagt die Ausgabe und die To-Do. */
const GESEHEN = {
  /* Grenzfälle vom 13.10.2026 (Tochter, Schwester auf zwei Karten, Ohr, Kamelstute, Bett, Arzt, krank) */
  '46005': 'wartet', 'madina1-l6-ucht': 'wartet', '45986': 'wartet', '45855': 'wartet',
  '45862': 'wartet', '45758': 'wartet', '45761': 'wartet', '45807': 'wartet',
  /* nah, 13.10.2026 */
  '45767': 'nah', '45863': 'nah', '45865': 'nah', '46010': 'nah', '45759': 'nah', '45780': 'nah', '45803': 'nah',
  '45822': 'nah', '48611': 'nah', '45773': 'nah', '45876': 'nah', '45993': 'nah', '46032': 'nah', '45912': 'nah',
  /* 14.10.2026, der erste Lauf dieses Prüfers fand drei neue (die Messung vom 13.10. kannte die Nachträge nicht):
     45908 'nah' — MEINE Einordnung: seine Mehrzahl ist die seiner Karte 45817 und das Adjektiv dahinter.
     45841 und p_1787185012359 (ein selbst angelegtes Wort) 'wartet' — ihm in die To-Do gelegt. */
  '45908': 'nah', '45841': 'wartet', 'p_1787185012359': 'wartet',
};

/* ---------- Zeichen, als Codepunkte (nichts Arabisches getippt) ---------- */
const MARKE_ALLE = new RegExp('[' + Z(0x64B) + '-' + Z(0x652) + Z(0x670) + ']');
const ENDVOKAL = new RegExp('[' + Z(0x64B) + '-' + Z(0x650) + Z(0x652) + ']');
/* Wie `roh` in pruefeTippen() (js/lernen.js): Vokalzeichen, Alif chandschariyya und Tatwil weg, sonst nichts. */
const APP_ZEICHEN = new RegExp('[' + Z(0x64B) + '-' + Z(0x652) + Z(0x670) + Z(0x640) + ']', 'g');
const rohWieApp = s => String(s || '').replace(APP_ZEICHEN, '');
const gerust = s => rohWieApp(String(s || '').normalize('NFC'));
const BUCHSTABE = new RegExp('[' + Z(0x621) + '-' + Z(0x63A) + Z(0x641) + '-' + Z(0x64A) + ']');
const FREMD = /[A-Za-z0-9+=?]/;
const ARTIKEL = Z(0x627) + Z(0x644);
const TA_MARBUTA = Z(0x629);
const ENDUNG_M = Z(0x64F) + Z(0x648) + Z(0x646);   /* ـُون */
const ENDUNG_F = Z(0x627) + Z(0x62A);              /* ـات */
const TEILER = /\s*[|/]\s*/;

/* Die Form ohne ihre Endung: am letzten Buchstaben fallen Kasusvokal, Tanwin und Sukun
   weg, eine Schadda bleibt (حَارٌّ → حَارّ). Am 14.10.2026 hat die erste Messung genau
   das falsch gemacht und حَارٌّ → حَارُّونَ als Befund gemeldet — Eichprobe 5 hält es fest. */
function ohneEndung(s){
  const z = [...String(s || '').normalize('NFC').trim()];
  let i = z.length;
  while (i > 0 && MARKE_ALLE.test(z[i - 1])) i--;
  return (z.slice(0, i).join('') + z.slice(i).filter(c => !ENDVOKAL.test(c)).join('')).normalize('NFC');
}

/* ---------- Die echten Funktionen der App ---------- */
function pluralWelt(){
  const kern = lies('js/kern.js'), uebung = lies('js/uebung.js'), saetze = lies('js/saetze.js');
  const teile = [
    zeile(kern, 'const ZAHLWORT_DE = '), schneideFunktion(kern, 'function istZahlwort('),
    zeile(kern, 'const PLURAL_MARKE = '), schneideFunktion(kern, 'function istPluralKarte('),
    zeile(kern, 'const FORM_TRENNER = '), schneideFunktion(kern, 'function formen('),
    schneideBis(kern, 'const PL_Z = c =>', '\n  return aus;\n}'),
    zeile(saetze, 'function ohneTaschkil('), schneideFunktion(uebung, 'function uebPluralArt('),
    schneideBis(kern, 'const PLURAL_FERN =', '];'),
  ].join('\n');
  const ctx = { console: { log(){}, warn(){}, error(){} } };
  vm.createContext(ctx);
  vm.runInContext('let PROGRESS = {}; let __K = []; function bekannteVokabeln(){ return __K; }\n' + teile
    + '\nthis.setze = function(l){ __K = l; };'
    + '\nthis.art = uebPluralArt; this.regel = pluralRegelmaessig; this.partner = pluralKlangPartner;'
    + '\nthis.zahl = istZahlwort; this.pluralKarte = istPluralKarte; this.FERN = PLURAL_FERN.slice();', ctx);
  return ctx;
}

/* ---------- Sein Bestand, wie die App ihn baut ---------- */
function seinBestand(){
  let auswahl = null, woher = '';
  try {
    const s = JSON.parse(lies('.stand-app.json'));
    if (s && s.buecher){ auswahl = s.buecher; woher = '.stand-app.json, abgefragt ' + String(s.abgefragt || '?').slice(0, 10); }
  } catch (e) { /* fehlt auf einem frischen Klon — dann seine Angabe */ }
  if (!auswahl){
    const ls = JSON.parse(lies('data/lernstand.json'));
    auswahl = {};
    for (const [slug, bis] of Object.entries(ls.angabe || {}))
      if (!(ls.nichtInArbeit || {})[slug]) auswahl[slug] = Array.from({ length: Number(bis) }, (_, i) => i + 1);
    woher = 'data/lernstand.json (seine Angabe; .stand-app.json fehlt)';
  }
  const ctx = { console: { log(){}, warn(){}, error(){}, info(){} }, SETTINGS: { buecher: auswahl },
    document: { addEventListener(){}, getElementById(){ return null; }, querySelector(){ return null; },
                querySelectorAll(){ return []; }, body: { dataset: {} } },
    window: { addEventListener(){}, VOKABELN: {} }, setTimeout(){} };
  vm.createContext(ctx);
  const lauf = (code, name) => vm.runInContext(code, ctx, { filename: name });
  lauf(lies('vocab-data.js'), 'vocab-data.js');
  const lernIds = new Set(lauf('VOCAB_DATA.map(function(w){ return String(w.id); })'));
  for (const f of ['data/feld-ausnahmen.js', 'data/eselsbruecken.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js', 'koran-haeufig-data.js'])
    lauf(lies(f), f);
  const bq = lies('js/buecher.js');
  const a = bq.indexOf('const ROH_ARAB_FELDER'), b = bq.indexOf("document.addEventListener('click'", a);
  if (a < 0 || b < 0 || !bq.slice(a, b).includes('function einhaengen(liste){'))
    throw new Error('js/buecher.js: der Funktionsteil mit einhaengen() liegt nicht mehr zwischen ROH_ARAB_FELDER und dem ersten click-Horcher');
  lauf(bq.slice(a, b), 'js/buecher.js (Funktionsteil)');
  lauf([zeile(bq, "const KORAN_BUCH = "), schneideFunktion(bq, 'function koranListe('), schneideFunktion(bq, 'function koranKarten(')].join('\n'), 'js/buecher.js (Koran)');
  /* Woher ein Wert stammt — für die Frage, ob ein Befund den Exit färbt. */
  const eigenPl = new Set(lauf('VOCAB_DATA.filter(function(w){ return w.pl; }).map(function(w){ return String(w.id); })'));
  const nachgetragen = new Set(Object.entries(lauf('FELD_ERGAENZUNGEN')).filter(([, e]) => e && e.pl).map(([id]) => id));
  const schreibweise = new Set(Object.keys(lauf('typeof SCHREIBWEISEN !== "undefined" ? SCHREIBWEISEN : {}')));
  /* Die Reihenfolge der App (js/kern.js beim Start): seine selbst angelegten Wörter (dort aus
     vt_personalVocab, hier aus data/eigene-woerter.json, dem Geräteabgleich), die bestellten
     Fachbegriffe, dann die Nachträge — und je Buch einhaengen() und noch einmal die Nachträge
     (js/buecher.js). ⛔ Am 14.10.2026 standen seine Wörter hier zuerst HINTER den Nachträgen:
     dann fehlten ihnen seine Antworten von der Fragenseite (Wortart, Mehrzahl), und Teil E
     meldete „für dich" als Nomen ohne Mehrzahl. */
  const selbstIds = new Set();
  try {
    const d = JSON.parse(lies('data/eigene-woerter.json'));
    for (const w of (Array.isArray(d.woerter) ? d.woerter : [])){ selbstIds.add(String(w.id)); vm.runInContext('VOCAB_DATA.push(' + JSON.stringify(w) + ')', ctx); }
  } catch (e) { /* fehlt: dann ohne seine selbst angelegten Wörter — steht in der Ausgabe */ }
  const fachIds = new Set();
  lauf('(typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : []).forEach(function(w){'
    + ' if (FACHBEGRIFF_AUFTRAG && Object.prototype.hasOwnProperty.call(FACHBEGRIFF_AUFTRAG, String(w.id))'
    + ' && !VOCAB_DATA.some(function(v){ return String(v.id) === String(w.id); })) VOCAB_DATA.push(w); })');
  for (const w of lauf('typeof FACHBEGRIFF_VOKABELN !== "undefined" ? FACHBEGRIFF_VOKABELN : []')) fachIds.add(String(w.id));
  lauf('wendeFeldErgaenzungenAn(VOCAB_DATA)');
  const buchVon = new Map(), fehlendeBuecher = [];
  for (const slug of Object.keys(auswahl)){
    if (slug === 'koran-haeufig') continue;
    const datei = 'data/vokabeln-' + slug + '.js';
    if (!fs.existsSync(path.join(REPO, datei))){ fehlendeBuecher.push(datei); continue; }
    lauf(lies(datei), datei);
    for (const w of lauf('window.VOKABELN[' + JSON.stringify(slug) + '] || []'))
      if (!buchVon.has(String(w.id))) buchVon.set(String(w.id), slug);
    lauf('einhaengen(window.VOKABELN[' + JSON.stringify(slug) + '] || [])');
    lauf('wendeFeldErgaenzungenAn(VOCAB_DATA)');
  }
  const kern = lies('js/kern.js');
  const wunsch = (kern.match(/const FREISCHALTEN_AUF_WUNSCH\s*=\s*\[([^\]]*)\]/) || [null, ''])[1];
  const aufWunsch = new Set((wunsch.match(/'[^']+'|"[^"]+"/g) || []).map(s => s.slice(1, -1)));
  const koran = lauf('koranKarten()');
  const koranAn = (auswahl['koran-haeufig'] || []).map(Number);
  const bekannt = w => !!w && (w.chapter === 'personal' || lernIds.has(String(w.id)) || aufWunsch.has(String(w.id))
    || (auswahl[w.book] || []).map(Number).includes(Number(w.chapter)));
  const karten = lauf('VOCAB_DATA').filter(bekannt);
  const imBestand = new Set(karten.map(w => String(w.id)));
  for (const k of koran) if (koranAn.includes(Number(k.chapter)) && !imBestand.has(String(k.id))){ karten.push(k); imBestand.add(String(k.id)); }
  const herkunft = w => {
    const id = String(w.id);
    if (w.book === 'koran-haeufig' || fachIds.has(id) || selbstIds.has(id) || eigenPl.has(id) || nachgetragen.has(id) || schreibweise.has(id)) return 'eigen';
    return buchVon.has(id) ? 'buch' : 'eigen';
  };
  const quelleFuerAusnahme = w => fachIds.has(String(w.id)) ? 'fachbegriffe' : selbstIds.has(String(w.id)) ? 'selbst' : (buchVon.get(String(w.id)) || 'vocab-data');
  /* ⛔ Bei seinen selbst angelegten Wörtern ist `type: 'noun'` der Festwert aus
     addPersonalVocab(), keine Angabe (vorrat.mjs, typFestwert()): unter ihnen stehen
     „für dich" und „faul". Erst eine beantwortete Wortart (FELD_ERGAENZUNGEN) macht
     ein „Nomen ohne Mehrzahl" daraus — vorher fragt vorrat.mjs nach der Wortart. */
  const ergaenzt = lauf('FELD_ERGAENZUNGEN') || {};
  const typUnbelegt = w => selbstIds.has(String(w.id)) && !(ergaenzt[String(w.id)] && String(ergaenzt[String(w.id)].type || '').trim());
  return { karten, koranExtra: koran.filter(k => !imBestand.has(String(k.id))), herkunft, woher, fehlendeBuecher,
    feldAusnahme: lauf('feldAusnahme'), quelleFuerAusnahme, aufWunsch, selbstDa: selbstIds.size, typUnbelegt };
}

/* ---------- Die Prüfung selbst: eine reine Funktion, damit die Eichung sie fahren kann ---------- */
function pruefeKarten(karten, opt){
  const { fn, herkunft, gesehen, fern, nurAB } = opt;
  const befunde = [], hinweisF = [], nichtVergleichbar = [];
  const art = { m: 0, f: 0 };
  let reihenfolge = 0;
  const mitPl = karten.filter(w => w && typeof w.pl === 'string' && w.pl.trim() && !fn.zahl(w) && !fn.pluralKarte(w.id));
  const melde = (w, teil, text) => befunde.push({ id: String(w.id), teil, text, herkunft: herkunft(w), w });
  for (const w of mitPl){
    const pl = w.pl;
    /* A1 — zusammengesetzt wie in NFC? Nur, was das Tippfeld spürt. */
    if (pl !== pl.normalize('NFC')){
      if (rohWieApp(pl) !== rohWieApp(pl.normalize('NFC'))) melde(w, 'A1', 'Buchstaben nicht zusammengesetzt (NFC): das Tippfeld sagt bei richtiger Eingabe „noch nicht"');
      else reihenfolge++;
    }
    /* A2 — jede Teilform: arabisch, kein Platzhalter, nicht leer */
    const roh = pl.split(TEILER);
    if (roh.some(t => !t.trim())) melde(w, 'A2', 'leere Teilform in „' + pl + '"');
    for (const t of roh.filter(t => t.trim()))
      if (!BUCHSTABE.test(t) || FREMD.test(t)) melde(w, 'A2', 'Teilform „' + t + '" ist keine arabische Form (Platzhalter?)');
    /* A3 — dieselbe Form wie die Einzahl (mit Vokalen, ohne Endung) */
    const sg = String(w.sg || w.ar || '');
    if (roh.some(t => t.trim() && ohneEndung(t) === ohneEndung(sg))) melde(w, 'A3', 'die Mehrzahl ist dieselbe Form wie die Einzahl');
    /* B — regelmäßig: der Stamm */
    const r = fn.art(w);
    if (r !== 'm' && r !== 'f') continue;
    art[r]++;
    if (gerust(sg).startsWith(ARTIKEL) && !gerust(pl).startsWith(ARTIKEL)){ nichtVergleichbar.push(w); continue; }
    const stamm = ohneEndung(sg);
    const soll = (r === 'm' ? stamm + ENDUNG_M : (stamm.endsWith(TA_MARBUTA) ? stamm.slice(0, -1) : stamm) + ENDUNG_F).normalize('NFC');
    const ist = ohneEndung(pl);
    if (ist === soll) continue;
    if (r === 'm') melde(w, 'B', 'gilt als regelmäßig männlich, aber der Stamm ist anders vokalisiert: erwartet ' + soll + ', steht ' + ist);
    else hinweisF.push({ w, soll, ist });
  }
  const C = { nichtRegel: 0, ohnePartner: [], neu: [], wartet: [], nah: [], fern: [] };
  if (!nurAB){
    fn.setze(karten);
    for (const w of mitPl){
      if (fn.regel(w)) continue;
      C.nichtRegel++;
      if (fn.partner(w, 1).length) continue;
      const id = String(w.id);
      C.ohnePartner.push(w);
      if (fern.includes(id)) C.fern.push(w);
      else if (gesehen[id] === 'wartet') C.wartet.push(w);
      else if (gesehen[id] === 'nah') C.nah.push(w);
      else C.neu.push(w);
    }
  }
  return { mitPl, befunde, hinweisF, nichtVergleichbar, art, reihenfolge, C };
}

/* ---------- pruefe-taschkil.js --json: seine Befunde lesen, nicht nachbauen ---------- */
const TASCHKIL_MARKE = '@@TASCHKIL-BEFUNDE@@';
function taschkilBefundeAus(text){
  const z = String(text || '').split(/\r?\n/).find(l => l.startsWith(TASCHKIL_MARKE));
  if (!z) return null;
  try {
    const d = JSON.parse(z.slice(TASCHKIL_MARKE.length));
    return (Array.isArray(d.befunde) && Array.isArray(d.buchBefunde)) ? d : null;
  } catch (e) { return null; }
}

/* ---------- Eichung: Probekarten mit bekannter Antwort (Buckwalter → Codepunkte) ---------- */
const BW = { "'": 0x621, '>': 0x623, '&': 0x624, '<': 0x625, '}': 0x626, A: 0x627, b: 0x628, p: 0x629, t: 0x62A, v: 0x62B,
  j: 0x62C, H: 0x62D, x: 0x62E, d: 0x62F, '*': 0x630, r: 0x631, z: 0x632, s: 0x633, $: 0x634, S: 0x635, D: 0x636,
  T: 0x637, Z: 0x638, E: 0x639, g: 0x63A, f: 0x641, q: 0x642, k: 0x643, l: 0x644, m: 0x645, n: 0x646, h: 0x647,
  w: 0x648, Y: 0x649, y: 0x64A, F: 0x64B, N: 0x64C, K: 0x64D, a: 0x64E, u: 0x64F, i: 0x650, '~': 0x651, o: 0x652 };
const ar = t => [...t].map(c => { if (c === ' ' || c === '/') return c; if (!(c in BW)) throw new Error('kein Buckwalter-Zeichen: ' + c); return Z(BW[c]); }).join('').normalize('NFC');
const wz = t => [...t].map(c => ar(c)).join(' ');
const probe = (id, sg, pl, wurzel) => ({ id: 'p' + id, de: 'Probe ' + id, ar: ar(sg), sg: ar(sg), pl: typeof pl === 'string' ? ar(pl) : pl.roh, root: wz(wurzel), type: 'noun' });

function eichung(fn){
  const PROBEN = [
    probe(1, 'mudar~isN', 'mudar~isuwna', 'drs'),            /* regelmäßig m, sauber */
    probe(2, 'Har~N', 'Har~uwna', 'Hrr'),                    /* m mit Schadda am Ende — kein Befund */
    probe(3, 'muEal~imN', 'muEal~amuwna', 'Elm'),            /* m, Stamm anders vokalisiert — Befund B */
    probe(4, 'waHodapN', 'waHadaAtN', 'wHd'),                /* f mit Vokalwechsel — nur Hinweis */
    probe(5, 'su&AlN', { roh: Z(0x627) + Z(0x654) + ar('aso}ilapN') }, 's>l'),   /* Alif + Hamza als zwei Zeichen — A1 */
    probe(6, 'sukarN', { roh: '+f' }, 'skr'),                /* Platzhalter aus Wiktionary — A2 */
    probe(7, 'kitAbN', 'kitAbN', 'ktb'),                     /* Mehrzahl = Einzahl — A3 */
    probe(8, 'rajulN', 'rijAlN', 'rjl'),                     /* Klang-Partner von 9 */
    probe(9, 'jabalN', 'jibAlN', 'jbl'),
    probe(10, 'mara>apN', 'nisA\'N', 'mr>'),                 /* ohne Partner — Kandidat */
    probe(11, 'qalamN', 'qalamN', 'qlm'),                    /* wie 7, aber aus dem Abzug — färbt den Exit nicht */
    probe(12, 'say~ArapN', 'say~AraAtN', 'syr'),             /* regelmäßig f, sauber */
    /* Schadda VOR dem Vokal, wie in seinen Buchdaten (NFC stellt den Vokal davor) — nur Reihenfolge, kein Befund */
    { ...probe(13, 'kut~AbN', 'kut~AbN', 'ktb'), pl: [0x643, 0x64F, 0x62A, 0x651, 0x64E, 0x627, 0x628, 0x64C].map(Z).join('') },
  ];
  const herkunft = w => w.id === 'p11' ? 'buch' : 'eigen';
  const lauf = (gesehen, fern) => pruefeKarten(PROBEN, { fn, herkunft, gesehen, fern });
  const r = lauf({}, []);
  const hat = (id, teil) => r.befunde.some(b => b.id === id && b.teil === teil);
  const nur = id => r.befunde.filter(b => b.id === id).length;
  const fall = [
    ['1 m sauber: kein Befund', nur('p1') === 0],
    ['2 m mit Schadda am Ende: kein Befund', nur('p2') === 0],
    ['3 m mit anderem Stamm: Befund B', hat('p3', 'B')],
    ['4 f mit Vokalwechsel: Hinweis, kein Befund', nur('p4') === 0 && r.hinweisF.some(h => h.w.id === 'p4')],
    ['5 Alif + Hamza getrennt: Befund A1', hat('p5', 'A1')],
    ['6 Platzhalter „+f": Befund A2', hat('p6', 'A2')],
    ['7 Mehrzahl = Einzahl: Befund A3', hat('p7', 'A3')],
    ['8 Klang-Partner: kein Kandidat', !r.C.ohnePartner.some(w => w.id === 'p8' || w.id === 'p9')],
    ['9 ohne Partner, nirgends gesehen: Kandidat NEU', r.C.neu.some(w => w.id === 'p10')],
    ['10 dieselbe Karte als „wartet" gesehen: nicht mehr NEU', (() => { const x = lauf({ p10: 'wartet' }, []); return !x.C.neu.some(w => w.id === 'p10') && x.C.wartet.some(w => w.id === 'p10'); })()],
    ['11 dieselbe Karte in PLURAL_FERN: nicht NEU', (() => { const x = lauf({}, ['p10']); return !x.C.neu.some(w => w.id === 'p10') && x.C.fern.some(w => w.id === 'p10'); })()],
    ['12 Befund im Abzug: als „buch" gekennzeichnet', r.befunde.some(b => b.id === 'p11' && b.teil === 'A3' && b.herkunft === 'buch')],
    ['13 f sauber: kein Befund, kein Hinweis', nur('p12') === 0 && !r.hinweisF.some(h => h.w.id === 'p12')],
    ['14 nur andere Zeichenfolge: kein Befund, aber gezählt', nur('p13') === 0 && r.reihenfolge === 1],
    ['15 die Marke von pruefe-taschkil.js wird gelesen', !!taschkilBefundeAus('x\n' + TASCHKIL_MARKE + '{"befunde":[],"buchBefunde":[{"id":1,"feld":"pl","wort":"x","gruppe":"g"}]}\n')
      && taschkilBefundeAus('ohne Marke') === null && taschkilBefundeAus(TASCHKIL_MARKE + '{kaputt') === null],
  ];
  /* Schlägt eine Probe fehl, sagt diese Zeile, was die Prüfung an den Proben WIRKLICH gefunden hat. */
  const diagnose = 'Befunde an den Proben: ' + (r.befunde.map(b => b.id + ' ' + b.teil).join(', ') || '—')
    + ' · Hinweise weiblich: ' + (r.hinweisF.map(h => h.w.id + ' (erwartet ' + h.soll + ', steht ' + h.ist + ')').join(', ') || '—')
    + ' · nur Reihenfolge: ' + r.reihenfolge + ' · ohne Partner: ' + (r.C.ohnePartner.map(w => w.id).join(', ') || '—');
  return { fall, diagnose };
}

/* ================================== Lauf ================================== */
let fn, bestand;
try { fn = pluralWelt(); } catch (e) { console.log('  ⛔ WERKZEUG: die Plural-Funktionen sind nicht ausschneidbar — ' + e.message); process.exit(1); }
try { bestand = seinBestand(); } catch (e) { console.log('  ⛔ WERKZEUG: sein Bestand ist nicht ladbar — ' + e.message); process.exit(1); }

const { fall: eich, diagnose } = eichung(fn);
const eichRot = eich.filter(([, ok]) => !ok);
console.log('Mehrzahl-Prüfer · Eichung: ' + (eich.length - eichRot.length) + ' von ' + eich.length + ' Proben richtig');
for (const [name] of eichRot) kaputt('Eichprobe greift nicht — ' + name);
if (eichRot.length) console.log('     ' + diagnose);

/* ---------- Störtests: PRUEFE_PLURAL_STOER=<name> baut einen Fehler ein, das Ergebnis muss kippen ----------
   Gemessen am 14.10.2026, jeder einzeln:
     eigen     eine falsche regelmäßige Mehrzahl in UNSEREN Daten   → Exit 2
     buch      Mehrzahl = Einzahl in seinem Abzug                   → Exit 0, „Für die Wartung"
     taschkil  pruefe-taschkil.js liefert keine Befunde             → Exit 1 (Teil D nicht gemessen)
     doppelt   eine Karte in PLURAL_FERN und in GESEHEN             → Exit 1
   Die Eichung oben prüft die Erkennung; diese vier prüfen, dass ein Treffer auch im Exit ankommt. */
const STOER = process.env.PRUEFE_PLURAL_STOER || '';
if (STOER) console.log('  ⚠️ STÖRTEST „' + STOER + '" — dieses Ergebnis ist absichtlich falsch');
const gesehen = STOER === 'doppelt' ? { ...GESEHEN, [fn.FERN[0]]: 'nah' } : GESEHEN;

/* Doppelt geführt wäre ein Widerspruch: weit (PLURAL_FERN) und zugleich „wartet"/„nah". */
for (const id of fn.FERN) if (gesehen[id]) kaputt(id + ' steht in PLURAL_FERN UND in GESEHEN — eine von beiden Listen ist veraltet');

const { karten, koranExtra } = bestand;
if (STOER === 'eigen') karten.push(probe(90, 'muEal~imN', 'muEal~amuwna', 'Elm'));
if (STOER === 'buch') karten.push(probe(91, 'qalamN', 'qalamN', 'qlm'));
const herkunft = w => (STOER === 'buch' && w.id === 'p91') ? 'buch' : bestand.herkunft(w);
console.log('Sein Bestand: ' + karten.length + ' Karten (Auswahl aus ' + bestand.woher + ')'
  + (bestand.fehlendeBuecher.length ? ' — ⚠️ es fehlen ' + bestand.fehlendeBuecher.join(', ') + ' (liegen nur lokal), deren Karten sind NICHT geprüft' : '')
  + (bestand.selbstDa ? '' : ' — ⚠️ data/eigene-woerter.json fehlt, seine selbst angelegten Wörter sind NICHT geprüft'));
if (karten.length < 50) kaputt('nur ' + karten.length + ' Karten — der Bestand ist nicht richtig geladen');

const r = pruefeKarten(karten, { fn, herkunft, gesehen, fern: fn.FERN });
const rk = pruefeKarten(koranExtra, { fn, herkunft, gesehen, fern: fn.FERN, nurAB: true });
console.log('  ' + r.mitPl.length + ' Karten mit Mehrzahl (Zahlwörter nicht mitgezählt: dort steht die Form beim weiblichen Nomen)'
  + '; dazu „Koran häufigste" außerhalb seiner Auswahl: ' + rk.mitPl.length + ' mit Mehrzahl (nur Teil A und B)');

const alle = [...r.befunde, ...rk.befunde];
const eigene = alle.filter(b => b.herkunft === 'eigen'), ausBuch = alle.filter(b => b.herkunft === 'buch');
const zeig = b => '     ' + b.teil + '  ' + b.id + ' ' + String(b.w.de || '') + ' | ' + String(b.w.sg || b.w.ar || '') + ' → ' + b.w.pl + ' — ' + b.text;

console.log('');
console.log('A Schreibweise: ' + alle.filter(b => b.teil !== 'B').length + ' Befund(e)'
  + ' · nur andere Reihenfolge von Schadda und Vokal (kein Befund): ' + (r.reihenfolge + rk.reihenfolge) + ' Feld(er)');
console.log('B regelmäßig: ' + (r.art.m + rk.art.m) + ' männlich, ' + (r.art.f + rk.art.f) + ' weiblich · männlich mit anderem Stamm: '
  + alle.filter(b => b.teil === 'B').length);
const hf = [...r.hinweisF, ...rk.hinweisF];
if (hf.length){
  console.log('  ⓘ weiblich mit geändertem Vokal im Stamm (im Arabischen bei Wörtern wie وَحْدَةٌ üblich; das Tippfeld vergleicht ohne Vokale): ' + hf.length);
  for (const h of hf) console.log('     ' + h.w.id + ' ' + String(h.w.de || '') + ' | ' + (h.w.sg || h.w.ar) + ' → ' + h.w.pl);
}
const nv = [...r.nichtVergleichbar, ...rk.nichtVergleichbar];
if (nv.length) console.log('  ⓘ nicht vergleichbar (Einzahl mit Artikel, Mehrzahl ohne): ' + nv.map(w => w.id).join(', '));
if (eigene.length){
  console.log('');
  console.log('  ⛔ IN UNSEREN DATEN — vor dem Ausliefern beheben, nur mit Beleg:');
  eigene.forEach(b => console.log(zeig(b)));
}
if (ausBuch.length){
  console.log('');
  console.log('  ⚠️ Für die Wartung (sein Abzug, färbt den Exit nicht) — belegen und über SCHREIBWEISEN (data/eselsbruecken.js) korrigieren, sonst in die To-Do:');
  ausBuch.forEach(b => console.log(zeig(b)));
}

console.log('');
const C = r.C;
console.log('C ohne Klang-Partner: ' + C.ohnePartner.length + ' von ' + C.nichtRegel + ' nicht regelmäßigen'
  + ' · in PLURAL_FERN ' + C.fern.length + ' · wartet auf Elias ' + C.wartet.length + ' · nah ' + C.nah.length + ' · NEU ' + C.neu.length);
for (const w of C.neu) console.log('  ➕ NEU  ' + w.id + ' ' + String(w.de || '') + ' | ' + (w.sg || w.ar) + ' → ' + w.pl
  + '  — Elias fragen (To-Do „Wartet auf Elias"), hier in GESEHEN als \'wartet\' eintragen');
if (C.wartet.length) console.log('  ⏳ wartet auf sein Wort: ' + C.wartet.map(w => w.id + ' ' + String(w.de || '').split('/')[0].trim()).join(' · '));
const imBestand = new Set(karten.map(w => String(w.id)));
const ohneP = new Set(C.ohnePartner.map(w => String(w.id)));
const fernWeg = fn.FERN.filter(id => !imBestand.has(id));
if (fernWeg.length) console.log('  ⚠️ aus PLURAL_FERN nicht in seinem Bestand: ' + fernWeg.join(', ') + ' (test-plural-fern.mjs, Fall 3)');
const veraltet = Object.keys(GESEHEN).filter(id => !ohneP.has(id));
if (veraltet.length) console.log('  ⓘ in GESEHEN, aber nicht (mehr) ohne Partner in seinem Bestand: ' + veraltet.map(id => id + (imBestand.has(id) ? '' : ' (nicht im Bestand)')).join(', '));

/* D — Vokalzeichen, aus pruefe-taschkil.js */
console.log('');
const t = spawnSync(process.execPath, [path.join(REPO, STOER === 'taschkil' ? 'gibt-es-nicht.js' : 'pruefe-taschkil.js'), '--json'],
  { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const tb = taschkilBefundeAus(t.stdout);
if (!tb) kaputt('pruefe-taschkil.js --json lieferte keine Befunde (Exit ' + t.status + ') — Teil D ist NICHT gemessen');
else {
  const nachId = new Map(r.mitPl.map(w => [String(w.id), w]));
  const treffer = [...tb.befunde, ...tb.buchBefunde].filter(b => b && b.feld === 'pl' && nachId.has(String(b.id))
    && String(nachId.get(String(b.id)).pl).normalize('NFC').includes(String(b.wort).normalize('NFC')));
  const nachGruppe = {};
  for (const b of treffer) (nachGruppe[b.gruppe] = nachGruppe[b.gruppe] || []).push(b);
  console.log('D Vokalzeichen der Mehrzahl (pruefe-taschkil.js): ' + treffer.length + ' Befund(e) auf seinen Karten'
    + (treffer.length ? ' — ' + Object.entries(nachGruppe).map(([g, l]) => g + ' ' + l.length).join(', ') : ''));
  for (const [g, l] of Object.entries(nachGruppe))
    console.log('     ' + g + ': ' + l.map(b => b.id + ' ' + b.wort).join(' · ')
      + (g === 'Endung fehlt' ? '  (Pausalform wie im Wörterbuch — meist kein Fehler)' : '  → belegen oder Elias vorlegen'));
}

/* E — Nomen ohne Mehrzahl */
const ohnePlAlle = karten.filter(w => w && w.type === 'noun' && !(typeof w.pl === 'string' && w.pl.trim())
  && !fn.zahl(w) && !bestand.feldAusnahme(w, 'pl', bestand.quelleFuerAusnahme(w)));
const ohnePl = ohnePlAlle.filter(w => !bestand.typUnbelegt(w));
const typOffen = ohnePlAlle.length - ohnePl.length;
console.log('E Nomen ohne Mehrzahl und ohne erklärte Ausnahme: ' + ohnePl.length
  + (typOffen ? ' (dazu ' + typOffen + ' selbst angelegte Wörter, deren Wortart „Nomen" nur der Vorgabewert ist — dort fragt vorrat.mjs zuerst die Wortart)' : ''));
for (const w of ohnePl) console.log('     ' + w.id + ' ' + String(w.de || '') + ' | ' + (w.sg || w.ar)
  + (bestand.aufWunsch.has(String(w.id)) ? '  (einzeln freigeschaltet — vorrat.mjs sieht es nicht)' : ''));

console.log('');
if (werkzeugFehler){ console.log('⛔ Das Werkzeug ist nicht in Ordnung (' + werkzeugFehler + ') — Exit 1.'); process.exit(1); }
if (eigene.length){ console.log('⛔ ' + eigene.length + ' Befund(e) in unseren Daten — Exit 2.'); process.exit(2); }
console.log('✅ Keine falsche Mehrzahl in unseren Daten.' + (ausBuch.length ? ' ' + ausBuch.length + ' Befund(e) im Abzug für die Wartung.' : '')
  + (C.neu.length ? ' ' + C.neu.length + ' neue(r) Kandidat(en) für ihn.' : ''));
process.exit(0);
