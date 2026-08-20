/* pruefe-volles-programm.mjs — bleibt „das volle Programm" an allen drei Orten
 * dasselbe, und misst es überhaupt jemand?
 *
 *   node werkzeuge/pruefe-volles-programm.mjs              # prüfen
 *   node werkzeuge/pruefe-volles-programm.mjs --angleichen # Kopie neu schreiben
 *
 * Exitcode 0 = alles deckungsgleich, 2 = es läuft auseinander.
 *
 * ================== WOZU ===================================================
 *
 * Elias am 20.08.2026, und das ist der ganze Grund:
 *
 *   „es muss halt recht klar sein was ‚das volle programm‘ ist weil ich glaube
 *    wenn man das nicht aufschreibt, dass du dann nicht das machst was ich
 *    möchte und einfach irgendwas machst."
 *
 * Aufgeschrieben ist es — an DREI Orten. Und genau daran ist es am selben Tag
 * auseinandergelaufen: die Liste wurde nachts von elf auf dreizehn Punkte
 * erweitert (gender, femSg, Verbformen), der Wartungs-Prompt blieb bei elf.
 * Ein neues Nomen hätte damit kein `gender` bekommen, und die Übungen 11 und 12
 * hätten dafür null Aufgaben erzeugt — ohne dass irgendetwas meldet.
 * [[dieselbe_frage_zwei_antworten]]
 *
 * ⛔ Und die zweite Lücke, die dieser Prüfer schliesst: der Wartungs-Prompt
 * verwies auf `C:\Users\abdur\.claude\commands\volles-programm.md` und sagte
 * „jetzt lesen". Die Routine hat `cwd = …\Vokabeltrainer` und `addDirs =
 * ["G:\1. Workspace"]` — `C:\` ist NICHT dabei. Die Anweisung lief seit ihrer
 * Entstehung ins Leere, und ein abgelehnter Zugriff lässt eine Routine nicht
 * abstürzen: sie überspringt und meldet grün. [[anleitung_ohne_berechtigung]]
 *
 * ⭐ Die vierte Prüfung ist die wichtigste: JEDER Punkt der Liste muss von
 * mindestens einem Werkzeug gemessen werden. Ein Punkt, den kein Werkzeug
 * misst, wird nie gemeldet und deshalb nie ergänzt — er steht dann als Anspruch
 * in einer Datei und wirkt nirgends. [[werkzeug_ohne_aufrufer]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht von Hand: der Ordner heisst «1. Workspace» mit
   Leerstelle, die in import.meta.url als %20 steht. */
const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');

const QUELLE = path.join(WURZEL, 'VOLLES-PROGRAMM.md');
const KOPIE  = 'C:\\Users\\abdur\\.claude\\commands\\volles-programm.md';
const PROMPT = path.resolve(WURZEL, '..', 'Automation', 'prompts', 'vokabeltrainer-wartung.md');
const ROUTINEN = path.resolve(WURZEL, '..', 'Automation', 'routines.json');

const ANGLEICHEN = process.argv.includes('--angleichen');
let fehler = 0;
const sag = (ok, text) => { console.log('  ' + (ok ? 'ok  ' : '⛔  ') + text); if (!ok) fehler++; };

/* ---------- 0. Die Quelle muss es geben ---------- */
if (!fs.existsSync(QUELLE)){
  console.error('⛔ Die Quelle fehlt: ' + QUELLE);
  process.exit(2);
}
const quelle = fs.readFileSync(QUELLE, 'utf8');

/* ---------- 1. Die Kopie für /volles-programm ---------- */
if (ANGLEICHEN){
  fs.mkdirSync(path.dirname(KOPIE), { recursive: true });
  const tmp = KOPIE + '.neu';
  fs.writeFileSync(tmp, quelle, 'utf8');
  fs.renameSync(tmp, KOPIE);           /* ⛔ nie direkt überschreiben: ein Abbruch
                                          beim Schreiben hinterliesse eine leere
                                          Datei, und die besteht jeden Test.
                                          [[leere_datei_besteht_jeden_test]] */
  console.log('  ↻   Kopie neu geschrieben: ' + KOPIE);
}
if (!fs.existsSync(KOPIE)){
  sag(false, 'Die Kopie fehlt: ' + KOPIE + '   (--angleichen schreibt sie)');
} else {
  const kopie = fs.readFileSync(KOPIE, 'utf8');
  if (kopie === quelle) sag(true, 'Kopie /volles-programm ist deckungsgleich mit der Quelle.');
  else {
    /* Wo genau? Die erste abweichende Zeile nennen — „ungleich" allein zwingt
       zum Suchen von Hand. */
    const a = quelle.split(/\r?\n/), b = kopie.split(/\r?\n/);
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    sag(false, 'Kopie weicht ab, zuerst in Zeile ' + (i + 1) + ':');
    console.log('        Quelle: ' + String(a[i] ?? '(Ende)').slice(0, 78));
    console.log('        Kopie : ' + String(b[i] ?? '(Ende)').slice(0, 78));
    console.log('        → node werkzeuge/pruefe-volles-programm.mjs --angleichen');
  }
}

