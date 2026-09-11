/* regelsammlung-wache.mjs -- wann braucht die Regelsammlung Arbeit, ohne dass er es sagt?
 *
 *   node werkzeuge/regelsammlung-wache.mjs --aufnahmen <datei>   Ausgabe von get_recordings, UNVERÄNDERT in eine Datei geschrieben
 *   node werkzeuge/regelsammlung-wache.mjs --ohne-aufnahmen      ausdrücklich ohne Folgentitel — Frage 2 entfällt dann
 *   node werkzeuge/regelsammlung-wache.mjs --merken              nach dem Eintragen: das Gemeldete als gemeldet merken
 *
 *   Exitcode 0 = nichts Neues · 2 = Neues, das in die To-Do gehört · 1 = Eingabe fehlt oder kaputt
 *
 * WARUM ES DAS GIBT (11.09.2026)
 * ==============================
 * Elias fragte um 19:07:37, ob die Routinen für die Regelsammlung angepasst
 * werden müssen; um 19:22:49 wählte er alle drei Ergänzungen. Dies sind die
 * zweite und die dritte — beides Stellen, an denen die Regelsammlung Arbeit
 * braucht, die kein Mensch ansagt:
 *
 *   1. WIEDERVORLAGE. Zu asma-khamsa-vollstaendig-01 schrieb er „später wenn
 *      mein lehrer es aufgreift und das erklärt dann kann man das rein nehmen".
 *      Das stand nur in der To-Do; keine Routine sah je nach. Die Liste steht
 *      jetzt in werkzeuge/wiedervorlagen.json, jede neue Folge wird dagegen
 *      gehalten.
 *   2. ZUSAMMENFASSUNGS-FOLGE. Folge 19 „Grammatikabfrage 1" ergab 0 neue
 *      Einzelregeln — ihr Wert steckt in den neun Karten der Regelsammlung, und
 *      die hat eine Nachtschicht gebaut, nicht die Wartung. Eine zweite solche
 *      Folge ergäbe ohne diese Frage wieder 0 Regeln und keine Karten.
 *   3. NEUE GRAMMATIK-NOTIZ. Die Karten stammen aus seiner Musterlösung in
 *      Samsung Notes, Ordner Arabisch\Grammatik. Eine neue Notiz dort ist eine
 *      neue Quelle — und fiel bisher keiner Routine auf.
 *
 * ⛔ DIESES WERKZEUG MELDET, ES ENTSCHEIDET NICHTS. Ein Stichworttreffer ist
 * eine Kandidatenstelle; ob der Lehrer das Thema wirklich „aufgreift und
 * erklärt", liest die Wartung nach. Und selbst dann fragt sie ihn — sie holt
 * die Regel nie selbst zurück. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * ⚠️ „Geändert" in einer Samsung-Notiz ist ein schwaches Zeichen: Samsung
 * stempelt auch beim bloßen Öffnen (Elias, 29.07.2026). Deshalb zählt nur eine
 * NEUE Notiz als Arbeit; eine geänderte steht als Hinweis da.
 *
 * ⚠️ Merken wie in regeln-holen.mjs: der Lauf legt `.regelsammlung-wache.neu.json`
 * ab, erst --merken übernimmt es — ohne neu zu messen. Bricht die Routine
 * vorher ab, kommt das Neue beim nächsten Lauf wieder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wert = (s) => { const i = args.indexOf(s); return i >= 0 ? args[i + 1] : null; };

const ZUSTAND     = path.resolve(wert('--zustand') || REPO);
const GEMERKT     = path.join(ZUSTAND, '.regelsammlung-wache.json');
const VORGEMERKT  = path.join(ZUSTAND, '.regelsammlung-wache.neu.json');
const WIEDERVORL  = path.resolve(wert('--wiedervorlagen') || path.join(REPO, 'werkzeuge', 'wiedervorlagen.json'));
const TRANSKRIPTE = path.resolve(wert('--transkripte') || path.join(REPO, 'transcripts'));
const KARTEN      = path.resolve(wert('--karten') || path.join(REPO, 'regelsammlung-data.js'));
const NOTIZORDNER = path.resolve(wert('--notizordner') || path.join(REPO, '..', 'SamsungNotes-Sicherung', 'Lesbar', 'Arabisch', 'Grammatik'));
const AUFNAHMEN   = wert('--aufnahmen');

/* ---------- --merken ---------- */
if (args.includes('--merken')){
  if (!fs.existsSync(VORGEMERKT)){
    console.log('⛔ Nichts zu merken: ' + path.basename(VORGEMERKT) + ' fehlt. Erst ohne --merken laufen lassen.');
    process.exit(1);
  }
  fs.renameSync(VORGEMERKT, GEMERKT);
  const g = JSON.parse(fs.readFileSync(GEMERKT, 'utf8'));
  console.log('Gemerkt: ' + Object.keys(g.wiedervorlagen || {}).length + ' Wiedervorlage-Treffer · '
    + Object.keys(g.zusammenfassungen || {}).length + ' Zusammenfassungs-Folge(n) ohne Karten · '
    + Object.keys(g.notizen || {}).length + ' Grammatik-Notizen.');
  process.exit(0);
}

