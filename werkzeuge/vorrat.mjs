/* vorrat.mjs -- Haelt Eselsbruecken und Beispielsaetze fuer die Kapitel
 * aktuell, die Elias WIRKLICH schon hat. Nicht fuer alle 4.446 Woerter.
 * =====================================================================
 *
 * WARUM ES DIESES WERKZEUG GIBT
 *
 * Elias am 19.08.2026: „es sollen erstmal nur die vokabeln vorschläge
 * bekommen, mit denen ich bereits zu tun habe. es macht keinen sinn alle 4000
 * wörter einen vorschlag zu machen weil wir wissen ja nicht wie in 2 jahren
 * mein wissenstand ist und da könnte einen aktueller vorschlag viel mehr bei
 * mir bewirken als ein uralter."
 *
 * ⭐ Das ist der Kern: eine Eselsbruecke ist kein Datensatz, sondern eine
 * BRUECKE — und sie traegt nur, wenn das andere Ufer schon steht. Wer heute
 * fuer Kapitel 20 schreibt, baut auf ein Ufer, das es noch nicht gibt.
 *
 * ⛔ DIE LUECKE, DIE DIESES WERKZEUG SCHLIESST
 *
 * Der Freischaltstand steht in `js/kern.js` als FREIGESCHALTET — von Hand
 * eingetragen, mit Datum im Kommentar. Am 19.08.2026 nachgemessen: KEIN
 * einziges Werkzeug und keine Routine zieht ihn nach. `grep -rn FREIGESCHALTET
 * werkzeuge/ Automation/prompts/` findet nichts.
 *
 * Damit haengt die ganze Kette an einer Zeile, die jemand von Hand pflegen
 * muesste — und genau das ist die Sorte Aufgabe, an die sich niemand erinnert.
 * `pruefe-eselsbruecken.js` Abschnitt 6 prueft zwar gegen FREIGESCHALTET, aber
 * es prueft gegen einen Stand, der veralten kann, ohne dass es auffaellt.
 * [[eingefrorenes_feld_ist_kein_zustand]]
 *
 * WAS ES TUT
 *
 *   node werkzeuge/vorrat.mjs                  Uebersicht, Exitcode 2 bei Rueckstand
 *   node werkzeuge/vorrat.mjs --knapp          eine Zeile, fuer Routinen
 *   node werkzeuge/vorrat.mjs --stand <datei>  FREIGESCHALTET aus get_unlocked_chapters nachziehen
 *   node werkzeuge/vorrat.mjs --lernstand <datei>  Lernstand aus get_learning_progress nachziehen
 *   node werkzeuge/vorrat.mjs --auftrag <datei> Arbeitsauftrag fuer die Sitzung schreiben
 *   node werkzeuge/vorrat.mjs --fenster 3      wie viele Kapitel vorausgearbeitet wird (Standard 3)
 *
 * ⭐⭐ WARUM „FREIGESCHALTET" ALS AUSLOESER NICHT REICHT
 *
 * Elias am 19.08.2026: „es könnte sein das ich zb aus interesse alle kapitel
 * oder alle bücher auswähle (dann soll es natürlich nicht ausschlagen) aber
 * 1-3 kapitel sind realistisch."
 *
 * Genau das ist der Unterschied zwischen KANN und IST. Am selben Tag gemessen:
 * arabicroots meldete madina-2 als komplett freigeschaltet — alle 24 Kapitel,
 * 445 Woerter — waehrend Elias tatsaechlich bei madina-1 Kapitel 11 stand. Wer
 * auf „freigeschaltet" hoert, haette 1.335 Texte als Rueckstand gemeldet, die
 * niemand braucht.
 *
 * Deshalb zwei Groessen, und sie duerfen nie verwechselt werden:
 *   FREIGESCHALTET  was die Schule geoeffnet hat        (js/kern.js)
 *   LERNSTAND       wo er wirklich geuebt hat           (data/lernstand.json)
 * Gearbeitet wird im FENSTER: Lernstand + 1 bis + 3 Kapitel, und nur was
 * darin liegt UND freigeschaltet ist.
 *
 * ⚠️ `--stand` braucht eine Datei, weil nur eine Claude-Sitzung den
 * arabicroots-MCP erreichen kann. Die Sitzung ruft get_unlocked_chapters,
 * schreibt das Ergebnis weg, das Skript zieht nach. So bleibt das Werkzeug
 * offline pruefbar und sagt ehrlich, wie alt sein Wissen ist.
 *
 * ⚠️ Der Buchabzug (data/vokabeln-*.js) darf nach arabicroots' AGB nicht ins
 * Repo. Er wird hier nur GELESEN.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

/* fileURLToPath, nicht von Hand zerlegen: der Ordner heisst "1. Workspace"
   mit Leerzeichen, das steht in import.meta.url als %20. */
const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const p      = (...t) => path.join(WURZEL, ...t);

const ARG    = process.argv.slice(2);
const KNAPP  = ARG.includes('--knapp');
const iStand = ARG.indexOf('--stand');
const iLern  = ARG.indexOf('--lernstand');
const iAuftr = ARG.indexOf('--auftrag');
const iFenst = ARG.indexOf('--fenster');
/* Drei Kapitel voraus — Elias' eigene Zahl: „1-3 kapitel sind realistisch." */
const FENSTER = iFenst >= 0 ? Math.max(1, Number(ARG[iFenst + 1]) || 3) : 3;
const LERNDATEI = 'data/lernstand.json';

/* ---------- Dateien in einer Kiste laden ---------- */
const kiste = { window: {} };
kiste.globalThis = kiste;
vm.createContext(kiste);
function laden(rel, pflicht = true){
  const datei = p(rel);
  if (!fs.existsSync(datei)){
    if (pflicht) { console.error('  FEHLT: ' + rel); process.exit(1); }
    return false;
  }
  vm.runInContext(fs.readFileSync(datei, 'utf8'), kiste, { filename: rel });
  return true;
}
/* ⛔ `const` in einer vm-Kiste landet im lexikalischen Bereich, NICHT als
   Eigenschaft am Kontextobjekt. kiste.VOCAB_DATA ist deshalb undefined,
   obwohl die Datei sauber gelaufen ist. Abholen nur ueber einen Ausdruck. */
const hol = (name) =>
  vm.runInContext('typeof ' + name + ' !== "undefined" ? ' + name + ' : null', kiste);

/* ---------- FREIGESCHALTET lesen und schreiben ---------- */
const KERN = p('js/kern.js');

function freischaltungLesen(){
  const q = fs.readFileSync(KERN, 'utf8');
  const block = q.match(/const FREIGESCHALTET = \{([\s\S]*?)\};/);
  if (!block) { console.error('  FREIGESCHALTET in js/kern.js nicht gefunden.'); process.exit(1); }
  const frei = {};
  block[1].split(/\r?\n/).forEach(z => {
    const m = z.match(/'([^']+)'\s*:\s*\[([^\]]*)\]/);
    if (m) frei[m[1]] = m[2].split(',').map(x => Number(x.trim()))
                            .filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
  });
  const datum = (block[1].match(/abgefragt am ([0-9.]+)/) || [])[1] || 'unbekannt';
  return { frei, datum };
}

/* ⭐⭐ ZWEI QUELLEN, UND DIE GROESSERE GILT
   Elias am 19.08.2026: „es wäre glaube ich gut, wenn sie rücksicht auf meine
   app und arabicroots nimmt. wenn eine der beiden bis zu 3 nächsten kapiteln
   frei schaltet dann soll bearbeitet werden."

   Die App fuehrt ihre eigene Auswahl in SETTINGS.buecher, kapitelgenau:
     { 'madina-1': [1,2,3,...,11] }
   Sie liegt in `vt_settings` und wird ueber js/sync.js in den Cloudflare-KV
   abgeglichen — also von aussen lesbar:

     npx wrangler kv key get --namespace-id=<id> "stand:<mail>" --remote

   Am 19.08.2026 gelesen: {"madina-1":[1,2,3,5,4,6,7,8,9,10,11]} — deckt sich
   mit seiner Angabe. ⚠️ Die Liste ist NICHT sortiert (5 vor 4); wer das
   letzte Element statt des groessten nimmt, liest 11 als 11 und beim naechsten
   Mal vielleicht 4. */