/* ---------- 1b. Die Kurzliste im Wartungs-Prompt ----------

   ⭐ Sie wird ERZEUGT, nicht gepflegt. Eine von Hand geführte Zweitliste läuft
   auseinander, sobald jemand nur einen der beiden Orte anfasst — genau so ist
   der Prompt bei elf Punkten stehengeblieben, während die Quelle dreizehn
   hatte. Was erzeugt wird, kann nicht driften. */
const M_AUF = '<!-- ANFANG erzeugte Liste';
const M_ZU  = '<!-- ENDE erzeugte Liste -->';

function kurzlisteBauen(text){
  const zeilen = [...text.matchAll(/^\| (A\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)];
  if (!zeilen.length) return null;
  const z = ['', 'Die ' + zeilen.length + ' Bestandteile in Kurzform — Einzelheiten, Belege und',
    'Fallstricke stehen in `VOLLES-PROGRAMM.md` selbst:', '',
    '| # | Bestandteil | wer es misst | was ohne es ausfällt |', '|---|---|---|---|'];
  zeilen.forEach(m => z.push('| ' + m[1] + ' | ' + m[2] + ' | ' + m[3] + ' | ' + m[4] + ' |'));
  const b = [...text.matchAll(/^\| (B\d+) \| (.+?) \| (.+?) \|$/gm)];
  if (b.length){
    z.push('', 'Und für eine **neue Regel** die ' + b.length + ' Punkte aus Teil B:', '',
      '| # | Bestandteil | Prüfung |', '|---|---|---|');
    b.forEach(m => z.push('| ' + m[1] + ' | ' + m[2] + ' | ' + m[3] + ' |'));
  }
  z.push('');
  return z.join('\n');
}

if (fs.existsSync(PROMPT)){
  const p0 = fs.readFileSync(PROMPT, 'utf8');
  const i = p0.indexOf(M_AUF), j = p0.indexOf(M_ZU);
  if (i < 0 || j < 0 || j < i){
    sag(false, 'Im Wartungs-Prompt fehlen die Marker fuer die erzeugte Kurzliste.');
  } else {
    const kopfEnde = p0.indexOf('-->', i) + 3;
    const jetzt = p0.slice(kopfEnde, j);
    const soll  = '\n' + (kurzlisteBauen(quelle) || '') + '\n';
    if (ANGLEICHEN && jetzt !== soll){
      const neu = p0.slice(0, kopfEnde) + soll + p0.slice(j);
      const tmp = PROMPT + '.neu';
      fs.writeFileSync(tmp, neu, 'utf8');
      fs.renameSync(tmp, PROMPT);
      console.log('  ↻   Kurzliste im Wartungs-Prompt neu erzeugt.');
    } else if (jetzt !== soll){
      sag(false, 'Die Kurzliste im Wartungs-Prompt ist nicht die aus der Quelle erzeugte.');
      console.log('        → node werkzeuge/pruefe-volles-programm.mjs --angleichen');
    } else {
      const n = (soll.match(/^\| A\d+ \|/gm) || []).length;
      sag(true, 'Kurzliste im Wartungs-Prompt ist erzeugt und aktuell (' + n + ' Punkte).');
    }
  }
}

/* ---------- 2. Verweist der Wartungs-Prompt auf einen ERREICHBAREN Ort? ---------- */
if (!fs.existsSync(PROMPT)){
  sag(false, 'Wartungs-Prompt nicht gefunden: ' + PROMPT);
} else {
  const prompt = fs.readFileSync(PROMPT, 'utf8');
  const rout   = fs.existsSync(ROUTINEN)
    ? JSON.parse(fs.readFileSync(ROUTINEN, 'utf8')).routines['vokabeltrainer-wartung'] : null;
  /* Was darf die Routine überhaupt lesen? cwd + addDirs, sonst nichts. */
  const erlaubt = rout ? [rout.cwd, ...(rout.addDirs || [])].map(s => s.toLowerCase()) : [];

  const nennt = prompt.includes('VOLLES-PROGRAMM.md');
  sag(nennt, nennt
    ? 'Wartungs-Prompt verweist auf VOLLES-PROGRAMM.md (liegt in cwd, also lesbar).'
    : 'Wartungs-Prompt nennt VOLLES-PROGRAMM.md nicht — Schritt 1c.4 hat keine Quelle.');

  /* Jeder absolute Pfad im Prompt, der ausserhalb von cwd+addDirs liegt, ist
     eine Anweisung, die die Routine nicht ausführen kann. */
  const pfade = [...prompt.matchAll(/`([A-Za-z]:\\[^`\n]+)`/g)].map(m => m[1]);
  const drausssen = [...new Set(pfade)].filter(p =>
    !erlaubt.some(e => p.toLowerCase().startsWith(e)));
  if (drausssen.length){
    sag(false, drausssen.length + ' Pfad(e) im Prompt liegen ausserhalb von cwd + addDirs:');
    drausssen.forEach(p => console.log('        ' + p));
    console.log('        Die Routine kann sie nicht lesen — sie überspringt still und meldet grün.');
  } else {
    sag(true, 'Alle ' + pfade.length + ' absoluten Pfade im Prompt liegen in cwd oder addDirs.');
  }

  /* ⛔⛔ UND: darf die Routine jeden Befehl, den der Prompt ihr auftraegt,
     ueberhaupt ausfuehren?

     Ein Befehl, der nicht in allowedTools steht, wird abgelehnt. Die Routine
     stirbt daran nicht — sie ueberspringt ihn und meldet gruen. Am 20.08.2026
     gemessen: der neue Schritt 1c.8b rief werkzeuge/freigabe-artefakt.mjs auf,
     und genau dieser Eintrag fehlte. Die Freigabeseite fuer NEUE REGELN waere
     also nie erneuert worden, ohne dass jemand etwas bemerkt haette.

     ⚠️ Verglichen wird der WERKZEUGPFAD, nicht die ganze Zeile: allowedTools
     endet auf „:*", der Prompt haengt Argumente an. Wer die Zeilen vergleicht,
     findet nie einen Treffer. [[anleitung_ohne_berechtigung]] */
  const erlaubteBefehle = (rout && rout.allowedTools) || [];
  /* ⛔ KEIN Regex hier — Muster mit Backslashes ueberleben den Weg durch ein
     Skript, das dieses Skript schreibt, nicht: aus  s+  wurde beim ersten
     Versuch  s , und die Datei liess sich nicht mehr laden. Zeichenweise
     zerlegen ist haesslicher und haelt. [[python_backslash_b_wird_backspace]] */
  const werkzeugAus = (s) => {
    const txt = String(s);
    const i = txt.indexOf("node ");
    if (i < 0) return null;
    let rest = txt.slice(i + 5).trim();
    for (const trenner of [" ", "	", ":", "`"]){
      const k = rest.indexOf(trenner);
      if (k > 0) rest = rest.slice(0, k);
    }
    return (rest.endsWith(".mjs") || rest.endsWith(".js")) ? rest : null;
  };
  const erlaubteWerkzeuge = new Set(erlaubteBefehle.map(werkzeugAus).filter(Boolean));
  /* ⚠️ Zeilenumbruch als Zeichencode, nicht als Escape: eine Kette aus
     Skripten, die Skripte schreiben, frisst Backslashes. Zweimal an diesem
     Nachmittag ist genau daran eine Datei zerbrochen.
     [[python_backslash_b_wird_backspace]] */
  const gefordert = [...new Set(prompt.split(String.fromCharCode(10))
    .map(z => z.replace(String.fromCharCode(13), ""))
    .filter(z => z.trim().startsWith("node "))
    .map(werkzeugAus).filter(Boolean))];
  const ohneRecht = gefordert.filter(w => !erlaubteWerkzeuge.has(w));
  if (!erlaubteBefehle.length){
    sag(false, "routines.json nicht lesbar — die Berechtigungen sind UNGEPRUEFT.");
  } else if (ohneRecht.length){
    sag(false, ohneRecht.length + " Werkzeug(e) im Prompt stehen NICHT in allowedTools:");
    ohneRecht.forEach(w => console.log("        " + w));
    console.log("        Die Routine wird abgelehnt, ueberspringt still und meldet gruen.");
  } else {
    sag(true, "Alle " + gefordert.length + " im Prompt aufgerufenen Werkzeuge stehen in allowedTools.");
  }

  /* ⛔⛔ ZWEI LISTEN FUER DIESELBE PRUEFKETTE.

     VOLLES-PROGRAMM.md fuehrt „Die vollstaendige Pruefkette", der
     Wartungsprompt ruft in Schritt 1c.5 eine Auswahl davon auf. Am
     20.08.2026 gemessen: pruefe-eigene-vorrang.mjs stand NUR im Prompt —
     wer die Kette von Hand fuhr, liess ausgerechnet das Werkzeug aus, das
     prueft, ob alle anderen dieselbe Fassung sehen wie die App.

     Die Regel ist eine Teilmengen-Regel: was der Prompt prueft, muss auch in
     der Kette stehen. Umgekehrt nicht — die Kette darf mehr enthalten.
     [[dieselbe_frage_zwei_antworten]] */
  const ketteVon = quelle.indexOf("# Die vollständige Prüfkette");
  const ketteBis = quelle.indexOf("# Bericht an ihn", ketteVon + 1);
  if (ketteVon < 0 || ketteBis < 0){
    sag(false, "Abschnitt „Die vollständige Prüfkette\" nicht gefunden — UNGEPRUEFT.");
  } else {
    const kette = new Set(quelle.slice(ketteVon, ketteBis).split(String.fromCharCode(10))
      .map(z => z.replace(String.fromCharCode(13), ""))
      .filter(z => z.startsWith("node "))
      .map(werkzeugAus).filter(Boolean));
    /* Nur die PRUEFENDEN aus dem Prompt vergleichen: hole-vokabeln,
       veroeffentlichen und die Artefaktbauer gehoeren nicht in die Kette.

       ⚠️ Und vier Pruefungen gehoeren ausdruecklich NICHT hinein, obwohl sie
       „pruefe-" heissen. Die Kette beantwortet EINE Frage: ist eine Vokabel
       oder eine Regel vollstaendig? Wer sie um alles erweitert, was irgendwo
       prueft, macht sie unbrauchbar — und ein Waechter, der jedes Mal vier
       Fehlalarme meldet, wird nach dem dritten Mal ueberlesen.
       [[kandidatenliste_ist_keine_fehlerliste]]

       ⚠️ EHRLICHE LUECKE: geprueft wird nur die Schnittmenge. Faellt eine
       Pruefung aus der Kette, die der Prompt gar nicht aufruft, faellt es
       hier NICHT auf - im Stoertest gemessen an pruefe-taschkil.js, das der
       Prompt ueber die Kette selbst startet. Angeschlagen hat er dagegen
       sauber bei pruefe-saetze.js, das in Schritt 1c.5 namentlich steht. */
    const NICHT_IN_DIE_KETTE = {
      "werkzeuge/pruefe-volles-programm.mjs":
        "prueft die LISTE selbst, nicht eine Vokabel - es ist der Waechter ueber die Kette",
      "../Automation/pruefe-laeufe.mjs":
        "prueft, ob die Routinen ueberhaupt gelaufen sind - eine Frage an die Automation",
      "pruefe-transkripte.js":
        "prueft die Unterrichtstranskripte, aus denen Regeln erst entstehen",
      "pruefe-sprecher.js":
        "prueft die Sprecherspuren der Videos - kein Feld einer Vokabel",
      /* ⭐ Am 21.08.2026 dazugekommen. Beide pruefen nicht eine VOKABEL,
         sondern das System drumherum — und die Kette beantwortet genau eine
         Frage: ist eine Vokabel oder eine Regel vollstaendig? */
      "werkzeuge/pruefe-artefakt-inhalt.mjs":
        "prueft, ob eine Artefaktseite gesperrtes Kursmaterial traegt - eine Frage an die Veroeffentlichung",
      "werkzeuge/pruefe-erreichbarkeit-eichung.mjs":
        "eicht pruefe-erreichbarkeit.js an drei Faellen - sie prueft den PRUEFER, nicht die Daten",
    };
    const pruefend = gefordert.filter(w =>
      (w.includes("pruefe-") || w === "validate.js" || w === "werkzeuge/vorrat.mjs")
      && !(w in NICHT_IN_DIE_KETTE));
    const fehlt = pruefend.filter(w => !kette.has(w));
    if (fehlt.length){
      sag(false, fehlt.length + " Pruefung(en) laufen im Wartungslauf, stehen aber NICHT in der Kette:");
      fehlt.forEach(w => console.log("        " + w));
      console.log("        Wer die Kette von Hand faehrt, laesst sie aus.");
    } else {
      sag(true, "Alle " + pruefend.length + " Pruefungen des Wartungslaufs stehen auch in der Kette (" + kette.size + " gesamt).");
    }
  }
}