if (!AUFNAHMEN && !args.includes('--ohne-aufnahmen')){
  console.log('⛔ --aufnahmen <datei> fehlt. Ohne Folgentitel kann Frage 2 (Zusammenfassungs-Folgen) nicht');
  console.log('   geprüft werden. Wer das bewusst will, schreibt --ohne-aufnahmen — ein stilles Überspringen');
  console.log('   meldet sonst grün, obwohl nichts gemessen wurde. [[leere_liste_ist_keine_messung]]');
  process.exit(1);
}

let gemerkt = {};
try { gemerkt = JSON.parse(fs.readFileSync(GEMERKT, 'utf8')); } catch (e) { /* noch nie gemerkt */ }
const alt = (k) => (gemerkt[k] && typeof gemerkt[k] === 'object') ? gemerkt[k] : {};
const vormerken = { gemerkt: new Date().toISOString(), wiedervorlagen: { ...alt('wiedervorlagen') },
  zusammenfassungen: { ...alt('zusammenfassungen') }, notizen: {} };
let neu = 0, kaputt = 0;
const zwei = (n) => String(n).padStart(2, '0');

/* Vergleichsform: ohne Groß/Klein, ohne Akzente und Umlautpunkte, ohne alles
   außer Buchstaben. „Asma-Ul-Khamsa", „asmāʾ al-khamsa" und „Asma ul Khamsa"
   werden so vergleichbar. ⚠️ Beide Seiten durch DIESELBE Funktion — eine
   Liste, die anders normalisiert als der Text, trifft nie.
   [[dieselbe_frage_zwei_antworten]] */
const vergleichsform = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-zß]/g, '');

/* ==================== 1. Wiedervorlagen ==================== */
console.log('');
console.log('=== 1. Greift eine neue Folge auf, was er zurückgestellt hat? ===');
let liste = null;
try { liste = JSON.parse(fs.readFileSync(WIEDERVORL, 'utf8')); }
catch (e) { console.log('  ⛔ ' + path.basename(WIEDERVORL) + ' nicht lesbar: ' + String(e.message).split('\n')[0]); kaputt++; }

/* Welche Folgen haben Text? Die automatischen Untertitel (raw) und der volle
   Whisper-Lauf — beide, weil jeder Wörter verstümmelt, die der andere trifft:
   „Ausnahmewörter" steht in Folge 16 nur bei Whisper. */
const TEXTQUELLEN = [['whisper-voll', 'Whisper'], ['raw', 'Untertitel']];
const folgenMitText = new Map();
for (const [ordner, name] of TEXTQUELLEN){
  const p = path.join(TRANSKRIPTE, ordner);
  if (!fs.existsSync(p)) continue;
  for (const f of fs.readdirSync(p)){
    const m = /^folge-(\d+)\.txt$/.exec(f);
    if (!m) continue;
    const n = Number(m[1]);
    if (!folgenMitText.has(n)) folgenMitText.set(n, []);
    folgenMitText.get(n).push({ datei: path.join(p, f), quelle: name });
  }
}
if (!folgenMitText.size){ console.log('  ⛔ keine Transkripte unter ' + TRANSKRIPTE + ' — nichts gemessen'); kaputt++; }

