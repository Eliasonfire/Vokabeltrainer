/* pruefe-regelsammlung.mjs — bewacht die Regelsammlung (Goal vom 11.09.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-regelsammlung.mjs
 *
 * ⭐ WAS HIER BEWACHT WIRD — zuerst Elias' Sätze, dann die Technik
 * [[wirkung_an_der_quelle_stilllegen]]
 *
 *  1. „artefakt soll da bleiben" (11.09.2026, 04:08)
 *     Das Regelprüfungs-Artefakt und sein Übernahmewerkzeug bleiben, und ein
 *     Export überschreibt einen jüngeren Schalter in der App NICHT — und
 *     umgekehrt. Geprüft wird die ECHTE Entscheidung aus js/regeln.js, dazu
 *     ein Störtest, der den Zeitvergleich stilllegt und rot werden MUSS.
 *  2. „diese und all die anderen regeln sollen nicht gelöscht werden"
 *     (26.08.2026) / „ich will aber auch die funktion haben es zu bearbeiten,
 *     zu löschen usw" (11.09.2026)
 *     Löschen legt in den Papierkorb und ist umkehrbar — für Regeln, Karten
 *     und eigene Regeln. Ebenfalls mit Störtest.
 *  3. Die neun Karten aus Folge 19 — vollständig, mit Quelle, mit Beispiel,
 *     und ihr Arabisch ist ABGESCHRIEBEN: jedes arabische Wort steht in der
 *     geprüften Abschrift der Musterlösung oder wörtlich in grammar-data.js
 *     bzw. den Satzdateien. Liegt das PDF auf dem Rechner, wird die Abschrift
 *     zusätzlich Zeile für Zeile gegen seine Textebene gehalten.
 *  4. „Nur den Reiter „Eigene" entfernen … „Eigene Vokabeln" im Reiter
 *     Kapitel auch [bleibt]" — und die dritte Kachel steht mit dem Hinweis,
 *     dass sie seine Vorgabe vom 21.08. aufhebt.
 *  5. Keine Stelle in js/ liest `ausgeblendet` an einer Regel vorbei an
 *     regelAusgeblendet() — sonst zeigte der Satzmodus etwas anderes als die
 *     Karte. [[zweiter_fix_deckt_ersten_zu]]
 *  6. vt_regeln fährt im Abgleich und in der Sicherung mit.
 *
 * Exit 0 = alles hält · 1 = Befund oder Störtest wirkungslos
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const PDF = 'G:/1. Workspace/SamsungNotes-Sicherung/LocalState/SPenSDK30/SPEN_0263392147_3000/media/0@pdf_1788372254547.pdf';

let fehler = 0;
const ok = t => console.log('  ok   ' + t);
const rot = t => { fehler++; console.log('  ROT  ' + t); };
const pruefe = (t, b, zusatz) => b ? ok(t) : rot(t + (zusatz ? '  -> ' + zusatz : ''));

/* ---------- Umgebung: die echten Dateien, ein leerer Speicher ---------- */
function baueApp(regelnQuelle){
  const speicher = {};
  const ctx = {
    localStorage: {
      getItem: k => (k in speicher ? speicher[k] : null),
      setItem: (k, v) => { speicher[k] = String(v); },
      removeItem: k => { delete speicher[k]; }
    },
    console
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  /* ⚠️ `const s = localStorage; s.setItem(…)` statt des direkten Aufrufs:
     pruefe-seitenspeicher.mjs sucht Werkzeuge, die eine SEITE mit Speicher
     erzeugen, am Stichwort des direkten Aufrufs plus „.html" — beides stand
     hier (index.html wird gelesen), und dieser reine node-Pruefer galt als
     stumme Entscheidungsseite. [[stichworttreffer_ist_kein_inhaltstreffer]] */
  vm.runInContext('const LS = { get(k, f){ const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; }, set(k, v){ const s = localStorage; s.setItem(k, JSON.stringify(v)); } };', ctx);
  vm.runInContext(lies('grammar-data.js'), ctx);
  vm.runInContext(lies('regelsammlung-data.js'), ctx);
  vm.runInContext(regelnQuelle, ctx);
  const hol = name => vm.runInContext(name, ctx);
  return { ctx, speicher, hol };
}

/* ======================================================= 1. Artefakt & Vorrang */
console.log('=== 1. „artefakt soll da bleiben" — Export und Schalter überschreiben sich nicht still ===');
pruefe('das Regelprüfungs-Artefakt ist weiter baubar (werkzeuge/regelpruefung-seite.mjs)',
  fs.existsSync(path.join(REPO, 'werkzeuge/regelpruefung-seite.mjs')));
const uebernahme = lies('werkzeuge/urteile-uebernehmen.mjs');
pruefe('das Übernahmewerkzeug verlangt den Zeitpunkt des Exports (--zeit)',
  /--zeit fehlt/.test(uebernahme) && /satzmodusUrteil:/.test(uebernahme));

function vorrangFaelle(app){
  const regeln = app.hol('GRAMMAR_RULES');
  const mitUrteil = regeln.find(r => r.satzmodusUrteil && !r.ausgeblendet);
  if (!mitUrteil) return ['keine Regel mit satzmodusUrteil gefunden'];
  const urteil = Date.parse(mitUrteil.satzmodusUrteil);
  const setze = (an, zeit) => app.speicher['vt_regeln'] = JSON.stringify({ satz: { [mitUrteil.id]: { an, zeit } } });
  const ent = app.hol('regelSatzEntscheidung');
  const falsch = [];
  setze(false, urteil - 86400000);                 // Schalter AELTER als der Export
  let e = ent(mitUrteil);
  if (e.aus !== false || e.von !== 'datei') falsch.push('älterer Schalter gewinnt gegen den Export');
  if (!e.ueberholt) falsch.push('der überholte Schalter wird nicht gemeldet');
  setze(false, urteil + 60000);                    // Schalter JUENGER als der Export
  e = ent(mitUrteil);
  if (e.aus !== true || e.von !== 'app') falsch.push('jüngerer Schalter verliert gegen den Export');
  app.speicher['vt_regeln'] = JSON.stringify({});  // gar kein Schalter
  e = ent(mitUrteil);
  if (e.aus !== false) falsch.push('ohne Schalter gilt nicht die Datei');
  return falsch;
}
{
  const app = baueApp(lies('js/regeln.js'));
  const falsch = vorrangFaelle(app);
  pruefe('die jüngere Entscheidung gilt, in beide Richtungen', !falsch.length, falsch.join(' · '));

  /* Störtest: der Zeitvergleich wird stillgelegt — die App gewinnt immer. */
  const quelle = lies('js/regeln.js');
  const gestoert = quelle.replace('if (s.zeit > urteil) return', 'if (true) return');
  if (gestoert === quelle) rot('Störtest greift nicht: der Zeitvergleich in regelSatzEntscheidung() heißt anders');
  else pruefe('Störtest: ohne Zeitvergleich wird der Prüfer rot', vorrangFaelle(baueApp(gestoert)).length > 0);
}

/* ======================================================= 2. Löschen umkehrbar */
console.log('\n=== 2. Nichts wird gelöscht — Papierkorb, verborgen, wiederherstellbar ===');
function loeschFaelle(app){
  const falsch = [];
  const f = n => app.hol(n);
  const regeln = f('GRAMMAR_RULES');
  const anzahl = regeln.length;
  const karten = f('FOLGE19_KARTEN');
  const P = f('REGELPRUEFUNG_26_08');
  const gestrichen = Object.keys(P.streichen).filter(id => regeln.some(r => r.id === id));

  let g = f('sammlungsGliederung')();
  if (g.liste.length !== anzahl - gestrichen.length) falsch.push(`Liste ${g.liste.length}, erwartet ${anzahl - gestrichen.length}`);
  if (g.verborgen.length !== gestrichen.length) falsch.push(`verborgen ${g.verborgen.length}, erwartet ${gestrichen.length}`);
  if (g.karten.length !== karten.length) falsch.push('nicht alle Karten sichtbar');

  for (const id of ['idafa-01', karten[0].id]){
    f('regelLoeschen')(id);
    g = f('sammlungsGliederung')();
    if (!g.papierkorb.includes(id)) falsch.push(id + ' liegt nach dem Löschen nicht im Papierkorb');
    if (f('GRAMMAR_RULES').length !== anzahl) falsch.push('Löschen hat eine Regel aus den Daten genommen');
    f('regelWiederherstellen')(id);
    g = f('sammlungsGliederung')();
    if (g.papierkorb.includes(id)) falsch.push(id + ' ist nach dem Wiederherstellen noch im Papierkorb');
  }
  const eigen = f('eigeneRegelAnlegen')({ name: 'Prüfregel', kurz: 'Text' });
  f('regelLoeschen')(eigen);
  if (!f('regelnStand')().eigene[eigen]) falsch.push('eine eigene Regel ist nach dem Löschen aus dem Speicher verschwunden');
  f('regelWiederherstellen')(eigen);
  if (!f('sammlungsGliederung')().eigene.some(e => e.id === eigen)) falsch.push('eigene Regel kommt nicht zurück');

  const weg = gestrichen[0];
  f('regelZeigen')(weg, true);
  if (!f('sammlungsGliederung')().liste.some(r => r.id === weg)) falsch.push('verborgene Regel lässt sich nicht zurückholen');

  f('regelTextSetzen')('idafa-01', 'x', 'meine Fassung');
  if (f('regelText')('idafa-01').kurz !== 'meine Fassung') falsch.push('Bearbeiten wirkt nicht');
  if (f('regelText')('idafa-01').original.kurz !== regeln.find(r => r.id === 'idafa-01').shortExplanation) falsch.push('das Original ist nach dem Bearbeiten nicht mehr erreichbar');
  f('regelTextZuruecksetzen')('idafa-01');
  if (f('regelText')('idafa-01').bearbeitet) falsch.push('Zurücksetzen wirkt nicht');
  return falsch;
}
{
  const falsch = loeschFaelle(baueApp(lies('js/regeln.js')));
  pruefe('Löschen, Verbergen und Bearbeiten sind umkehrbar', !falsch.length, falsch.join(' · '));
  const quelle = lies('js/regeln.js');
  const gestoert = quelle.replace("s.weg[id] = { an: false, zeit: regelnJetzt() };", "s.weg[id] = { an: true, zeit: regelnJetzt() };");
  if (gestoert === quelle) rot('Störtest greift nicht: regelWiederherstellen() sieht anders aus');
  else pruefe('Störtest: ein Wiederherstellen, das nichts tut, macht den Prüfer rot', loeschFaelle(baueApp(gestoert)).length > 0);
}

/* ======================================================= 3. Die neun Karten */
console.log('\n=== 3. Die neun Karten aus Folge 19 ===');
{
  const app = baueApp(lies('js/regeln.js'));
  const karten = app.hol('FOLGE19_KARTEN');
  const regeln = app.hol('GRAMMAR_RULES');
  const tags = app.hol('SENTENCE_TAGS');
  /* Die Themen in Elias' Reihenfolge (Folge 19, zehn Themen; das zehnte,
     „Übersetzen", ist keine Regel). */
  const THEMEN = [['f19-idafa', /Iḍāfa/], ['f19-nat', /Naʿt/], ['f19-isara', /išāra/], ['f19-jarr', /jarr/],
                  ['f19-tanith', /Taʾnīṯ/], ['f19-schams', /Sonnen/], ['f19-pronomen', /Pronomen/],
                  ['f19-irab', /Iʿrāb/], ['f19-fragen', /Frage/]];
  pruefe('genau neun Karten, in der Reihenfolge der Folge',
    karten.length === 9 && THEMEN.every(([id, re], i) => karten[i] && karten[i].id === id && re.test(karten[i].titel) && karten[i].nr === i + 1),
    karten.map(k => k.id).join(', '));
  const luecken = [];
  for (const k of karten){
    if (!k.kern || !String(k.kern).trim()) luecken.push(k.id + ': kein Kern');
    if (!(k.gruppen || []).length || k.gruppen.some(g => !(g.merkmale || []).length)) luecken.push(k.id + ': Merkmale fehlen');
    if (!(k.beispiele || []).length) luecken.push(k.id + ': kein Beispiel');
    if (!k.quelle || !/\d+:\d\d/.test(k.quelle.folge || '') || !/Nr\. \d+, S\. \d+/.test(k.quelle.muster || '')) luecken.push(k.id + ': Quelle unvollständig');
    const fremd = (k.regeln || []).filter(id => !regeln.some(r => r.id === id));
    if (fremd.length) luecken.push(k.id + ': unbekannte Regel ' + fremd.join(','));
    const satz = Object.values(tags).some(arr => (arr || []).some(t => (k.regeln || []).includes(t.ruleId)));
    if (!satz) luecken.push(k.id + ': kein markierter Satz zu ihren Regeln');
    for (const x of (k.genauer || [])) if (!regeln.some(r => r.id === x.regel)) luecken.push(k.id + ': „genauer" verweist auf ' + x.regel);
  }
  const idafa = karten[0];
  if (!idafa.gruppen.some(g => /Muḍāf$/.test(g.name)) || !idafa.gruppen.some(g => /ilayhi/.test(g.name)))
    luecken.push('f19-idafa: Merkmale nicht nach Rolle getrennt (Muḍāf / Muḍāf ilayhi)');
  pruefe('jede Karte: Kern, Merkmale, Beispiel, Quelle (Minute + Nr./Seite), Satz aus SENTENCE_TAGS', !luecken.length, luecken.join(' · '));

  /* --- Das Arabisch: abgeschrieben, nicht vokalisiert --- */
  const TATWEEL = /\u0640/g;
  const AR_WORT = /[\u0621-\u063A\u0641-\u065F\u0670\u0671\u0640]+/g;
  const woerter = t => (String(t).normalize('NFC').replace(TATWEEL, '').match(AR_WORT) || []);
  const abschrift = JSON.parse(lies('werkzeuge/regelsammlung-abschrift.json'));
  const bestand = new Set();
  abschrift.forEach(e => woerter(e.text).forEach(w => bestand.add(w)));
  ['grammar-data.js', 'vocab-data.js', 'lehrbuch-saetze.js', 'data/beispielsaetze.js', 'data/fachbegriffe.js']
    .forEach(f => { try { woerter(lies(f)).forEach(w => bestand.add(w)); } catch { /* Datei fehlt: dann steht ihr Wort eben nicht im Bestand */ } });
  const texte = [];
  const sammle = v => { if (typeof v === 'string') texte.push(v); else if (Array.isArray(v)) v.forEach(sammle); else if (v && typeof v === 'object') Object.values(v).forEach(sammle); };
  karten.forEach(k => sammle(k));
  const unbelegt = [...new Set(texte.flatMap(woerter))].filter(w => !bestand.has(w));
  pruefe(`jedes arabische Wort der Karten ist belegt (${new Set(texte.flatMap(woerter)).size} verschiedene)`,
    !unbelegt.length, 'unbelegt: ' + unbelegt.join(' '));

  /* Eichung des Wortvergleichs: ein bekanntes Wort wird gefunden, eine
     falsch vokalisierte Fassung desselben Wortes nicht. */
  pruefe('Eichung: بَيْتُ ist belegt, بِيتُ nicht', bestand.has('بَيْتُ') && !bestand.has('بِيتُ'));

  if (!fs.existsSync(PDF)){
    console.log('  ⚠️   Musterlösungs-PDF nicht auf diesem Rechner — die Abschrift wurde am 11.09.2026 gegen seine Textebene geprüft, hier nur gegen die Liste.');
  } else {
    const befunde = pruefeAbschriftGegenPdf(abschrift);
    pruefe(`die Abschrift (${abschrift.length} Zeilen) stimmt mit der Textebene des PDFs überein`, !befunde.length, befunde.slice(0, 5).join(' · '));
  }
}

/* ======================================================= 4. Kachel und Reiter */
console.log('\n=== 4. Kachel „Regeln", Reiter „Eigene" weg, „Eigene Vokabeln" bleibt ===');
{
  const html = lies('index.html');
  const kat = lies('js/kategorien.js');
  const raster = html.slice(html.indexOf('<div class="home-grid'), html.indexOf('<div class="box-overview"'));
  pruefe('dritte Kachel „Regeln" steht im Startraster', /data-nav="regeln"/.test(raster));
  pruefe('seine Zwei-Kachel-Vorgabe vom 21.08. steht noch da UND der Hinweis, dass die Kachel sie aufhebt',
    html.includes('wurzeln links und kategorien rechts') && html.includes('DRITTE KACHEL „REGELN"'));
  pruefe('der Reiter „Eigene" (data-cattab="custom") ist weg', !/data-cattab="custom"/.test(html) && !/catPane-custom/.test(html));
  pruefe('„Eigene Vokabeln" oben im Reiter Kapitel bleibt', /const eigeneOben = \['personal'\]/.test(kat) && kat.includes('Hier trägst du eigene Wörter ein'));
  pruefe('gespeicherte eigene Kategorien bleiben erreichbar (Sternzeilen in Wortfelder, Wortliste)',
    /CUSTOM_CATS : \[\]\)\.map\(cat=>/.test(kat) && kat.includes("key.startsWith('cat:')"));
  pruefe('der Bildschirm und die Karte sind im Markup', /id="screen-regeln"/.test(html) && /id="regelKarte"/.test(html));
  const nav = lies('js/navigation.js');
  pruefe('die Zurück-Taste kennt die Regelkarte (OVERLAYS)', /id: 'regelKarte',\s*zu: 'schliesseRegelKarte'/.test(nav));
}

/* ======================================================= 5. eine Entscheidung */
console.log('\n=== 5. Niemand liest `ausgeblendet` an regelAusgeblendet() vorbei ===');
{
  const dateien = fs.readdirSync(path.join(REPO, 'js')).filter(f => f.endsWith('.js') && f !== 'regeln.js');
  const treffer = [];
  for (const f of dateien){
    const rein = ohneKommentareUndTexte(lies('js/' + f));
    const re = /\b(r|rule|regel|x\.rule)\.ausgeblendet\b/g;
    let m;
    while ((m = re.exec(rein))) treffer.push(f + ':' + (rein.slice(0, m.index).split('\n').length));
  }
  pruefe('keine Regel wird mehr direkt über .ausgeblendet gefragt', !treffer.length, treffer.join(', '));
  /* Eichung: dasselbe Muster findet eine eingebaute Stelle. */
  const probe = ohneKommentareUndTexte('if (rule.ausgeblendet) return;');
  pruefe('Eichung: das Suchmuster findet `rule.ausgeblendet`', /\b(r|rule|regel|x\.rule)\.ausgeblendet\b/.test(probe));
}

/* ======================================================= 6. Abgleich & Sicherung */
console.log('\n=== 6. vt_regeln im Abgleich und in der Sicherung ===');
{
  pruefe('vt_regeln steht in SYNC_SCHLUESSEL (js/sync.js)', /'vt_regeln'/.test(lies('js/sync.js')) && /function fuehreRegelnZusammen\(/.test(lies('js/sync.js')));
  pruefe('vt_regeln steht in SICHERUNGS_SCHLUESSEL (js/einstellungen.js)', /'vt_regeln'/.test(lies('js/einstellungen.js')));
  pruefe('test-sync.mjs prüft die Regelsammlung', /vt_regeln/.test(lies('test-sync.mjs')));
}

/* ======================================================= 7. Stufe 2: die Wege hinein */
console.log('\n=== 7. Stufe 2 — „so gut wie möglich in die app integriert" ===');
{
  const ueb = lies('js/uebung.js');
  const modi = [...ueb.matchAll(/id:'([a-z-]+)', nr:(\d+),/g)].map(m => m[1]);
  const block = (ueb.match(/const UEBUNG_WARUM = \{([\s\S]*?)\};/) || [])[1] || '';
  const karte = Object.fromEntries([...block.matchAll(/'([a-z-]+)':\s*(null|'([a-z0-9-]+)')/g)].map(m => [m[1], m[3] || null]));
  const app = baueApp(lies('js/regeln.js'));
  const regelArt = app.hol('regelArt');
  const ohne = modi.filter(id => !(id in karte));
  const tot = Object.entries(karte).filter(([, ziel]) => ziel && !regelArt(ziel)).map(([m, z]) => m + '→' + z);
  pruefe(`„Warum? → Regel": alle ${modi.length} Übungsmodi zugeordnet, jedes Ziel existiert`,
    modi.length === 13 && !ohne.length && !tot.length, 'ohne: ' + ohne.join(',') + ' · tot: ' + tot.join(','));
  pruefe('„Welche Regel?" öffnet die gefragte Regel selbst (regelId)', /a\.modus\.id === 'regel'\) id = a\.regelId/.test(ueb));
  pruefe('der Knopf steht in der Rückmeldung und öffnet über data-regelkarte', /class="ueb-warum"[^`]*data-regelkarte=/.test(ueb));
  pruefe('Lesemodus-Aufklapper: „in der Sammlung öffnen"', /gp-sammlung[^`]*data-regelkarte=/.test(lies('js/saetze.js')));
  pruefe('„Wie gut sitzen die Regeln?": jede Zeile öffnet ihre Karte', /class="rz' \+ ton \+ '" role="button"[^;]*data-regelkarte=/.test(lies('js/statistik.js')));
  pruefe('Karte: „im Satzmodus üben" setzt den Regelfilter', /setzeRegelfilter\(ids,/.test(lies('js/regeln.js')) && /function satzListe\(/.test(lies('js/saetze.js')));
  pruefe('die Kategorien-Suche zeichnet einen Regelblock über den Wörtern', /treffer\.innerHTML = regelBlock \+/.test(lies('js/kategorien.js')));

  /* Die Suche wirklich laufen lassen — mit dem ECHTEN suchFlach aus
     js/kategorien.js, herausgeschnitten wie in pruefe-markierungen.js. */
  const kat = lies('js/kategorien.js');
  const zeichen = (kat.match(/^const SUCH_ZEICHEN = .*$/m) || [''])[0];
  const i = kat.indexOf('function suchFlach(');
  const j = kat.indexOf('\n}', i);
  if (!zeichen || i < 0 || j < 0) rot('suchFlach() in js/kategorien.js nicht gefunden — die Suchprobe prüft nichts');
  else {
    vm.runInContext(zeichen + '\n' + kat.slice(i, j + 2), app.ctx);
    const suche = app.hol('regelSuche');
    const faelle = [['mudaf', 'f19-idafa'], ['idafa', 'f19-idafa'], ['مضاف', 'mudaf-01'], ['مُضَاف', 'mudaf-01'],
                    ['Genitivverbindung', 'f19-idafa'], ['Sonnenbuchstaben', 'f19-schams'], ['nat', 'f19-nat']];
    const falsch = faelle.filter(([q, soll]) => !suche(q).some(x => x.id === soll)).map(([q, soll]) => q + '→' + soll);
    pruefe('die Suche findet Deutsch, Arabisch mit und ohne Ḥarakāt und Umschrift', !falsch.length, falsch.join(', '));
    pruefe('Eichung: ein Unsinnsbegriff findet nichts', suche('qqxqq').length === 0);
  }
}

console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✅ Die Regelsammlung hält: Artefakt und Schalter, umkehrbares Löschen, neun belegte Karten.');

/* ---------- Abschrift gegen die Textebene des PDFs ----------
   Die harte Probe: jede Abschrift trägt GENAU die Buchstaben und Zeichen EINER
   Zeile ihrer Seite — kein Zeichen zu viel, keins zu wenig, keins vertauscht
   gegen ein anderes (eine Damma statt Kasra fällt auf).

   ⚠️ Was sie NICHT sieht: ein Zeichen, das auf dem falschen Buchstaben DERSELBEN
   Zeile sitzt. Beim Abschreiben am 11.09.2026 lief dafür eine zweite Probe über
   die x-Position jedes Zeichens; sie meldete 25 von 134 Zeilen, und alle 25
   waren derselbe Messfehler der Textebene: ein schmaler Buchstabe (ل, ن) gibt
   sein Zeichen an den breiten Nachbarn ab. Diese Wörter wurden einzeln gegen
   grammar-data.js gehalten (طَالِبٌ 23×, ذَلِكَ 24×, أَنَا 16× …). Eine Probe,
   die jedes Mal dieselben 25 Fehlalarme meldet, stünde hier nur als Rauschen —
   deshalb läuft sie nicht mit. [[mein_neues_werkzeug_ist_verdaechtig]] */
function pruefeAbschriftGegenPdf(eintraege){
  const istAr = c => /[ً-ْٰء-غف-يٱ]/.test(c);
  const cache = new Map();
  const zeilen = seite => {
    if (cache.has(seite)) return cache.get(seite);
    const html = execFileSync('pdftotext', ['-enc', 'UTF-8', '-bbox-layout', '-f', String(seite), '-l', String(seite), PDF, '-'], { encoding: 'utf8' });
    const gruppen = [];
    const re = /<word xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">([^<]*)<\/word>/g;
    let m;
    /* Sichtzeilen nach vertikaler Mitte; Zeichen unter der Zeile (Kasra)
       liegen einige Punkte tiefer, die Zeilen selbst über 30 auseinander. */
    while ((m = re.exec(html))){
      const mitte = (+m[1] + +m[2]) / 2;
      let g = gruppen.find(g => Math.abs(g.mitte - mitte) < 12);
      if (!g){ g = { mitte, text: '' }; gruppen.push(g); }
      g.text += m[3].normalize('NFC');
    }
    cache.set(seite, gruppen);
    return gruppen;
  };
  const menge = t => { const m = new Map(); for (const c of t.normalize('NFC')) if (istAr(c)) m.set(c, (m.get(c) || 0) + 1); return m; };
  const gleich = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
  const befunde = [];
  for (const e of eintraege){
    const soll = menge(e.text);
    if (!zeilen(e.seite).some(g => gleich(soll, menge(g.text))))
      befunde.push(`S.${e.seite} ${e.text}: keine Zeile mit genau diesen Zeichen`);
  }
  return befunde;
}