/* ---------- 3. Kennt der Prompt alle Punkte? ---------- */
const aPunkte = [...quelle.matchAll(/^## (A\d+) . (.+)$/gm)].map(m => ({ id: m[1], titel: m[2] }));
const bPunkte = [...quelle.matchAll(/^\| (B\d+) \| (.+?) \|/gm)].map(m => ({ id: m[1], titel: m[2] }));
console.log('');
console.log('  Die Liste führt ' + aPunkte.length + ' Punkte für eine Vokabel und '
  + bPunkte.length + ' für eine Regel.');

/* Alle Feldnamen, die die Liste als Pflicht nennt */
const felder = new Set();
for (const p of aPunkte) for (const m of p.titel.matchAll(/`([a-zA-Z_][a-zA-Z0-9_]*)`/g)) felder.add(m[1]);

/* ---------- 4. ⭐ Misst überhaupt jemand diese Felder? ---------- */
const MESSER = ['werkzeuge/vorrat.mjs', 'validate.js', 'pruefe-wortfelder.js',
                'pruefe-eselsbruecken.js', 'pruefe-saetze.js', 'pruefe-markierungen.js',
                'pruefe-erreichbarkeit.js', 'pruefe-taschkil.js', 'pruefe-quran.js'];
const quelltexte = {};
for (const m of MESSER){
  const d = path.join(WURZEL, m);
  if (fs.existsSync(d)) quelltexte[m] = fs.readFileSync(d, 'utf8');
}
/* ---------- 4a. ⭐ Nennt JEDER Punkt ein Werkzeug, und gibt es das? ----------

   ⛔⛔ BIS ZUM 20.08.2026 PRÜFTE DIESER WÄCHTER 11 VON 13 PUNKTEN NICHT.
   Er sammelte die Pflichtfelder aus BACKTICKS in den A-Überschriften — und
   genau sieben Punkte tragen dort keinen Feldnamen: A6 (Eselsbrücken),
   A7 (Kategorie), A8 (Funktionsanzeige), A9 (Beispielsatz), A10 (Markierungen),
   A11 (Quran-Bezug), A13 (Duplikat). Der Prüfer, der „ein Punkt, den kein
   Werkzeug misst" verhindern soll, sah also die Hälfte der Liste nie.

   Gefunden hat es ein Gegenprüfer, nicht ich — und das ist die Lehre daran:
   ein Werkzeug prüft, wonach es sucht, nicht wonach es benannt ist.
   [[pruefwerkzeug_mit_eingebauter_antwort]]

   Geprüft wird jetzt die dritte Spalte der Übersichtstabelle: sie muss ein
   Werkzeug nennen, und das Werkzeug muss es geben. Was dort steht, ist eine
   Behauptung des Textes — dass sie stimmt, kann diese Prüfung nicht wissen.
   Aber ein Punkt, der GAR KEIN Werkzeug nennt, ist ein Versprechen ohne
   Deckung, und das findet sie. */
const tabelle = [...quelle.matchAll(/^\| (A\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)];

/* ⭐ Je Punkt ein Kennzeichen, das im genannten Werkzeug vorkommen MUSS.
   Am 20.08.2026 an allen zehn nachgemessen — und an der Gegenprobe geeicht:
   `funktionenVon` kommt in pruefe-saetze.js NULL Mal vor, genau der Fall, der
   monatelang unbemerkt blieb.

   ⚠️ A3/A4/A5 stehen hier nicht: ihre Feldnamen (`gender`, `femSg`, `past` …)
   deckt die Feld-Prüfung weiter unten bereits ab, und zwar genauer. */
const KENNZEICHEN = {
  A1:  'type',
  A2:  'root',
  A6:  'lternativ',
  A7:  'WORTFELDER',
  A8:  'funktionenVon',
  A9:  'sentAr',
  A10: 'matchText',
  A11: 'quran',
  A12: 'HARAKA',
  A13: 'FREIGESCHALTET'
};
console.log('');
console.log('  Nennt jeder der ' + tabelle.length + ' Punkte ein Werkzeug, und gibt es das?');
const ohneWerkzeug = [];
for (const [, id, titel, wer] of tabelle){
  /* Werkzeugnamen aus der Spalte holen — alles in Backticks, das wie eine
     Datei aussieht. */
  const genannt = [...wer.matchAll(/`([A-Za-z0-9_\-./]+\.(?:mjs|js))`/g)].map(m => m[1]);
  if (!genannt.length){
    /* Ein Punkt darf ausdrücklich „nur seine App" nennen — das ist eine
       ehrliche Lücke und kein Versäumnis. */
    if (/nur seine App|⛔/.test(wer)){
      console.log('    --   ' + id.padEnd(4) + 'kein Werkzeug möglich: ' + wer.replace(/[⛔*]/g, '').trim());
      continue;
    }
    console.log('    ⛔   ' + id.padEnd(4) + 'nennt KEIN Werkzeug');
    ohneWerkzeug.push(id);
    continue;
  }
  const fehlend = genannt.filter(w => {
    const kandidaten = [path.join(WURZEL, w), path.join(WURZEL, 'werkzeuge', w)];
    return !kandidaten.some(k => fs.existsSync(k));
  });
  if (fehlend.length){
    console.log('    ⛔   ' + id.padEnd(4) + 'nennt ein Werkzeug, das es nicht gibt: ' + fehlend.join(', '));
    ohneWerkzeug.push(id);
    continue;
  }
  /* ⛔ Existieren reicht NICHT. Beruehrt das Werkzeug den Punkt ueberhaupt? */
  const kenn = KENNZEICHEN[id];
  if (kenn){
    const trifft = genannt.some(w => {
      for (const k of [path.join(WURZEL, w), path.join(WURZEL, 'werkzeuge', w)]){
        try {
          /* Kommentare weg — eine Erwaehnung im Kommentar ist keine Messung.
             [[stichworttreffer_im_kommentar]] */
          const code = fs.readFileSync(k, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .split('\n').map(z => z.replace(/\/\/.*$/, '')).join('\n');
          if (code.includes(kenn)) return true;
        } catch { /* naechster Ort */ }
      }
      return false;
    });
    if (!trifft){
      console.log('    ⛔   ' + id.padEnd(4) + 'nennt ' + genannt.join(', ')
        + ' — aber dort kommt „' + kenn + '" nicht vor. Misst es den Punkt wirklich?');
      ohneWerkzeug.push(id);
      continue;
    }
  }
  console.log('    ok   ' + id.padEnd(4) + genannt.join(', ')
    + (kenn ? '   (prüft „' + kenn + '")' : ''));
}
if (ohneWerkzeug.length){
  fehler++;
  console.log('');
  console.log('  ⛔ ' + ohneWerkzeug.length + ' Punkt(e) ohne prüfendes Werkzeug: ' + ohneWerkzeug.join(', '));
}

console.log('');
console.log('  Und die Felder einzeln — misst sie wirklich jemand?');
const ungemessen = [];
for (const f of [...felder].sort()){
  /* Ein Werkzeug misst das Feld, wenn es den Namen als Zeichenkette ODER als
     Eigenschaftszugriff führt. Blosse Erwähnung im Kommentar zählt nicht —
     deshalb wird der Kommentaranteil vorher entfernt. [[stichworttreffer_im_kommentar]] */
  const wer = Object.entries(quelltexte).filter(([, t]) => {
    const ohneKommentar = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    return new RegExp("[.'\"]" + f + "\\b").test(ohneKommentar);
  }).map(([m]) => m);
  if (wer.length) console.log('    ok   ' + f.padEnd(12) + wer.join(', '));
  else { console.log('    ⛔   ' + f.padEnd(12) + 'KEIN Werkzeug misst dieses Feld'); ungemessen.push(f); }
}
if (ungemessen.length){
  fehler++;
  console.log('');
  console.log('  ⛔ ' + ungemessen.length + ' Feld(er) stehen als Pflicht in der Liste, werden aber von');
  console.log('     keinem Werkzeug gemessen. Sie werden deshalb nie gemeldet und nie');
  console.log('     ergänzt — die Liste verspricht dort etwas, das nicht stattfindet.');
}

console.log('');
if (fehler){
  console.log('⛔ ' + fehler + ' Befund(e). „Das volle Programm" ist nicht an allen Orten dasselbe.');
  process.exit(2);
}
console.log('✅ Quelle, Kopie, Wartungs-Prompt und Messwerkzeuge sind deckungsgleich.');
process.exit(0);