function treffer(eintrag, folgen = folgenMitText){
  const stich = (eintrag.stichworte || []).map(vergleichsform).filter(Boolean);
  const raus = [];
  for (const [n, dateien] of [...folgen.entries()].sort((a, b) => a[0] - b[0])){
    if (n < Number(eintrag.abFolge)) continue;
    for (const { datei, quelle } of dateien){
      const zeilen = fs.readFileSync(datei, 'utf8').split(/\r?\n/);
      const form = zeilen.map(vergleichsform);
      for (let i = 0; i < zeilen.length; i++){
        /* über je zwei Zeilen: Untertitel brechen mitten im Ausdruck um */
        const fenster = form[i] + (form[i + 1] || '');
        const wort = stich.find(s => fenster.includes(s));
        if (!wort) continue;
        /* Steht der Treffer ganz in der nächsten Zeile, meldet ihn die nächste Runde. */
        if (!form[i].includes(wort) && (form[i + 1] || '').includes(wort)) continue;
        raus.push({ folge: n, quelle, zeile: i + 1, text: (zeilen[i] + ' ' + (zeilen[i + 1] || '')).replace(/\s+/g, ' ').trim().slice(0, 160) });
      }
    }
  }
  return raus;
}

const eintraege = (liste && Array.isArray(liste.eintraege)) ? liste.eintraege : [];
if (liste && !Array.isArray(liste.eintraege)){ console.log('  ⛔ wiedervorlagen.json hat kein Feld `eintraege`'); kaputt++; }
for (const e of eintraege){
  const fehlt = ['regelId', 'seit', 'abFolge', 'zitat', 'frage'].filter(k => e[k] == null || String(e[k]).trim() === '');
  if (fehlt.length || !Array.isArray(e.stichworte) || !e.stichworte.length){
    console.log('  ⛔ Eintrag ' + (e.regelId || '(ohne regelId)') + ' unvollständig: ' + [...fehlt, ...(Array.isArray(e.stichworte) && e.stichworte.length ? [] : ['stichworte'])].join(', '));
    kaputt++; continue;
  }
  if (e.erledigt){ console.log('  ok   ' + e.regelId + ' — erledigt am ' + (e.erledigt.am || '?')); continue; }
  const t = treffer(e);
  const folgen = [...new Set(t.map(x => x.folge))];
  if (!folgen.length){
    console.log('  ok   ' + e.regelId + ' — wartet seit ' + e.seit + ', kein Treffer ab Folge ' + e.abFolge
      + ' (Transkripte bis Folge ' + Math.max(0, ...folgenMitText.keys()) + ')');
    continue;
  }
  for (const f of folgen){
    const schluessel = e.regelId + '|' + f;
    const istNeu = !(schluessel in alt('wiedervorlagen'));
    vormerken.wiedervorlagen[schluessel] = vormerken.wiedervorlagen[schluessel] || new Date().toISOString();
    if (istNeu) neu++;
    console.log('  ' + (istNeu ? '🆕' : '  ') + ' ' + e.regelId + ' — Folge ' + zwei(f) + ' trifft' + (istNeu ? '' : ' (schon gemeldet am ' + String(alt('wiedervorlagen')[schluessel]).slice(0, 10) + ')'));
    for (const x of t.filter(y => y.folge === f).slice(0, 3)) console.log('        ' + x.quelle + ', Zeile ' + x.zeile + ': ' + x.text);
    if (istNeu){
      console.log('        Sein Satz (' + e.seit + '): „' + e.zitat + '"');
      console.log('        Frage an ihn: ' + e.frage);
    }
  }
}

/* ==================== 2. Zusammenfassungs-Folgen ==================== */
console.log('');
console.log('=== 2. Ist eine neue Folge eine Zusammenfassung wie Folge 19 — und hat sie Karten? ===');
/* Gemessen am 11.09.2026 an allen 19 Titeln: das Muster trifft genau
   „Folge 19 | Grammatikabfrage 1". „Folge 18 | Pronomen & Konjugieren" ist ein
   Thema, keine Zusammenfassung, und bleibt draußen. */