function auswahlAusKvStand(text){
  let roh;
  try { roh = JSON.parse(text); }
  catch (e) { console.error('  KV-Datei ist kein JSON: ' + e.message); process.exit(1); }
  let s;
  try { s = JSON.parse((roh.daten && roh.daten.vt_settings) || '{}'); }
  catch (e) { console.error('  vt_settings ist kein JSON: ' + e.message); process.exit(1); }
  const frei = {};
  Object.entries(s.buecher || {}).forEach(([b, liste]) => {
    const zahlen = (Array.isArray(liste) ? liste : []).map(Number)
      .filter(n => !Number.isNaN(n)).sort((a, b2) => a - b2);
    if (zahlen.length) frei[b] = zahlen;
  });
  return { frei, stempel: (roh.stempel && roh.stempel.vt_settings) || null };
}

/* Aus get_unlocked_chapters kommt eine Liste wie
     [{ chapter_id: "madina-1-chapter-11" }, ...]
   Daraus wird { 'madina-1': [1,...,11] }. */
function freischaltungAusJson(text){
  let roh;
  try { roh = JSON.parse(text); }
  catch (e) { console.error('  Datei ist kein JSON: ' + e.message); process.exit(1); }
  const liste = Array.isArray(roh) ? roh : (roh.chapters || roh.data || []);
  const frei = {};
  liste.forEach(e => {
    const id = String(e.chapter_id || e.chapterId || e || '');
    const m = id.match(/^(.*)-chapter-(\d+)$/);
    if (!m) return;
    (frei[m[1]] = frei[m[1]] || []).push(Number(m[2]));
  });
  Object.keys(frei).forEach(b => frei[b] = [...new Set(frei[b])].sort((a, b) => a - b));
  return frei;
}

function freischaltungSchreiben(neu, heute){
  const q = fs.readFileSync(KERN, 'utf8');
  const nl = (q.match(/\r\n/g) || []).length > (q.match(/\n/g) || []).length / 2 ? '\r\n' : '\n';

  /* ⛔ ELIAS' EIGENE KOMMENTARE ÜBERLEBEN LASSEN.
     Der Block wird neu gebaut, und bis zum 20.08.2026 fiel dabei alles weg,
     was hinter einer Buchzeile stand — darunter

       'madina-1': [1,…,12],   // Elias am 20.08.2026: „ich habe uebrigens
                                  kapitel 12 freigeschaltet"

     Das ist die einzige Stelle, an der steht, WARUM diese Zahl von der
     gemessenen abweicht. Ohne sie sieht der nächste Leser nur noch einen
     Widerspruch und keine Begründung. [[erfundene_begruendung_schliesst_den_fall]] */
  const bisher = {};
  const mBlock = q.match(/const FREIGESCHALTET = \{([\s\S]*?)\n\};/);
  if (mBlock){
    for (const m of mBlock[1].matchAll(/'([^']+)':\s*\[[^\]]*\],?\s*(\/\/[^\n\r]*)/g)){
      /* Der erzeugte Standardkommentar wird nicht mitgeschleppt. */
      if (!/^\/\/\s*arabicroots, abgefragt am/.test(m[2].trim())) bisher[m[1]] = m[2].trim();
    }
  }

  const namen = Object.keys(neu).sort();
  const zeilen = namen.map((b, i) => {
    const komma = i < namen.length - 1 ? ',' : '';
    const eigen = bisher[b] ? '   ' + bisher[b] : '';
    return `  '${b}': [${neu[b].join(',')}]${komma}${eigen}`;
  });
  /* Der Stand-Kommentar steht jetzt ÜBER dem Block statt hinter der letzten
     Zeile — dort kollidiert er nicht mehr mit einem eigenen Kommentar. */
  const block = 'const FREIGESCHALTET = {' + nl
    + '  // Stand: arabicroots' + (ARG.includes('--app') ? ' + App-Auswahl' : '')
    + ', abgefragt am ' + heute + nl
    + zeilen.join(nl) + nl
    + '};';
  const raus = q.replace(/const FREIGESCHALTET = \{[\s\S]*?\n\};/, block);
  if (raus === q) { console.error('  Ersetzung hat nichts geaendert.'); process.exit(1); }
  fs.writeFileSync(KERN, raus, 'utf8');
}

/* ---------- Lernstand: wo hat er WIRKLICH geuebt ---------- */

function lernstandLesen(){
  const d = p(LERNDATEI);
  if (!fs.existsSync(d)) return null;
  try { return JSON.parse(fs.readFileSync(d, 'utf8')); }
  catch (e) { console.error('  ' + LERNDATEI + ' ist kein JSON: ' + e.message); return null; }
}

/* Aus get_learning_progress kommen Einzelversuche je Vokabel, angereichert mit
   bookSlug und chapterPosition. Daraus wird je Buch das hoechste Kapitel, in
   dem tatsaechlich geuebt wurde.

   ⚠️ Gespeichert wird NUR diese abgeleitete Zahl, nicht der Rohbestand: die
   Einzelversuche sind Elias' persoenliche Lerndaten und haben im Repo nichts
   verloren. Zwei Zahlen je Buch reichen fuer den Zweck vollstaendig. */
function lernstandAusJson(text){
  let roh;
  try { roh = JSON.parse(text); }
  catch (e) { console.error('  Datei ist kein JSON: ' + e.message); process.exit(1); }
  const liste = Array.isArray(roh) ? roh : (roh.progress || roh.data || roh.items || []);
  const je = {};
  liste.forEach(e => {
    const buch = e.bookSlug || e.book_slug || e.buch;
    const kap  = Number(e.chapterPosition ?? e.chapter_position ?? e.chapter);
    if (!buch || Number.isNaN(kap)) return;
    /* ⛔ Nur Woerter zaehlen, die wirklich ANGEFASST wurden. Ein Datensatz mit
       null Versuchen bedeutet „steht bereit", nicht „geuebt" — und genau die
       Verwechslung wuerde das Fenster wieder auf alles aufreissen. */
    /* ⚠️ Die Felder heissen `total`, `correct`, `wrong` — am 19.08.2026 am
       echten Abzug nachgesehen, nicht geraten. Meine erste Fassung suchte nach
       `incorrect` und haette bei jedem Wort null Versuche gezaehlt: das
       Fenster waere leer geblieben und die Routine haette „nichts zu tun"
       gemeldet, obwohl Rueckstand da war. */
    const versuche = Number(e.total ?? (Number(e.correct || 0) + Number(e.wrong || 0)));
    if (!(versuche > 0)) return;
    je[buch] = je[buch] || { hoechstesKapitel: 0, geuebteWoerter: 0 };
    je[buch].geuebteWoerter++;
    if (kap > je[buch].hoechstesKapitel) je[buch].hoechstesKapitel = kap;
  });
  return je;
}