const ZUSAMMENFASSUNG = /abfrage|wiederholung|zusammenfassung|pr(?:ü|ue)fung|klausur|\btest\b|(?:ü|ue)bersicht/i;
if (AUFNAHMEN){
  let aufnahmen = null;
  try {
    const roh = fs.readFileSync(path.resolve(AUFNAHMEN), 'utf8');
    const start = roh.indexOf('[');
    aufnahmen = JSON.parse(roh.slice(start));
  } catch (e) { console.log('  ⛔ ' + AUFNAHMEN + ' ist keine Ausgabe von get_recordings: ' + String(e.message).split('\n')[0]); kaputt++; }
  if (Array.isArray(aufnahmen)){
    const kartenText = fs.existsSync(KARTEN) ? fs.readFileSync(KARTEN, 'utf8') : '';
    let gesehen = 0;
    for (const a of aufnahmen){
      const m = /Folge\s*(\d+)\s*\|\s*(.*)$/.exec(String(a && a.title || ''));
      if (!m) continue;
      gesehen++;
      const n = Number(m[1]), titel = m[2].trim();
      if (!ZUSAMMENFASSUNG.test(titel)) continue;
      const kartenName = 'FOLGE' + n + '_KARTEN';
      const hatKarten = new RegExp('const\\s+' + kartenName + '\\s*=').test(kartenText);
      const hatText = folgenMitText.has(n);
      if (hatKarten){ console.log('  ok   Folge ' + zwei(n) + ' „' + titel + '" — Karten: ' + kartenName); continue; }
      const istNeu = !(String(n) in alt('zusammenfassungen'));
      vormerken.zusammenfassungen[String(n)] = vormerken.zusammenfassungen[String(n)] || new Date().toISOString();
      if (istNeu) neu++;
      console.log('  ' + (istNeu ? '🆕' : '  ') + ' Folge ' + zwei(n) + ' „' + titel + '" — KEINE Karten in der Regelsammlung'
        + (hatText ? '' : ', Rohmaterial fehlt noch') + (istNeu ? '' : ' (schon gemeldet am ' + String(alt('zusammenfassungen')[String(n)]).slice(0, 10) + ')'));
    }
    if (!gesehen){ console.log('  ⛔ keine einzige „Folge NN | …" in ' + AUFNAHMEN + ' — nichts gemessen'); kaputt++; }
    else console.log('  ' + gesehen + ' Folgen gelesen.');
  }
} else {
  console.log('  ⚠️  nicht geprüft (--ohne-aufnahmen)');
}

/* ==================== 3. Neue Grammatik-Notizen ==================== */
console.log('');
console.log('=== 3. Liegt eine neue Notiz in Samsung Notes, Arabisch\\Grammatik? ===');
if (!fs.existsSync(NOTIZORDNER)){
  console.log('  ⛔ ' + NOTIZORDNER + ' fehlt — läuft die Samsung-Sicherung? Nichts gemessen.');
  kaputt++;
} else {
  const altNotizen = alt('notizen');
  const ersterLauf = !Object.keys(altNotizen).length;
  let anzahl = 0;
  for (const f of fs.readdirSync(NOTIZORDNER).filter(f => f.endsWith('.md')).sort()){
    const text = fs.readFileSync(path.join(NOTIZORDNER, f), 'utf8');
    const titel = (/^#\s+(.+)$/m.exec(text) || [, f])[1].trim();
    const uuid = (/^-\s*UUID:\s*(\S+)/m.exec(text) || [, 'datei:' + f])[1];
    const geaendert = (/^-\s*Geändert:\s*(.+)$/m.exec(text) || [, ''])[1].trim();
    vormerken.notizen[uuid] = geaendert;
    anzahl++;
    if (!(uuid in altNotizen)){
      neu++;
      console.log('  🆕 „' + titel + '" — Geändert-Stempel ' + geaendert + (ersterLauf ? ' (noch nie gemerkt)' : ''));
    } else if (altNotizen[uuid] !== geaendert){
      console.log('  ⚠️  „' + titel + '" — Geändert-Stempel neu: ' + altNotizen[uuid] + ' → ' + geaendert + ' (auch bloßes Öffnen stempelt)');
    }
  }
  console.log('  ' + anzahl + ' Notizen im Ordner.');
}

/* ==================== Schluss ==================== */
fs.writeFileSync(VORGEMERKT, JSON.stringify(vormerken, null, 2) + '\n', 'utf8');
console.log('');
if (kaputt){
  console.log('⛔ ' + kaputt + ' Messung(en) ohne Grundlage — siehe oben. Das Ergebnis ist unvollständig.');
  process.exit(1);
}
if (neu){
  console.log('→ ' + neu + ' neue Meldung(en). Eintragen, dann: node werkzeuge/regelsammlung-wache.mjs --merken');
  process.exit(2);
}
console.log('Nichts Neues für die Regelsammlung.');
process.exit(0);