if (iLern >= 0){
  const quelle = ARG[iLern + 1];
  if (!quelle){ console.error('  --lernstand braucht eine Datei.'); process.exit(1); }
  const neu = lernstandAusJson(fs.readFileSync(quelle, 'utf8'));
  if (!Object.keys(neu).length){
    console.log('  Keine geuebten Vokabeln in der Datei gefunden — nichts geaendert.');
    process.exit(0);
  }
  const alt = lernstandLesen() || {};
  /* ⚠️ Gelesen werden MUSS `gemessen` — genau das schreibt diese Funktion
     weiter unten. Bis zum 19.08.2026 stand hier `alt.buecher`, der Feldname aus
     der allerersten Fassung der Datei. Solange die alte Datei noch danebenlag,
     stimmte der Vergleich zufaellig; ab dem ersten neu geschriebenen Stand war
     `alt.buecher` undefined und JEDES Buch waere als „Kapitel — → N" gemeldet
     worden. Eine Meldung, die bei jedem Lauf anschlaegt, sagt nichts mehr.
     `buecher` bleibt als Rueckfall stehen, damit ein alter Stand noch passt. */
  const altGemessen = alt.gemessen || alt.buecher || {};
  const aenderungen = [];
  Object.entries(neu).forEach(([b, z]) => {
    const a = (altGemessen[b] && altGemessen[b].hoechstesKapitel) || 0;
    if (a !== z.hoechstesKapitel) aenderungen.push(`  ${b}: Kapitel ${a || '—'} → ${z.hoechstesKapitel}`);
  });
  /* ⛔⛔ DIE GEMESSENE ZAHL IST NICHT SEIN LERNSTAND.
     Am 19.08.2026 gemessen: get_learning_progress meldete madina-1 bis
     Kapitel 23 und madina-2 bis Kapitel 31 — Elias sagte am selben Tag
     ausdruecklich „ich bin bei madina-1 kapitel 11, madina-2 ist nur
     freigeschaltet".
     Beides stimmt: die Zahl misst, WOMIT ER ABGEFRAGT WURDE, und sein eigener
     Vokabeltrainer fragt alles ab, was er angehakt hat. Genau der Fall, den er
     vorhergesagt hat („aus interesse alle kapitel ... auswählen").
     Deshalb bleibt `angabe` massgeblich und wird hier NIE ueberschrieben; die
     Messung steht als `gemessen` daneben und dient nur der Gegenprobe.
     [[kennzeichen_mit_zwei_ursachen]] */
  const vorher = lernstandLesen();
  fs.writeFileSync(p(LERNDATEI), JSON.stringify({
    _hinweis: 'angabe = was Elias selbst gesagt hat, MASSGEBLICH fuer das Fenster. '
            + 'gemessen = abgeleitet aus get_learning_progress, nur Gegenprobe — '
            + 'die Zahl misst, womit abgefragt wurde, nicht wo er im Kurs steht.',
    angabe: (vorher && vorher.angabe) || {},
    angabeVom: (vorher && vorher.angabeVom) || null,
    /* ⛔ Der Wortlaut ist der BELEG fuer `angabe` und muss mit ihr zusammen
       ueberleben. Bis zum 19.08.2026 fehlte diese Zeile: `--lernstand` baute
       das Objekt neu auf und liess `_angabeWortlaut` dabei jedes Mal fallen.
       Beim Wartungslauf am 19.08. 22:00 ist genau das passiert — Elias' Satz
       „nein, ich bin bei madina-1 kapitel 11, madina-2 ist nur freigeschaltet"
       war nach einem einzigen Aufruf weg. Uebrig blieb eine Zahl ohne Quelle,
       und die ist nach E.1 nichts wert. */
    _angabeWortlaut: (vorher && vorher._angabeWortlaut) || null,
    gemessenAm: new Date().toISOString().slice(0, 10),
    gemessen: neu
  }, null, 2), 'utf8');
  console.log('  Lernstand geschrieben nach ' + LERNDATEI + ':');
  Object.entries(neu).forEach(([b, z]) =>
    console.log(`    ${b}: hoechstes geuebtes Kapitel ${z.hoechstesKapitel} (${z.geuebteWoerter} Woerter angefasst)`));
  if (aenderungen.length){ console.log('  Veraendert:'); aenderungen.forEach(z => console.log(z)); }
  else console.log('  (unveraendert gegenueber vorher)');
  process.exit(0);
}

/* ---------- Bestand einsammeln ---------- */
laden('vocab-data.js');
laden('data/eselsbruecken.js');
laden('data/eselsbruecken-alt.js');
laden('data/buecher.js');
const hatSaetze = laden('data/beispielsaetze.js', false);
/* ⛔⛔ Am 19.08.2026 dazu, nach Elias' Ansage: „die neuen vokabeln müssen auch
   automatisch in den satzmodus und in die kategorien direkt automatisch
   eingetragen werden … alles muss automatisch ablaufen sobald neue kapiteln
   freigeschaltet wurden."

   Bis dahin mass dieses Werkzeug ZWEI von vier Dingen: hat das Wort drei
   Eselsbruecken, hat es einen Beispielsatz. Es mass NICHT, ob der Satz
   ueberhaupt erreichbar ist und ob das Wort in einer Kategorie steht.

   Und genau das ist durchgefallen: die fuenf Saetze, die ich am selben
   Nachmittag geschrieben habe, hatten KEINE Markierung. Sie standen damit nur
   unter „Alle", in keinem Thema, und erzeugten keine einzige Uebungsaufgabe —
   waehrend `vorrat.mjs` „alle 154 vollstaendig" meldete.
   [[daten_ohne_zugang]]: eingetragen ist nicht erreichbar. */
laden('grammar-data.js');
laden('wortfelder-data.js', false);
/* ⛔⛔ WEG 3 UND 4 — Elias am 20.08.2026: „ich habe viele neue wörter
   freigeschaltet und neue eigene vokabeln hinzugefügt. sie müssen das volle
   programm bekommen."

   Bis dahin lief dieses Werkzeug NUR ueber `BUECHER x kapitelImFenster(slug)`
   und sah damit ausschliesslich Buchvokabeln. Seine 11 eigenen Vokabeln und
   die 15 Fachbegriffe waren unsichtbar — gemessen am selben Tag: 11 von 11
   ohne Beispielsatz, 9 von 15 Fachbegriffen ohne Satz, und kein Werkzeug
   meldete es je.

   ⚠️ Beide liegen NICHT unter window.VOKABELN: die eigenen unter
   window.EIGENE_VOKABELN (damit sie in der Buchauswahl kein achtes Buch
   werden), die Fachbegriffe unter FACHBEGRIFF_VOKABELN. Genau daran ist auch
   pruefe-taschkil.js vorbeigelaufen. [[dritte_satzquelle]] */
laden('data/fachbegriffe.js', false);
laden('data/vokabeln-eigene.js', false);
/* ⛔⛔ 20.08.2026 — DIE NEUN UNGEMESSENEN PUNKTE.
   Bis heute mass dieses Werkzeug VIER Dinge: Eselsbruecken, Beispielsatz,
   Markierung, Kategorie. Das volle Programm (VOLLES-PROGRAMM.md) hat aber
   DREIZEHN. Neun davon konnte die Wartungsroutine gar nicht melden — und was
   kein Werkzeug misst, wird nie ergaenzt. [[werkzeug_ohne_aufrufer]]

   Gemessen, was das kostet (js/uebung.js Zeile 399 und 451):
     ohne `gender` -> Uebung 11 und 12 erzeugen fuer das Wort NULL Aufgaben
     ohne `femSg`  -> Uebung 13 desgleichen
     ohne `type`   -> Kategorie, Statistik, Funktionsanzeige, Uebung 8
     ohne `sg`     -> js/hoeren.js ueberspringt das Wort

   ⚠️ Ein leeres Feld ist aber nicht dasselbe wie eine Luecke: نَعَمْ hat keine
   Wurzel, اليَابَانُ keinen Plural. Die Unterscheidung steht in
   data/feld-ausnahmen.js — ohne sie bestuende die Meldung zu vier Fuenfteln
   aus Nicht-Fehlern. [[kennzeichen_mit_zwei_ursachen]] */
laden('data/feld-ausnahmen.js', false);

const VOCAB   = hol('VOCAB_DATA') || [];
const BUCH_EB = hol('BUCH_ESELSBRUECKEN') || {};
const ALT     = hol('ESELSBRUECKEN_ALT') || {};
const BUECHER = hol('BUECHER') || [];
const SAETZE  = hol('BEISPIELSAETZE') || {};

const eigen = new Map(VOCAB.map(w => [String(w.id), w]));

/* ⛔ Drei Wege zu einer Eselsbruecke, und ein Zaehlwerkzeug muss ALLE kennen.
   Am 19.08.2026 meldete eine dateibasierte Zaehlung NULL, waehrend die
   laufende App 135 sah — sie kannte den Weg ueber VOCAB_DATA.push() nicht.
   [[vor_dem_eintragen_messen]] */
function vorschlagsZahl(id, wortAusBuch){
  const e = eigen.get(id);
  const liste = [];
  const erst = (e && e.mnemo) || (wortAusBuch && wortAusBuch.mnemo) || BUCH_EB[id];
  if (erst && String(erst).trim()) liste.push(String(erst).trim());
  (ALT[id] || []).forEach(t => {
    const s = String(t || '').trim();
    if (s && liste.indexOf(s) < 0) liste.push(s);   /* wie vorschlagsListe() */
  });
  return liste.length;
}
function hatSatz(id){
  const e = eigen.get(id);
  if (e && e.sentAr && String(e.sentAr).trim()) return true;
  const s = SAETZE[id];
  return !!(s && s.sentAr && String(s.sentAr).trim());
}

/* ⛔⛔ „Hat einen Satz" ist NICHT „ist erreichbar".
   Am 19.08.2026 hatte dieses Werkzeug „alle 154 vollstaendig" gemeldet,
   waehrend die fuenf frisch verfassten Saetze in KEINEM Thema standen und
   NULL Uebungsaufgaben erzeugten: ihnen fehlten die Markierungen.
   Ein Satz ohne Markierung erscheint nur unter „Alle" — dort sieht ihn
   niemand, der ein Thema gewaehlt hat. [[daten_ohne_zugang]] */
const TAGS = hol('SENTENCE_TAGS') || {};
function satzErreichbar(id){
  const t = TAGS[String(id)];
  return Array.isArray(t) && t.length > 0;
}

/* Und dasselbe fuer die Kategorien. ⚠️ Die Wortfelder sind LAENGST automatisch:
   WORTFELDER traegt `typ:'noun'` usw. direkt aus dem Abzug, die Zuordnung
   passiert von selbst. Gemessen wird trotzdem — ein Wort, dessen `type` fehlt
   oder unbekannt ist, faellt sonst lautlos aus jeder Kategorie. */
const FELDER = hol('WORTFELDER') || [];
const FELD_TYPEN = new Set(FELDER.filter(f => f.typ).map(f => f.typ));
/* ⚠️ DAS MISST DIE WORTART-KATEGORIE, NICHT DAS BEDEUTUNGSFELD — und die
   Ausgabe muss das sagen. Bis zum 20.08.2026 stand darüber „ohne Kategorie: 0",
   und das klang nach „alle Wörter sind einsortiert".

   `wortfelder-data.js` hat 27 Einträge, aber nur 7 davon tragen ein `typ`
   (noun, verb, adjective, adverb, expression/phrase, grammar, particle). Die
   übrigen 18 sind BEDEUTUNGSFELDER, und in die kommt ein Wort nicht durch ein
   Feld am Datensatz, sondern durch `passtInsFeld()` in js/kern.js — über seine
   Form oder sein deutsches Stichwort.

   ⭐ Ein Wort ohne Bedeutungsfeld ist deshalb KEIN Mangel am Wort: es heißt,
   dass keines der 18 Felder es abdeckt, und ein neues anzulegen ist Elias'
   Entscheidung. Gemessen wird das von `pruefe-wortfelder.js` (58 % bei
   madina-1) — dort gehört es hin, nicht hierher.
   [[widerspruch_liegt_in_der_beschriftung]] */
function hatKategorie(w){
  if (!FELDER.length) return true;          /* Datei fehlt: nicht behaupten */
  return FELD_TYPEN.has(w.type || w.wordType);
}

/* ---------- Hauptteil ---------- */
const { frei, datum } = freischaltungLesen();

if (iStand >= 0){
  const quelle = ARG[iStand + 1];
  if (!quelle){ console.error('  --stand braucht eine Datei.'); process.exit(1); }
  const vonRoots = freischaltungAusJson(fs.readFileSync(quelle, 'utf8'));

  /* Zweite Quelle: die Auswahl in seiner eigenen App, falls mitgegeben.
     Vereinigt wird, nicht ersetzt — „wenn EINE der beiden" freischaltet. */
  let neu = vonRoots, vonApp = null;
  const iApp = ARG.indexOf('--app');
  if (iApp >= 0 && ARG[iApp + 1]){
    /* `--app auto` holt den Stand selbst aus dem KV. So braucht die Routine
       nur EINE Freigabe (dieses Skript) statt einer breiten fuer wrangler —
       und der Weg steht an einer Stelle statt in jeder Anleitung neu. */
    let text;
    if (ARG[iApp + 1] === 'auto'){
      const NS = (fs.readFileSync(p('wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
      if (!NS){ console.error('  KV-Namensraum nicht in wrangler.toml gefunden.'); process.exit(1); }
      const SCHLUESSEL = 'stand:' + (process.env.VT_MAIL || 'abdurahman.tunk@gmail.com');
      try {
        /* ⛔ Unter Windows heisst es npx.cmd — mit 'npx' wirft execFileSync
           ENOENT. [[npm_global_windows_fallen]] */
        /* ⛔ Zwei Windows-Fallen hintereinander: 'npx' allein wirft ENOENT
           (es heisst npx.cmd), und seit Node 20 wirft ein direktes .cmd EINVAL.
           Der Weg, der beides umgeht, ist cmd /c.
           [[npm_global_windows_fallen]] */
        const win = process.platform === 'win32';
        const befehl = win ? 'cmd' : 'npx';
        const args = ['wrangler@4.124.0', 'kv', 'key', 'get',
          '--namespace-id=' + NS, SCHLUESSEL, '--remote'];
        text = execFileSync(befehl, win ? ['/c', 'npx', ...args] : args,
          { cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 180000 });
      } catch (e) {
        console.log('  ⚠️ KV nicht erreichbar (' + (e.message || '').split('\n')[0] + ')'
          + ' — es zaehlt nur arabicroots. Das gehoert in den Bericht.');
      }
    } else {
      text = fs.readFileSync(ARG[iApp + 1], 'utf8');
    }
    if (!text) { console.log('  (App-Auswahl uebersprungen)'); }
    else {
    const a = auswahlAusKvStand(text);
    vonApp = a.frei;
    console.log('  App-Auswahl (KV, Stand '
      + (a.stempel ? new Date(a.stempel).toLocaleString('de-DE') : 'unbekannt') + '): '
      + (Object.entries(vonApp).map(([b, k]) => `${b} bis ${Math.max(...k)}`).join(' | ') || '—'));
    neu = {};
    new Set([...Object.keys(vonRoots), ...Object.keys(vonApp)]).forEach(b => {
      neu[b] = [...new Set([...(vonRoots[b] || []), ...(vonApp[b] || [])])].sort((x, y) => x - y);
    });
    }
  } else {
    console.log('  ⚠️ Ohne --app zaehlt nur arabicroots. Elias wollte beide Quellen —'
      + ' den KV-Stand mit `wrangler kv key get` holen und mitgeben.');
  }
  /* ⛔ Nur Buecher nachziehen, die auch als Datei vorliegen — sonst traegt
     sich ein Buch ein, dessen Woerter niemand pruefen kann, und der
     Rueckstand meldet ploetzlich Tausende. */
  const bekannt = new Set(BUECHER.map(b => b.slug));
  const ueber = Object.keys(neu).filter(b => !bekannt.has(b));
  ueber.forEach(b => delete neu[b]);

  const alt = frei;

  /* ⛔⛔ DRITTE QUELLE: DER BESTEHENDE STAND. Und er wird NIE beschnitten.
     ===================================================================
     Am 20.08.2026 gemessen und beinahe ausgeliefert:

       arabicroots (get_unlocked_chapters): madina-1 bis Kapitel 11
       js/kern.js:                          madina-1 bis Kapitel 12
       Kommentar dort: „Elias am 20.08.2026: ich habe uebrigens kapitel 12
                        freigeschaltet"

     Der naechste Wartungslauf haette daraus [1..11] gemacht, die Zeile
     veroeffentlicht und Elias' eigene Ansage samt Begruendung geloescht — und
     der Zuwachs-Zweig weiter unten haette geschwiegen, weil er mit
     `if (zuwachs <= 0) return;` beginnt. Neun Woerter waeren aus dem Fenster,
     aus pruefe-eselsbruecken und aus pruefe-erreichbarkeit gefallen, mit
     Exitcode 0 und ohne eine Zeile im Bericht.

     ⭐ Die Regel dahinter ist einfach und kommt aus der Sache: WAS ER EINMAL
     GELERNT HAT, VERLERNT ER NICHT, wenn eine Kursplattform ein Kapitel wieder
     schliesst. Ein Freischaltstand darf wachsen; das Zurueckdrehen ist SEINE
     Entscheidung, nicht die einer Messung.

     ⚠️ Ein Schrumpfen wird deshalb GEMELDET statt ausgefuehrt. Wer es doch
     will, sagt es ausdruecklich mit --auch-schliessen.
     [[kennzeichen_mit_zwei_ursachen]] · [[eingefrorenes_feld_ist_kein_zustand]] */
  const SCHLIESSEN = ARG.includes('--auch-schliessen');
  const verloren = [];
  if (!SCHLIESSEN){
    Object.keys(alt).forEach(b => {
      const fehlend = (alt[b] || []).filter(k => !(neu[b] || []).includes(k));
      if (!fehlend.length) return;
      verloren.push(`${b}: Kapitel ${fehlend.join(', ')} stehen in js/kern.js, aber nicht`
        + ` in den gemessenen Quellen — BEHALTEN`);
      neu[b] = [...new Set([...(neu[b] || []), ...fehlend])].sort((x, y) => x - y);
    });
  }

  const aenderungen = [];
  new Set([...Object.keys(alt), ...Object.keys(neu)]).forEach(b => {
    const a = (alt[b] || []).join(','), n = (neu[b] || []).join(',');
    if (a !== n) aenderungen.push(`  ${b}: [${a || '—'}] → [${n || '—'}]`);
  });
  if (ueber.length) console.log('  uebersprungen (keine Vokabeldatei): ' + ueber.join(', '));
  if (verloren.length){
    console.log('  ⚠️ Nicht zugemacht — das gehoert in den Bericht an Elias:');
    verloren.forEach(z => console.log('     ' + z));
    console.log('     (Wirklich schliessen? Dann --auch-schliessen. Das ist SEINE Entscheidung.)');
  }
  if (!aenderungen.length){
    /* ⚠️ Nach dem Zurückmischen kann „keine Änderung" heißen, dass genau EIN
       Schrumpfen verhindert wurde. Beide Zeilen nebeneinander klängen sonst
       gegenläufig: erst „Nicht zugemacht", dann „war schon aktuell".
       [[widerspruch_liegt_in_der_beschriftung]] */
    console.log(verloren.length
      ? '  FREIGESCHALTET bleibt, wie es war — die gemessenen Quellen hätten'
        + ' Kapitel weggenommen (siehe oben), das wurde verhindert.'
      : '  FREIGESCHALTET war schon aktuell (Stand ' + datum + ').');
    process.exit(0);
  }
  const heute = new Date().toLocaleDateString('de-DE');
  freischaltungSchreiben(neu, heute);
  console.log('  FREIGESCHALTET nachgezogen:');
  aenderungen.forEach(z => console.log(z));
  console.log('  ⛔ js/kern.js ist eine ausgelieferte Datei — CACHE_NAME in sw.js hoch!');

  /* ⭐⭐ DER ZUWACHS SAGT, OB ER WEITERGERUECKT IST — oder ob die Schule
     etwas fuer die ganze Klasse geoeffnet hat.

     Elias' eigene Zahl gibt die Grenze: „1-3 kapitel sind realistisch."
     Ein Zuwachs in dieser Groesse in einem Buch, an dem er ohnehin arbeitet,
     IST sein Fortschritt — dann darf `angabe` mitwachsen, und die Routine
     arbeitet die neuen Woerter ohne Rueckfrage ab.
     Alles darueber ist etwas anderes: am 19.08.2026 stand madina-2 mit 24
     Kapiteln auf einmal offen, waehrend er bei madina-1 Kapitel 11 war. So
     etwas wird GEMELDET, nicht uebernommen.
     ⛔ Und ein Buch, fuer das noch gar keine `angabe` existiert, waechst nie
     automatisch — dort weiss niemand, wo er steht. */
  const l = lernstandLesen() || { angabe: {} };
  l.angabe = l.angabe || {};
  const gewachsen = [], zurueckgestellt = [];
  Object.keys(neu).forEach(b => {
    const jetzt = Math.max(0, ...neu[b]);
    const vorher = Math.max(0, ...(alt[b] || [0]));
    const zuwachs = jetzt - vorher;
    if (zuwachs <= 0) return;
    if (typeof l.angabe[b] !== 'number'){
      zurueckgestellt.push(`${b}: +${zuwachs} Kapitel, aber keine Angabe von Elias — nicht uebernommen`);
    } else if (zuwachs <= FENSTER){
      const altAngabe = l.angabe[b];
      l.angabe[b] = jetzt;
      gewachsen.push(`${b}: Angabe ${altAngabe} → ${jetzt} (+${zuwachs}, im Rahmen)`);
    } else {
      zurueckgestellt.push(`${b}: +${zuwachs} Kapitel auf einmal — zu viel fuer einen Lernschritt, NICHT uebernommen`);
    }
  });
  if (gewachsen.length){
    l.angabeVom = heute;
    l._angabeWortlaut = (l._angabeWortlaut || '') + ` | automatisch fortgeschrieben am ${heute} (Zuwachs ≤ ${FENSTER} Kapitel)`;
    fs.writeFileSync(p(LERNDATEI), JSON.stringify(l, null, 2), 'utf8');
    console.log('');
    console.log('  ⭐ Lernstand automatisch mitgewachsen:');
    gewachsen.forEach(z => console.log('    ' + z));
  }
  if (zurueckgestellt.length){
    console.log('');
    console.log('  ⚠️ NICHT uebernommen — das gehoert in den Bericht an Elias:');
    zurueckgestellt.forEach(z => console.log('    ' + z));
  }
  process.exit(0);
}

/* Messen — im FENSTER, nicht im Freigeschalteten. */
const lern = lernstandLesen();
const fensterInfo = [];
const fehlendeAngabe = [];

/* Welche Kapitel eines Buchs zaehlen? Der Schnitt aus
     freigeschaltet  ∩  [1 .. Lernstand + FENSTER]
   Ohne Lernstand faellt das Werkzeug auf „alles Freigeschaltete" zurueck und
   sagt das ausdruecklich — lieber zu viel melden als stillschweigend zu wenig.
   [[erfundene_begruendung_schliesst_den_fall]] */
function kapitelImFenster(slug){
  const frei_ = frei[slug];
  if (!frei_ || !frei_.length) return null;
  const gesagt  = lern && lern.angabe && lern.angabe[slug];
  const gemess  = lern && lern.gemessen && lern.gemessen[slug];

  /* ⛔ Ohne Angabe wird das Buch NICHT gemessen, statt auf „alles
     Freigeschaltete" zurueckzufallen. Der Rueckfall waere die teure Richtung:
     schaltet die Schule madina-2 komplett frei, meldete das Werkzeug 445
     Woerter Rueckstand, die niemand braucht — und ein Werkzeug, das regelmaessig
     Unsinn meldet, wird nach dem dritten Mal ignoriert.
     Lieber laut sagen, dass die Angabe fehlt. */
  if (typeof gesagt !== 'number'){
    fehlendeAngabe.push(slug);
    fensterInfo.push(`${slug}: ⛔ keine Angabe von Elias → NICHT gemessen`
      + (gemess ? ` (abgefragt wurde bis Kapitel ${gemess.hoechstesKapitel}, das ist aber kein Lernstand)` : ''));
    return null;
  }
  const grenze = gesagt + FENSTER;
  const drin = frei_.filter(k => k <= grenze);
  fensterInfo.push(`${slug}: Elias ist bei Kapitel ${gesagt}, Fenster bis ${grenze}`
    + ` → ${drin.length} von ${frei_.length} freigeschalteten Kapiteln`);
  /* ⚠️ Auseinanderlaufen MELDEN, nicht aufloesen. Weicht die Messung stark ab,
     ist entweder die Angabe alt oder er hat quer geuebt — beides soll er
     sehen, und keines darf das Fenster heimlich aufreissen. */
  if (gemess && gemess.hoechstesKapitel > grenze)
    fensterInfo.push(`    ⚠️ gemessen wurde bis Kapitel ${gemess.hoechstesKapitel}`
      + ` (${gemess.geuebteWoerter} Woerter) — pruefen, ob die Angabe noch stimmt`);
  return drin;
}

/* ---------- Die neun uebrigen Punkte des vollen Programms ----------

   Reihenfolge der Pruefung ist Absicht: `type` zuerst. Faellt es aus, sind
   `gender`, `pl` und `femSg` gar nicht entscheidbar — sie haengen alle daran,
   welche Wortart das Wort ist. Sie dann trotzdem zu melden hiesse, denselben
   Mangel viermal zu zaehlen. [[kandidatenliste_ist_keine_fehlerliste]] */
const feldAusnahme = hol('feldAusnahme');
/* ⛔ Die nachgetragenen Werte müssen HIER genauso gelten wie in der App —
   sonst meldet dieses Werkzeug ein Wort weiter als unvollständig, obwohl Elias
   die Antwort längst gegeben hat, und er bekäme jede Woche dieselbe Frage.
   [[werkzeug_ohne_aufrufer]] */
const ERGAENZT = hol('FELD_ERGAENZUNGEN') || {};
const leerWert = (v) => v === undefined || v === null || String(v).trim() === '';
/* ⛔ Dieselbe Leer-Regel wie die App: `type: 'other'` ist gefüllt und trotzdem
   keine Angabe. Wird sie hier anders gezogen als in data/feld-ausnahmen.js,
   melden Werkzeug und App verschiedene Stände — und beide sehen richtig aus.
   [[dieselbe_frage_zwei_antworten]] */
const giltAlsLeer = hol('feldGiltAlsLeer') || ((f, v) => leerWert(v));
/* Der Wert, den die App sehen wird: erst der Abzug, dann die Nachtragung. */
const feldWert = (w, feld) => {
  if (!giltAlsLeer(feld, w[feld])) return w[feld];
  const e = ERGAENZT[String(w && w.id)];
  return e && e[feld] !== undefined ? e[feld] : w[feld];
};

/* Welches Feld kostet was — steht im Bericht neben jeder Zahl, damit ein
   Rueckstand nicht als Formalie gelesen wird. */
const FELD_FOLGE = {
  type:   'Kategorie, Statistik, Funktionsanzeige, Uebung 8',
  root:   'Wurzelansicht und Wortfamilie',
  gender: 'Uebung 11 (مُذَكَّر/مُؤَنَّث) und Uebung 12 (هَذَا/هَذِهِ)',
  sg:     'Hoermodus ueberspringt das Wort',
  pl:     'Pluralanzeige auf der Karte',
  femSg:  'Uebung 13 (صَغِيرٌ/صَغِيرَةٌ)',
  past:      'Formen-Kasten und Sprachausgabe',
  present:   'Formen-Kasten und Sprachausgabe',
  imperative:'Formen-Kasten (Befehlsform)',
  masdar:    'Formen-Kasten (Verbalnomen)'
};

function felderPruefen(w, quelle){
  const fehlt = [];
  const t = String(feldWert(w, 'type') || '');
  const kaputterTyp = leerWert(t) || t === 'other' || t === 'vocab';
  if (kaputterTyp) fehlt.push('type');

  const pruefe = (feld) => {
    if (!leerWert(feldWert(w, feld))) return;
    if (feldAusnahme && feldAusnahme(w, feld, quelle)) return;
    fehlt.push(feld);
  };

  pruefe('root');
  /* Ohne brauchbares `type` steht nicht fest, welche der folgenden Felder das
     Wort ueberhaupt braucht. Dann nur `type` melden — das ist die Ursache. */
  if (kaputterTyp) return fehlt;

  if (t === 'noun'){ pruefe('gender'); pruefe('sg'); pruefe('pl'); }
  if (t === 'adjective') pruefe('femSg');
  /* ⚠️ `imperative` und `masdar` sind hier bewusst dabei, obwohl nicht jedes
     Verb einen sinnvollen Imperativ hat (لَيْسَ etwa nicht). Wo er fehlt,
     gehört das nach data/feld-ausnahmen.js — als AUSDRÜCKLICHES „gibt es
     nicht", nicht als schweigende Lücke. [[kennzeichen_mit_zwei_ursachen]] */
  if (t === 'verb'){ pruefe('past'); pruefe('present'); pruefe('imperative'); pruefe('masdar'); }
  return fehlt;
}

const offen = [];      /* { slug, kapitel, id, ar, de, fehltEB, fehltSatz, fehltFelder } */
let geprueft = 0;
BUECHER.forEach(b => {
  const kapitel = kapitelImFenster(b.slug);
  if (!kapitel || !kapitel.length) return;
  const datei = p(b.datei);
  if (!fs.existsSync(datei)) return;
  vm.runInContext(fs.readFileSync(datei, 'utf8'), kiste, { filename: b.datei });
  const liste = (kiste.window.VOKABELN && kiste.window.VOKABELN[b.slug]) || [];
  liste.filter(w => kapitel.includes(Number(w.chapter))).forEach(w => {
    geprueft++;
    const id = String(w.id);
    const n = vorschlagsZahl(id, w);
    const s = hatSatz(id);
    /* Nur sinnvoll, wenn es ueberhaupt einen Satz gibt: ohne Satz fehlt die
       Markierung zwangslaeufig, und sie zweimal zu melden hilft niemandem. */
    const m = s ? satzErreichbar(id) : true;
    const kat = hatKategorie(w);
    const ff  = felderPruefen(w, b.slug);
    if (n < 3 || !s || !m || !kat || ff.length)
      offen.push({ slug: b.slug, kapitel: Number(w.chapter), id, ar: w.ar, de: w.de,
                   hat: n, fehltEB: Math.max(0, 3 - n), fehltSatz: !s,
                   fehltMarkierung: s && !m, fehltKategorie: !kat, fehltFelder: ff,
                   /* ⛔ `w.pl`, nicht `w.plural`: das Feld heisst in ALLEN
                      Datendateien `pl`, und `plural` hat in js/ null Treffer.
                      Bis zum 20.08.2026 stand hier `w.plural` — der Auftrag
                      zeigte den Plural also nie an, ohne dass es auffiel. */
                   root: w.root, pl: w.pl, type: w.type });
  });
});

/* ---------- Seine eigenen Vokabeln und die Fachbegriffe (20.08.2026) ----------

   Sie kommen NICHT aus BUECHER und haben kein Kapitel, das in ein Fenster
   passen koennte — sie gehoeren ihm einfach, sobald sie da sind. Deshalb ein
   eigener Durchgang mit denselben vier Messungen.

   ⛔ Die Kategorie wird hier NICHT geprueft: `type` ist bei eigenen Vokabeln
   aus arabicroots immer 'other', und das faellt bei hatKategorie() zwangslaeufig
   durch. Das ist ein eigener Punkt (A1 im Skill) und wuerde hier nur jede Zeile
   rot machen, ohne etwas Neues zu sagen. [[kandidatenliste_ist_keine_fehlerliste]] */
const EIGENE = kiste.window.EIGENE_VOKABELN || [];
const FACH   = hol('FACHBEGRIFF_VOKABELN') || [];

/* ⛔⛔ EIN FACHBEGRIFF BRAUCHT KEINEN EIGENEN SATZ, WENN SEINE REGEL EINEN HAT.
   Der erste Lauf dieser Erweiterung meldete neun Fachbegriffe als „Beispielsatz
   FEHLT" — und ich war dabei, ihnen neun Saetze zu schreiben. Der Kommentar in
   data/fachbegriffe.js bei gram-zarf hielt mich auf:

     „Der EINZIGE Fachbegriff, der einen Satz bekommt — und zwar mit Grund.
      Von den zehn Begriffen ohne Beispielsatz haben neun eine Regel mit 3 bis
      13 Markierungen, ihr Konzept ist also erreichbar."

   Das Feld `regel` am Fachbegriff nennt die zugehoerige Regel-Id. Hat die
   Markierungen in echten Saetzen, ist der Begriff erreichbar — ein zusaetzlicher
   Satz waere gestellt und wuerde nichts erschliessen.
   [[stichworttreffer_im_kommentar]] — der Treffer war die BEGRUENDUNG, warum
   es richtig ist. [[kandidatenliste_ist_keine_fehlerliste]] */
const REGEL_HAT_MARKIERUNG = new Set(
  Object.values(hol('SENTENCE_TAGS') || {}).flat().map(m => m && m.ruleId).filter(Boolean));
function fachbegriffErreichbar(w){
  return !!(w.regel && REGEL_HAT_MARKIERUNG.has(w.regel));
}

[['eigene', EIGENE], ['fachbegriffe', FACH]].forEach(([slug, liste]) => {
  liste.forEach(w => {
    geprueft++;
    const id = String(w.id);
    const n = vorschlagsZahl(id, w);
    const ff = felderPruefen(w, slug);
    if (slug === 'fachbegriffe' && fachbegriffErreichbar(w)){
      /* Erreichbar ueber seine Regel — nur die Eselsbruecken zaehlen noch. */
      if (n < 3 || ff.length)
        offen.push({ slug, kapitel: 0, id, ar: w.ar, de: w.de, hat: n,
                     fehltEB: Math.max(0, 3 - n), fehltSatz: false, fehltMarkierung: false,
                     fehltKategorie: false, fehltFelder: ff,
                     root: w.root, pl: w.pl, type: w.type });
      return;
    }
    /* ⛔ hatSatz() sucht in VOCAB_DATA und in BEISPIELSAETZE — die Fachbegriffe
       tragen ihren Satz aber am EIGENEN Datensatz, in keiner der beiden. Ohne
       diese Zeile meldete der erste Lauf 15 von 15 Fachbegriffen „ohne Satz",
       obwohl sechs einen haben. [[kandidatenliste_ist_keine_fehlerliste]] */
    const s = hatSatz(id) || !!(w.sentAr && String(w.sentAr).trim());
    const m = s ? satzErreichbar(id) : true;
    if (n < 3 || !s || !m || ff.length)
      offen.push({ slug, kapitel: 0, id, ar: w.ar, de: w.de,
                   hat: n, fehltEB: Math.max(0, 3 - n), fehltSatz: !s,
                   fehltMarkierung: s && !m, fehltKategorie: false, fehltFelder: ff,
                   root: w.root, pl: w.pl, type: w.type });
  });
});

const fehlendeEB   = offen.reduce((s, w) => s + w.fehltEB, 0);
const fehlendeSatz = offen.filter(w => w.fehltSatz).length;
const fehlendeMark = offen.filter(w => w.fehltMarkierung).length;
const fehlendeKat  = offen.filter(w => w.fehltKategorie).length;
/* je Feldname, wie oft es fehlt */
const jeFeld = {};
offen.forEach(w => (w.fehltFelder || []).forEach(f => { jeFeld[f] = (jeFeld[f] || 0) + 1; }));
const fehlendeFelder = Object.values(jeFeld).reduce((a, b) => a + b, 0);

if (KNAPP){
  const felderText = fehlendeFelder
    ? ', ' + Object.entries(jeFeld).sort((a, b) => b[1] - a[1]).map(([f, n]) => n + '× ' + f).join(', ')
    : '';
  console.log(offen.length
    ? `Vorrat: ${offen.length} von ${geprueft} freigeschalteten Woertern unvollstaendig — ${fehlendeEB} Eselsbruecken, ${fehlendeSatz} Beispielsaetze, ${fehlendeMark} Markierungen, ${fehlendeKat} Kategorien${felderText}. (Freischaltstand ${datum})`
    : `Vorrat: alle ${geprueft} freigeschalteten Woerter sind nach allen 13 Punkten des vollen Programms vollstaendig. (Freischaltstand ${datum})`);
  process.exit(offen.length ? 2 : 0);
}

console.log('  Freigeschaltet (js/kern.js): '
  + Object.entries(frei).map(([b, k]) => `${b} Kap. ${k.join(',')}`).join(' | ')
  + '   (abgefragt am ' + datum + ')');
if (lern && lern.angabe && Object.keys(lern.angabe).length)
  console.log('  Elias\' Angabe (' + LERNDATEI + (lern.angabeVom ? ', vom ' + lern.angabeVom : '') + '): '
    + Object.entries(lern.angabe).map(([b, k]) => `${b} Kapitel ${k}`).join(' | '));
else console.log('  ⚠️ Keine Angabe von Elias hinterlegt — es zaehlt alles Freigeschaltete.'
  + ' Eintragen unter "angabe" in ' + LERNDATEI + '.');
console.log('  Fenster: ' + FENSTER + ' Kapitel voraus');
fensterInfo.forEach(z => console.log('    ' + z));
if (!hatSaetze) console.log('  data/beispielsaetze.js liegt noch nicht vor — Saetze zaehlen als fehlend.');
console.log('');
console.log('  geprueft:                 ' + geprueft + ' Woerter aus freigeschalteten Kapiteln');
console.log('  vollstaendig:             ' + (geprueft - offen.length));
console.log('  unvollstaendig:           ' + offen.length);
console.log('    fehlende Eselsbruecken: ' + fehlendeEB);
console.log('    fehlende Beispielsaetze:' + fehlendeSatz);
console.log('    fehlende Markierungen:  ' + fehlendeMark + (fehlendeMark ? '   ⛔ diese Saetze stehen in KEINEM Thema' : ''));
console.log('    ohne Wortart-Kategorie: ' + fehlendeKat
  + '   (das Bedeutungsfeld misst pruefe-wortfelder.js, nicht dieses Werkzeug)');
if (fehlendeFelder){
  console.log('');
  console.log('  Felder des vollen Programms, die fehlen (ohne die erklaerten Faelle');
  console.log('  aus data/feld-ausnahmen.js):');
  Object.entries(jeFeld).sort((a, b) => b[1] - a[1]).forEach(([f, n]) =>
    console.log('    ' + (f + ':').padEnd(10) + String(n).padStart(4) + '   ' + (FELD_FOLGE[f] || '')));
} else if (feldAusnahme){
  console.log('    Felder (13 Punkte):     alle vollstaendig');
} else {
  console.log('    ⚠️ data/feld-ausnahmen.js fehlt — die neun Feldpunkte wurden NICHT geprueft.');
}

if (offen.length){
  const jeKap = {};
  offen.forEach(w => {
    const s = w.slug + ' K' + w.kapitel;
    jeKap[s] = jeKap[s] || { eb: 0, satz: 0, n: 0 };
    jeKap[s].n++; jeKap[s].eb += w.fehltEB; jeKap[s].satz += w.fehltSatz ? 1 : 0;
  });
  console.log('');
  console.log('  je Kapitel:');
  Object.entries(jeKap).forEach(([k, z]) =>
    console.log('    ' + k.padEnd(16) + z.n + ' Woerter, ' + z.eb + ' Eselsbruecken, ' + z.satz + ' Saetze'));
}

if (iAuftr >= 0){
  const ziel = ARG[iAuftr + 1];
  if (!ziel){ console.error('  --auftrag braucht eine Datei.'); process.exit(1); }
  const z = [];
  z.push('# Arbeitsauftrag Vorrat — erzeugt von werkzeuge/vorrat.mjs');
  z.push('');
  z.push('Freischaltstand: ' + Object.entries(frei).map(([b, k]) => `${b} Kap. ${k.join(',')}`).join(' | '));
  z.push('Offen: ' + offen.length + ' Woerter, ' + fehlendeEB + ' Eselsbruecken, ' + fehlendeSatz + ' Beispielsaetze.');
  z.push('');
  offen.forEach(w => {
    z.push('## ' + w.id + '  ' + w.ar + '  — ' + String(w.de || '').replace(/\s+/g, ' '));
    z.push('   ' + w.slug + ' Kapitel ' + w.kapitel
      + (w.root ? ' · Wurzel ' + w.root : '') + (w.pl ? ' · Pl. ' + w.pl : ''));
    if (w.fehltFelder && w.fehltFelder.length)
      z.push('   FEHLENDE FELDER: ' + w.fehltFelder.map(f => f + ' (' + (FELD_FOLGE[f] || '') + ')').join(', '));
    z.push('   Eselsbruecken: hat ' + w.hat + ', braucht ' + w.fehltEB + ' mehr');
    const e = eigen.get(w.id);
    const erst = (e && e.mnemo) || w.mnemoRoh || BUCH_EB[w.id];
    if (erst) z.push('   vorhanden: ' + String(erst).replace(/\s+/g, ' '));
    (ALT[w.id] || []).forEach((t, i) => z.push('   alt ' + (i + 2) + ': ' + String(t).replace(/\s+/g, ' ')));
    z.push('   Beispielsatz: ' + (w.fehltSatz ? 'FEHLT' : 'vorhanden'));
    z.push('');
  });
  fs.writeFileSync(ziel, z.join('\n'), 'utf8');
  console.log('');
  console.log('  Arbeitsauftrag geschrieben: ' + ziel);
}

/* ---------- Was NUR Elias beantworten kann ----------

   ⭐ Elias am 20.08.2026: „sobald … nur noch das übrig ist was ich erledigen
   muss …, soll mir die bearbeitung der restlichen aufgaben sehr leicht gemacht
   werden … mit so geringem zeit und arbeitaufwand wie nur möglich."

   Der Unterschied zum Arbeitsauftrag oben ist der Adressat. `--auftrag` ist
   die Liste dessen, was ICH schreiben kann: Eselsbrücken, Beispielsätze,
   Markierungen. Was hier herauskommt, kann ich NICHT entscheiden, ohne zu
   raten — ob اليَابَان einen Plural hat, ist eine Frage an die Sprache, nicht
   an die Daten.

   ⛔ Deshalb landet nichts davon still in data/feld-ausnahmen.js. Es geht als
   Frage an ihn, und erst seine Antwort wird eingetragen. */
if (ARG.includes('--offene-fragen')){
  const ziel = ARG[ARG.indexOf('--offene-fragen') + 1];
  if (!ziel){ console.error('  --offene-fragen braucht eine Datei.'); process.exit(1); }

  /* Je Feld EINE Frage, mit allen betroffenen Wörtern. Ein Durchgang je Feld
     statt einer je Wort — bei 25 Plural-Fragen ist das der ganze Unterschied. */
  const FRAGE_TEXT = {
    pl:     { titel: 'Haben diese Wörter einen Plural?',
              hilfe: 'Eigennamen (Länder, Städte) und Stoffnamen haben meist keinen. Wo es keinen gibt, wird das ausdrücklich eingetragen — dann fragt kein Werkzeug je wieder danach.',
              nein:  'kein Plural' },
    sg:     { titel: 'Haben diese Wörter einen Singular?', hilfe: '', nein: 'kein Singular' },
    gender: { titel: 'Welches Geschlecht haben diese Wörter?',
              hilfe: 'Ohne die Angabe erzeugen die Übungen „مُذَكَّر oder مُؤَنَّث?" und „هَذَا oder هَذِهِ?" für das Wort keine einzige Aufgabe.',
              nein:  'nicht anwendbar' },
    femSg:  { titel: 'Wie lautet die weibliche Form?',
              hilfe: 'Ohne sie erzeugt die Übung „صَغِيرٌ oder صَغِيرَةٌ?" für das Wort keine Aufgabe.',
              nein:  'keine weibliche Form' },
    root:   { titel: 'Wie lautet die Wurzel?',
              hilfe: 'Partikeln, Fremdwörter und Eigennamen haben keine — das ist kein Mangel.',
              nein:  'keine Wurzel' },
    type:   { titel: 'Welche Wortart?',
              hilfe: 'Steht hier „other", zeigt die Infokarte nur „Wort". Daran hängen außerdem die Kategorie, die Statistik und die Wortart-Übung.',
              nein:  'weiß ich nicht' },
    past:   { titel: 'Wie lautet die Vergangenheitsform?', hilfe: '', nein: 'entfällt' },
    present:{ titel: 'Wie lautet die Gegenwartsform?', hilfe: '', nein: 'entfällt' },
    imperative: { titel: 'Wie lautet die Befehlsform?', hilfe: 'Nicht jedes Verb hat eine.', nein: 'gibt es nicht' },
    masdar: { titel: 'Wie lautet das Verbalnomen (مَصْدَر)?', hilfe: '', nein: 'gibt es nicht' }
  };

  const jeFeldWoerter = {};
  offen.forEach(w => (w.fehltFelder || []).forEach(f => {
    (jeFeldWoerter[f] = jeFeldWoerter[f] || []).push({
      id: w.id, ar: w.ar, de: String(w.de || '').replace(/\s+/g, ' '),
      quelle: w.slug, kapitel: w.kapitel, type: w.type
    });
  }));

  const fragen = Object.entries(jeFeldWoerter)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([feld, woerter]) => ({
      art: 'feld', feld,
      titel: (FRAGE_TEXT[feld] || {}).titel || ('Feld `' + feld + '` fehlt'),
      hilfe: (FRAGE_TEXT[feld] || {}).hilfe || '',
      neinText: (FRAGE_TEXT[feld] || {}).nein || 'gibt es nicht',
      folge: FELD_FOLGE[feld] || '',
      woerter
    }));

  fs.writeFileSync(ziel, JSON.stringify({
    erzeugt: new Date().toISOString(),
    freischaltstand: datum,
    geprueft,
    fragen
  }, null, 2), 'utf8');
  console.log('');
  console.log('  Offene Fragen an Elias geschrieben: ' + ziel);
  console.log('  ' + fragen.length + ' Frage(n), '
    + fragen.reduce((s, f) => s + f.woerter.length, 0) + ' Wörter insgesamt.');
}

process.exit(offen.length ? 2 : 0);
