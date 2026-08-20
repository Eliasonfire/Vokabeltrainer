/* uebernehmen.mjs -- Baustein E der Regelkette.
 *
 * Traegt freigegebene Kandidaten als Regeln in grammar-data.js ein -
 * EINSCHLIESSLICH der Beispielsatz-Markierung.
 *
 * Aufruf:
 *   node werkzeuge/uebernehmen.mjs --entwuerfe   Entscheidungen -> Entwuerfe
 *   node werkzeuge/uebernehmen.mjs --pruefen     zeigen, was passieren wuerde
 *   node werkzeuge/uebernehmen.mjs --einbauen    fertige Entwuerfe eintragen
 *
 * ================== Warum das zwei Schritte sind ==========================
 *
 * Weil ein Skript keine arabische Grammatik schreiben kann. Name, Erklaerung
 * und der zu markierende Wortlaut muessen aus der Quelle kommen (Goal-Prompt
 * E.1) - erfunden waeren sie wertlos und faenden trotzdem den Weg in die App.
 *
 * Schritt 1 (--entwuerfe) macht alles Mechanische: Kennung, Quellenblock mit
 * Folge und Zeitmarke, Kapitel, dazu der Wortlaut der Stelle als Beleg. Die
 * inhaltlichen Felder bleiben leer und sind ausdruecklich markiert.
 * Schritt 2 (--einbauen) nimmt NUR die Entwuerfe, bei denen nichts mehr leer
 * ist. Ein halb ausgefuellter Entwurf bleibt liegen, statt halb eingebaut zu
 * werden.
 *
 * ================== Die Falle, gegen die dieses Werkzeug gebaut ist =======
 *
 * Eine Regel in grammar-data.js ist in der App NICHT ERREICHBAR, solange kein
 * Beispielsatz sie zeigt: der Weg dorthin fuehrt ausschliesslich ueber
 * SENTENCE_TAGS. Am 18.08.2026 lagen deshalb elf frisch eingetragene Regeln
 * unsichtbar in der Datei - jede Pruefung war gruen, in der App tauchten sie
 * nur als falsche Antwort im Uebungsmodus auf.
 *
 * Darum gilt hier ohne Ausnahme: Findet sich kein Satz, wird die Regel
 * `ausgeblendet: true` gesetzt UND das gemeldet. Eine Regel ohne Markierung
 * und ohne dieses Kennzeichen darf dieses Werkzeug nicht hinterlassen; zum
 * Schluss wird genau das nachgezaehlt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');
const ENTSCHEIDUNGEN = path.join(KAND, 'entscheidungen.json');
const ENTWUERFE = path.join(KAND, 'entwuerfe.json');
const GD = path.join(REPO, 'grammar-data.js');

const nn = n => String(n).padStart(2, '0');
/* Arabisch immer in NFC vergleichen: der Korantext kodiert die Hamzah zerlegt,
   die Lehrbuchsaetze zusammengesetzt. Ohne diesen Schritt scheitert jeder
   Vergleich lautlos - er findet einfach nichts. */
const nfc = s => String(s == null ? '' : s).normalize('NFC');

function ladeGD() {
  const quelle = fs.readFileSync(GD, 'utf8');
  const o = (new Function(quelle
    + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
  return { quelle, ...o };
}

function ladeSaetze() {
  const aus = [];
  const lb = path.join(REPO, 'lehrbuch-saetze.js');
  if (fs.existsSync(lb)) {
    const o = (new Function(fs.readFileSync(lb, 'utf8')
      + ';return typeof LEHRBUCH_SAETZE!=="undefined"?LEHRBUCH_SAETZE:[];'))();
    for (const s of o) aus.push({ id: s.id, ar: nfc(s.sentAr), de: s.sentDe, quelle: 'Lehrbuch' });
  }
  /* Die arabicroots-Saetze stehen in vocab-data.js, NICHT in data/vokabeln-*.js.
     ⚠️ Der erste Entwurf suchte in data/ - die Dateien dort haben zwar Kennung
     und Wort, aber gar keinen Satz (gemessen: 298 Eintraege in madina-1, davon
     0 mit Beispielsatz). Das Werkzeug meldete daraufhin brav "27 Saetze zur
     Auswahl" statt knapp 200 und haette fast jede Regel als "kein Satz
     gefunden" ausgeblendet. Die Zahl sah plausibel aus - genau deshalb steht
     unten die Herkunft dabei. */
  const vd = path.join(REPO, 'vocab-data.js');
  let ausVokabeln = 0;
  if (fs.existsSync(vd)) {
    let o = null;
    try {
      o = (new Function(fs.readFileSync(vd, 'utf8')
        + ';return typeof VOCAB_DATA!=="undefined"?VOCAB_DATA:null;'))();
    } catch (e) {
      console.log(`⚠️  vocab-data.js liess sich nicht laden: ${e.message}`);
    }
    if (Array.isArray(o)) {
      for (const v of o) {
        if (!v || !v.sentAr || v.id == null) continue;
        aus.push({ id: String(v.id), ar: nfc(v.sentAr), de: v.sentDe, quelle: 'arabicroots' });
        ausVokabeln++;
      }
    }
  }
  /* ⛔ DRITTE QUELLE: data/beispielsaetze.js — bis zum 20.08.2026 fehlte sie.
     Gemessen an dem Tag: 39 (Lehrbuch) + 171 (arabicroots) = 210 Saetze
     standen zur Auswahl, waehrend 148 weitere existierten. **41,3 % der
     Auswahl** fehlten diesem Werkzeug.

     ⭐ Das wiegt hier schwerer als in einem Pruefskript: uebernehmen.mjs
     ordnet neuen Regeln ihren Beispielsatz zu. Was es nicht sieht, kann keine
     Regel bekommen — und die 45 offenen Regelkandidaten aus F14/15/16 laufen
     genau hier durch. Ein Satz, den es nicht kennt, fuehrt zu "kein Satz
     gefunden" und die Regel bliebe unerreichbar.

     ⚠️ Der Kommentar zwei Absaetze weiter oben beschreibt denselben Fehler
     schon einmal ("Die Zahl sah plausibel aus - genau deshalb steht unten die
     Herkunft dabei"). Er hat ihn beim zweiten Mal nicht verhindert, weil er
     ueber das FALSCHE Verzeichnis geschrieben war. [[dritte_satzquelle]]
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

     Dieselbe Luecke steckte in pruefe-markierungen.js (937b1e3) und
     pruefe-taschkil.js (7601424). Drei Werkzeuge, ein Loch. */
  const bs = path.join(REPO, 'data', 'beispielsaetze.js');
  let ausVerfasst = 0;
  if (fs.existsSync(bs)) {
    let o = null;
    try {
      o = (new Function(fs.readFileSync(bs, 'utf8')
        + ';return typeof BEISPIELSAETZE!=="undefined"?BEISPIELSAETZE:null;'))();
    } catch (e) {
      console.log(`⚠️  data/beispielsaetze.js liess sich nicht laden: ${e.message}`);
      console.log('   148 verfasste Saetze stehen damit NICHT zur Auswahl.');
    }
    if (o) {
      const schon = new Set(aus.map(s => String(s.id)));
      for (const k of Object.keys(o)) {
        const s = o[k];
        if (!s || !s.sentAr || schon.has(String(k))) continue;
        aus.push({ id: String(k), ar: nfc(s.sentAr), de: s.sentDe, quelle: 'verfasst' });
        ausVerfasst++;
      }
    }
  } else {
    console.log('⚠️  data/beispielsaetze.js fehlt — 148 verfasste Saetze stehen');
    console.log('   nicht zur Auswahl. Ein Lauf ohne sie sieht genauso aus wie');
    console.log('   einer mit ihnen, nur mit weniger Treffern.');
  }
  return { saetze: aus, ausData: ausVokabeln, ausVerfasst };
}

/* ------------------------------------------------------ Schritt 1: Entwuerfe */

function machEntwuerfe() {
  if (!fs.existsSync(ENTSCHEIDUNGEN)) {
    console.log(`Keine ${path.relative(REPO, ENTSCHEIDUNGEN)}.`);
    console.log('Erst die Freigabeseite durchgehen und dort "Entscheidungen');
    console.log('sichern" druecken, dann die Datei in diesen Ordner legen.');
    process.exit(0);
  }
  const e = JSON.parse(fs.readFileSync(ENTSCHEIDUNGEN, 'utf8'));
  const ja = (e.entscheidungen || []).filter(x => x.wahl === 'ja');
  const spaeter = (e.entscheidungen || []).filter(x => x.wahl === 'spaeter');
  console.log(`${e.entscheidungen.length} Entscheidungen, davon ${ja.length} `
    + `als Regel und ${spaeter.length} auf spaeter.`);
  if (!ja.length) { console.log('Nichts zu entwerfen.'); return; }

  const kandidaten = {};
  for (const f of fs.readdirSync(KAND).filter(x => /^folge-\d+\.json$/.test(x))) {
    const d = JSON.parse(fs.readFileSync(path.join(KAND, f), 'utf8'));
    for (const k of d.kandidaten) kandidaten[`f${d.folge}-${Math.round(k.von)}`] = k;
  }

  const alt = fs.existsSync(ENTWUERFE)
    ? JSON.parse(fs.readFileSync(ENTWUERFE, 'utf8')).entwuerfe || [] : [];
  const nachId = Object.fromEntries(alt.map(x => [x.quelle, x]));

  const raus = [];
  for (const x of ja) {
    if (nachId[x.id]) { raus.push(nachId[x.id]); continue; }   // schon bearbeitet
    const k = kandidaten[x.id] || {};
    raus.push({
      quelle: x.id,
      /* Alles Mechanische ist ausgefuellt ... */
      source: {
        folge: x.folge,
        video: `Folge ${nn(x.folge)}`,
        approxTimestamp: x.zeitmarke,
        chapter: null,
      },
      lehreranteil: k.lehreranteil === undefined ? null : k.lehreranteil,
      notizVonElias: x.notiz || '',
      wortlaut: k.text || '',
      begriffe: Object.keys(k.begriffe || {}),
      /* ... und alles Inhaltliche steht ausdruecklich als offen da.
         AUSFUELLEN heisst hier: aus dem Wortlaut oben belegen, nicht ausdenken. */
      id: '',
      name: '',
      shortExplanation: '',
      color: '',
      kapitel: null,
      markierung: { satzId: '', matchText: '' },
    });
  }

  fs.mkdirSync(KAND, { recursive: true });
  fs.writeFileSync(ENTWUERFE, JSON.stringify({
    stand: e.stand, hinweis:
      'Die leeren Felder muessen aus der Quelle belegt werden (Goal-Prompt E.1). '
      + 'markierung.matchText ist der Wortlaut, der im Beispielsatz unterstrichen '
      + 'wird; bleibt er leer, wird die Regel ausgeblendet eingetragen.',
    entwuerfe: raus,
  }, null, 1), 'utf8');

  const offen = raus.filter(x => !x.id || !x.name || !x.shortExplanation).length;
  console.log(`\n${raus.length} Entwuerfe in ${path.relative(REPO, ENTWUERFE)}`);
  console.log(`${raus.length - offen} vollstaendig, ${offen} warten auf Inhalt.`);
  console.log('\nZum Ausfuellen: je Entwurf id, name, shortExplanation, color,');
  console.log('kapitel und markierung.matchText - alles aus dem mitgelieferten');
  console.log('Wortlaut belegbar. Danach: node werkzeuge/uebernehmen.mjs --pruefen');
}

/* -------------------------------------------------- Schritt 2: Einbauen */

const PFLICHT = ['id', 'name', 'shortExplanation', 'color'];

/* Wort ohne Vokalzeichen - nur zum SUCHEN, nie zum Schreiben. */
const skelett = s => nfc(s).replace(/[ً-ْٰـ]/g, '');

function bewerte(entwuerfe, saetze) {
  return entwuerfe.map(e => {
    const fehlt = PFLICHT.filter(f => !String(e[f] || '').trim());
    if (!Number.isInteger(e.kapitel)) fehlt.push('kapitel');
    const mt = nfc(e.markierung && e.markierung.matchText);
    let treffer = [], ueberTaschkil = null;
    if (mt) {
      treffer = saetze.filter(s => s.ar.includes(mt));
      /* ⚠️ Findet der zeichengenaue Vergleich nichts, wird OHNE Vokalzeichen
         nachgesehen - und das Ergebnis GEMELDET, nicht verwendet.
         Warum das der wichtigste Handgriff in dieser Datei ist: Der Vergleich
         ist zeichengenau, und die Regeldatei schreibt manche Woerter anders
         vokalisiert als die Saetze. Gemessen am 18.08.2026: هَٰذَا mit
         Dolch-Alif trifft 0 Saetze, هَذَا ohne trifft 91. Ein Zeichen
         Unterschied. Ohne diesen Zweig meldete das Werkzeug "kommt in keinem
         Satz vor", traege die Regel ausgeblendet ein - und alles waere gruen,
         waehrend die Regel in der App unerreichbar ist. Genau der Zustand, den
         dieses Werkzeug verhindern soll, nur mit Kennzeichen. */
      if (!treffer.length) {
        const skel = skelett(mt);
        const fast = skel ? saetze.filter(s => skelett(s.ar).includes(skel)) : [];
        if (fast.length) {
          /* Vorgeschlagen wird das GANZE Wort aus dem Satz, nicht der
             zurueckgerechnete Ausschnitt.
             ⚠️ Der erste Entwurf rechnete die Position aus dem vokalzeichenfreien
             Abbild zurueck in den vokalisierten Satz - und verrutschte dabei um
             die Vokalzeichen: aus قِطٌّ wurde قِط, ein anderer Vorschlag begann
             mit einem nackten Sukūn. Ein falscher Vorschlag ist schlimmer als
             keiner, weil er abgetippt wird. Das ganze Wort ist immer richtig
             abgegrenzt und fuer den Menschen ohnehin brauchbarer. */
          const wie = [];
          for (const s of fast) {
            for (const wort of nfc(s.ar).split(/[\s،؟!.:؛]+/).filter(Boolean)) {
              if (skelett(wort).includes(skel)) wie.push(wort);
            }
          }
          if (wie.length) ueberTaschkil = { saetze: fast, formen: [...new Set(wie)] };
        }
      }
    }
    return { e, fehlt, matchText: mt, treffer, ueberTaschkil };
  });
}

function pruefen(zeigeNur) {
  if (!fs.existsSync(ENTWUERFE)) {
    console.log(`Keine ${path.relative(REPO, ENTWUERFE)} - erst --entwuerfe.`);
    process.exit(0);
  }
  const { entwuerfe } = JSON.parse(fs.readFileSync(ENTWUERFE, 'utf8'));
  const { saetze, ausData, ausVerfasst } = ladeSaetze();
  const { GRAMMAR_RULES, SENTENCE_TAGS } = ladeGD();
  const vorhandeneIds = new Set(GRAMMAR_RULES.map(r => r.id));

  /* ⚠️ Die Herkunft wird GERECHNET, nicht als Rest gebildet. Bis zum
     20.08.2026 stand hier `saetze.length - ausData` als "aus dem Lehrbuch" —
     mit der dritten Quelle waeren daraus still 187 statt 39 geworden. Ein
     Restwert stimmt nur so lange, wie es genau zwei Toepfe gibt. */
  const ausLehrbuch = saetze.length - ausData - (ausVerfasst || 0);
  console.log(`${entwuerfe.length} Entwuerfe, ${saetze.length} Saetze zur Auswahl`
    + ` (${ausLehrbuch} aus dem Lehrbuch, ${ausData} aus arabicroots,`
    + ` ${ausVerfasst || 0} verfasst).`);
  if (!ausData) {
    console.log('⚠️  Keine arabicroots-Saetze geladen. "kein Satz gefunden" heisst');
    console.log('    dann nur: nicht im Lehrbuch - nicht: nirgends.');
  }
  if (!ausVerfasst) {
    console.log('⚠️  Keine verfassten Saetze geladen (data/beispielsaetze.js).');
    console.log('    Das sind 41 % der Auswahl — "kein Satz gefunden" waere dann');
    console.log('    kein Befund, sondern eine Folge der fehlenden Quelle.');
  }
  console.log('');

  const bewertet = bewerte(entwuerfe, saetze);
  const fertig = [], warten = [], ohneSatz = [];

  for (const b of bewertet) {
    const kopf = b.e.id || `(ohne Kennung, ${b.e.source.video} ${b.e.source.approxTimestamp})`;
    if (b.fehlt.length) {
      warten.push(b);
      console.log(`⏳ ${kopf}: wartet auf ${b.fehlt.join(', ')}`);
      continue;
    }
    if (vorhandeneIds.has(b.e.id)) {
      warten.push(b);
      console.log(`⛔ ${kopf}: diese Kennung gibt es schon in grammar-data.js`);
      continue;
    }
    if (!b.matchText) {
      ohneSatz.push(b);
      console.log(`⚠️  ${kopf}: kein matchText -> wird AUSGEBLENDET eingetragen`);
      fertig.push(b); continue;
    }
    if (!b.treffer.length) {
      /* Der Taschkil-Fall zuerst: er sieht wie "kommt nicht vor" aus, ist aber
         etwas voellig anderes und in einer Minute behoben. */
      if (b.ueberTaschkil) {
        warten.push(b);
        console.log(`⛔ ${kopf}: "${b.matchText}" kommt zeichengenau in keinem`);
        console.log(`     Satz vor - OHNE Vokalzeichen aber in `
          + `${b.ueberTaschkil.saetze.length}. Die Saetze schreiben es:`);
        for (const f of b.ueberTaschkil.formen.slice(0, 3)) {
          console.log(`       ${f}   (statt ${b.matchText})`);
        }
        console.log(`     -> matchText auf die Schreibweise der Saetze aendern.`);
        console.log(`        NICHT ausgeblendet eingetragen: die Regel HAT einen`);
        console.log(`        Beispielsatz, nur die Vokalisierung passt nicht.`);
        continue;
      }
      ohneSatz.push(b);
      console.log(`⚠️  ${kopf}: "${b.matchText}" kommt in keinem Satz vor,`);
      console.log(`     auch nicht ohne Vokalzeichen -> wird AUSGEBLENDET`);
      console.log(`     eingetragen, damit sie nicht unerreichbar herumliegt.`);
      fertig.push(b); continue;
    }
    /* Ueberschneidung mit einer schon vorhandenen Markierung im selben Satz:
       zwei Unterstreichungen, die einander enthalten, ergeben in der App ein
       kaputtes Satzbild. Der Punkt am Wortende hat das schon einmal verdeckt. */
    const satz = b.treffer[0];
    const bisher = SENTENCE_TAGS[satz.id] || [];
    const kollision = bisher.find(t => {
      const a = nfc(t.matchText);
      return a.includes(b.matchText) || b.matchText.includes(a);
    });
    if (kollision) {
      warten.push(b);
      console.log(`⛔ ${kopf}: "${b.matchText}" ueberschneidet sich in Satz `
        + `${satz.id} mit "${kollision.matchText}" (${kollision.ruleId})`);
      continue;
    }
    /* ⚠️ Auch gegen die anderen Entwuerfe DIESES Laufs pruefen. Der Vergleich
       oben sieht nur in die Datei; zwei neue Markierungen desselben Stapels,
       die einander enthalten und auf denselben Satz zeigen, kamen ungeprueft
       durch - und keine der drei Sicherungen unten haette es gemeldet. */
    const imStapel = fertig.find(x => x.satz && x.satz.id === satz.id
      && (x.matchText.includes(b.matchText) || b.matchText.includes(x.matchText)));
    if (imStapel) {
      warten.push(b);
      console.log(`⛔ ${kopf}: "${b.matchText}" ueberschneidet sich in Satz `
        + `${satz.id} mit "${imStapel.matchText}" (${imStapel.e.id}) - beide`);
      console.log(`     aus diesem Lauf. Einen von beiden auf einen anderen Satz legen.`);
      continue;
    }
    b.satz = satz;
    fertig.push(b);
    /* Bei mehreren passenden Saetzen wird der erste genommen - das ist die
       Ladereihenfolge (Lehrbuch vor arabicroots), keine Auswahl. Deshalb wird
       gesagt, WELCHER es ist und wie viele es noch gaebe. */
    console.log(`✅ ${kopf}: Satz ${satz.id} (${satz.quelle})`
      + `${b.treffer.length > 1
        ? `  — von ${b.treffer.length} moeglichen der erste; andere: `
          + b.treffer.slice(1, 4).map(s => s.id).join(', ')
          + (b.treffer.length > 4 ? ' …' : '')
        : ''}`);
  }

  console.log(`\n${fertig.length} eintragbar, ${warten.length} warten,`
    + ` ${ohneSatz.length} davon ohne Beispielsatz (werden ausgeblendet).`);
  if (zeigeNur) {
    console.log('\n--pruefen: es wurde nichts geaendert.');
    if (fertig.length) console.log('Eintragen mit: node werkzeuge/uebernehmen.mjs --einbauen');
  }
  return { fertig, warten, ohneSatz };
}

function einbauen() {
  const { fertig } = pruefen(false);
  if (!fertig.length) { console.log('\nNichts einzutragen.'); return; }

  /* ⚠️ Eine vorhandene Sicherung NICHT ueberschreiben. Stammt sie aus einem
     abgebrochenen Lauf, ist sie womoeglich die einzige heile Fassung - und die
     Ruecknahme wuerde dann den Schaden wiederherstellen statt ihn zu beheben.
     Lieber abbrechen und den Menschen entscheiden lassen. */
  const sicherung = GD + '.vor-uebernahme';
  if (fs.existsSync(sicherung)) {
    console.log(`\n⛔ Es liegt schon eine Sicherung: ${path.relative(REPO, sicherung)}`);
    console.log('   Sie stammt aus einem Lauf, der nicht sauber zu Ende kam.');
    console.log('   Erst vergleichen (git diff grammar-data.js), dann die');
    console.log('   Sicherung von Hand entfernen. Hier wird nichts geschrieben.');
    process.exitCode = 2;
    return;
  }
  fs.copyFileSync(GD, sicherung);
  console.log(`\nSicherung: ${path.relative(REPO, sicherung)}`);

  /* Wie viele Markierungen es VOR der Aenderung gab. Diese Zahl ist die
     schaerfste Zusicherung dieses Werkzeugs: Markierungen duerfen nur
     dazukommen, nie verschwinden. Die Nachzaehlung "keine Regel ohne Zugang"
     allein reicht nicht - sie merkt einen verlorenen Eintrag nur, wenn die
     Regel dadurch voellig unmarkiert wird, und 51 der 77 markierten Regeln
     haengen an mehreren Saetzen. Gemessen deckt sie so nur 25 von 173 Faellen ab. */
  const vorher = ladeGD();
  const markenVorher = Object.values(vorher.SENTENCE_TAGS).flat().length;
  const listenVorher = Object.keys(vorher.SENTENCE_TAGS).length;

  let quelle = fs.readFileSync(GD, 'utf8');
  const zeilenende = quelle.includes('\r\n') ? '\r\n' : '\n';

  /* Einfuegepunkte werden GESUCHT, nicht als Zeilennummer festgehalten - die
     verschiebt sich beim ersten Eintrag und trifft danach mitten in eine Regel.
     ⚠️ Und die Suche beginnt AM BLOCK, nicht bei null: quelle.indexOf('\n];')
     nimmt sonst das erste Listenende der ganzen Datei. Heute ist GRAMMAR_RULES
     zufaellig die erste Liste - kommt je eine Farbtabelle darueber, landen alle
     neuen Regeln dort, und wenn sie ausgeblendet sind, meldet keine der drei
     Sicherungen etwas. */
  const startRegeln = quelle.indexOf('const GRAMMAR_RULES');
  const startTags = quelle.indexOf('const SENTENCE_TAGS');
  if (startRegeln < 0 || startTags < 0) {
    console.log('⛔ Aufbau von grammar-data.js nicht erkannt - nichts geaendert.');
    fs.unlinkSync(sicherung);
    return;
  }
  const endeRegeln = quelle.indexOf(zeilenende + '];', startRegeln);
  const endeTags = quelle.indexOf(zeilenende + '};', startTags);
  if (endeRegeln < 0 || endeTags < 0 || endeRegeln > startTags) {
    console.log('⛔ Listenenden nicht plausibel - nichts geaendert.');
    fs.unlinkSync(sicherung);
    return;
  }

  const neueRegeln = [], neueTags = [];
  for (const b of fertig) {
    const r = {
      id: b.e.id, name: b.e.name, shortExplanation: b.e.shortExplanation,
      color: b.e.color, kapitel: b.e.kapitel,
      source: {
        folge: b.e.source.folge, video: b.e.source.video,
        approxTimestamp: b.e.source.approxTimestamp,
        chapter: b.e.source.chapter,
      },
    };
    if (!b.satz) r.ausgeblendet = true;
    const j = JSON.stringify(r, null, 2).split('\n')
      .map((z, i) => i ? '  ' + z : '  ' + z).join(zeilenende);
    neueRegeln.push(j + ',');
    if (b.satz) {
      neueTags.push({
        satzId: String(b.satz.id),
        eintrag: `{ ruleId: ${JSON.stringify(b.e.id)}, `
          + `matchText: ${JSON.stringify(b.matchText)} }`,
      });
    }
  }

  /* Vor dem Einschub pruefen, ob das letzte vorhandene Element schon ein Komma
     hat. Es NICHT zu pruefen hat beim ersten Lauf genau einen Fehler erzeugt:
     die Regelliste endet mit "}," und vertrug den Anhang, das letzte
     SENTENCE_TAGS-Element endet aber mit "]" ohne Komma - der neue Eintrag
     stand unmittelbar dahinter und die Datei war kaputt ("Unexpected string").
     validate.js hat es gefangen und alles zurueckgenommen; hier wird es
     verhindert statt geheilt. */
  /* ⚠️ Kommentare vorher abstreifen. Endet der Bereich vor "];" mit einem
     Blockkommentar, ist das letzte Zeichen "/" - ohne diesen Schritt haengt das
     Werkzeug ein Komma dahinter und schreibt "/* … *​/,". In einem ARRAY ist das
     kein Syntaxfehler, sondern eine Elision: ein Loch.
     Und ein Loch ist schlimmer als ein Fehler, weil es niemand sieht:
     forEach, filter, map und flat ueberspringen es stillschweigend - also
     validate.js, die Nachzaehlung hier UND die App. Nur die drei Werkzeuge mit
     for…of (rueckstand.mjs, pruefe-sprecher.js, pruefe-transkripte.js) stuerzen
     ab, Tage spaeter und an ganz anderer Stelle.
     ⚠️ Die frueheren 400 Zeichen Rueckschau waren Zierde: der Ausdruck ist am
     Ende verankert, ab zwei Zeichen aendert sich nichts mehr. Genau diese
     Scheinrobustheit hat den Kommentarfall beim Lesen unsichtbar gemacht. */
  /* ⚠️ LAENGENTREU: Kommentare werden durch ebenso viele Leerzeichen ersetzt,
     nicht entfernt. Der erste Entwurf setzte ein einzelnes Leerzeichen - damit
     verschiebt sich jede Position dahinter, und die unten berechnete Stelle der
     schliessenden Klammer haette mitten in ein Wort gezeigt. Zeilenumbrueche
     bleiben erhalten, damit Zeilennummern in Fehlermeldungen noch stimmen. */
  const leer = s => s.replace(/[^\n]/g, ' ');
  const ohneKommentare = t => t
    .replace(/\/\*[\s\S]*?\*\//g, leer)
    .replace(/(^|[^:])(\/\/[^\n]*)/g, (m, v, k) => v + leer(k));
  const mitKomma = (text, stelle) =>
    /,\s*$/.test(ohneKommentare(text.slice(0, stelle)).slice(-200)) ? '' : ',';

  quelle = quelle.slice(0, endeRegeln) + mitKomma(quelle, endeRegeln) + zeilenende
    + neueRegeln.join(zeilenende) + quelle.slice(endeRegeln);

  /* Markierungen eintragen - und dabei zwischen "Satz kennt noch keine
     Markierung" und "Satz hat schon eine" unterscheiden.
     ⚠️ Warum das nicht egal ist: SENTENCE_TAGS ist ein Objektliteral. Wird ein
     Schluessel ein zweites Mal vergeben, gewinnt der SPAETERE und der fruehere
     verschwindet - ohne Syntaxfehler, ohne Warnung. Beim ersten Testlauf haette
     genau das die vorhandene Markierung von fragepartikel-hal-01 geloescht und
     die Regel in der App unerreichbar gemacht. validate.js blieb dabei gruen;
     gefangen hat es erst die Nachzaehlung ganz unten. */
  /* Den Schluessel im Block suchen - und zwar unabhaengig von der Sorte der
     Anfuehrungszeichen und NUR innerhalb des Blocks.
     ⚠️ Zwei Fallen auf einmal: JSON.stringify erzeugt immer doppelte
     Anfuehrungszeichen; steht der Schluessel einfach quotiert da, findet die
     Suche nichts, das Werkzeug legt einen ZWEITEN an, und der spaetere gewinnt
     still. Heute sind alle 173 doppelt quotiert - aber SATZ_THEMEN direkt
     darunter schreibt einfach, die Datei mischt die Stile also schon.
     Und ohne Endgrenze wuerde eine gleichlautende Zeichenfolge HINTER dem Block
     gefunden; die Markierung landete dann ausserhalb von SENTENCE_TAGS. */
  function findeSchluessel(text, satzId, von, bis) {
    const block = text.slice(von, bis);
    const roh = satzId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp(`(["'\`]?)${roh}\\1\\s*:`).exec(block);
    return m ? von + m.index : -1;
  }

  for (const t of neueTags) {
    const blockVon = quelle.indexOf('const SENTENCE_TAGS');
    const blockBis = quelle.indexOf(zeilenende + '};', blockVon);
    const stelle = findeSchluessel(quelle, t.satzId, blockVon, blockBis);
    if (stelle >= 0) {
      /* Schluessel gibt es schon: in die vorhandene Liste einhaengen.
         ⚠️ Die schliessende Klammer wird an einem von Kommentaren befreiten
         Abbild gesucht. Eine "]" mitten in einer Begruendung wuerde sonst als
         Listenende genommen - der neue Eintrag landete IM Kommentar, die Datei
         bliebe gueltig, und die Markierung waere weg. */
      const rest = quelle.slice(stelle, blockBis);
      const restOhne = ohneKommentare(rest);
      const relativ = restOhne.indexOf(']');
      if (relativ < 0) {
        console.log(`⛔ Liste zu ${t.satzId} nicht gefunden - uebersprungen`);
        continue;
      }
      const zu = stelle + relativ;
      const davor = quelle.slice(0, zu).replace(/\s*$/, '');
      quelle = davor + ',' + zeilenende + '    ' + t.eintrag + zeilenende
        + '  ' + quelle.slice(zu);
    } else {
      const ende = quelle.indexOf(zeilenende + '};', blockVon);
      quelle = quelle.slice(0, ende) + mitKomma(quelle, ende) + zeilenende
        + `  ${JSON.stringify(t.satzId)}: [` + zeilenende
        + '    ' + t.eintrag + zeilenende + '  ]' + quelle.slice(ende);
    }
  }
  /* ---- VOR dem Schreiben pruefen, nicht danach --------------------------
   *
   * Der neue Inhalt liegt als Zeichenkette vor und laesst sich vollstaendig
   * pruefen, ohne die Datei anzufassen. Erst wenn er durch ist, wird
   * geschrieben.
   *
   * ⚠️ Warum das mehr ist als Kosmetik: Vorher lag zwischen dem Schreiben und
   * der Pruefung ein Fenster, in dem ein Strg-C oder Stromausfall eine
   * geaenderte Datei ohne jeden Hinweis hinterlaesst - und der naechste Lauf
   * bricht dann an der vorhandenen Sicherung ab. Der try/catch fing
   * Ausnahmen, aber kein Signal. Jetzt ist die Datei zum Zeitpunkt der
   * Pruefung noch unberuehrt; nur die abschliessende Gegenprobe mit
   * validate.js braucht sie auf der Platte, und die ist der unwahrscheinliche
   * Fall, weil alles Inhaltliche schon geprueft ist.
   */
  let vorabRegeln, vorabTags;
  try {
    ({ GRAMMAR_RULES: vorabRegeln, SENTENCE_TAGS: vorabTags } =
      (new Function(quelle + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))());
  } catch (e) {
    fs.unlinkSync(sicherung);
    console.log('\n⛔ Der neue Inhalt laedt nicht - NICHTS geschrieben.');
    console.log('   ' + e.message);
    process.exitCode = 2;
    return;
  }

  const vorabFehler = [];
  for (let i = 0; i < vorabRegeln.length; i++) {
    if (vorabRegeln[i] === undefined || !vorabRegeln[i].id) {
      vorabFehler.push(`Loch in GRAMMAR_RULES an Stelle ${i} (ein Komma zu viel)`);
    }
  }
  const tagsNeu = Object.values(vorabTags).flat().length;
  if (tagsNeu !== markenVorher + neueTags.length) {
    vorabFehler.push(`Markierungen: erwartet ${markenVorher + neueTags.length}, `
      + `im neuen Inhalt ${tagsNeu}`
      + (tagsNeu < markenVorher + neueTags.length
        ? ' - es sind welche verschwunden (doppelter Schluessel?)' : ''));
  }
  if (Object.keys(vorabTags).length < listenVorher) {
    vorabFehler.push('eine Satz-Liste ist verschwunden');
  }
  const markiertNeu = new Set(Object.values(vorabTags).flat().map(t => t.ruleId));
  for (const r of vorabRegeln) {
    if (r && !markiertNeu.has(r.id) && !r.ausgeblendet) {
      vorabFehler.push(`${r.id} waere weder markiert noch ausgeblendet`);
    }
  }
  const drinNeu = new Set(vorabRegeln.filter(Boolean).map(r => r.id));
  for (const b of fertig) {
    if (!drinNeu.has(b.e.id)) {
      vorabFehler.push(`${b.e.id} steht nicht in GRAMMAR_RULES `
        + '(in eine andere Liste geschrieben?)');
    }
  }
  if (vorabFehler.length) {
    fs.unlinkSync(sicherung);
    console.log(`\n⛔ ${vorabFehler.length} Fehler im neuen Inhalt - NICHTS geschrieben.`);
    for (const f of vorabFehler.slice(0, 10)) console.log('   ' + f);
    console.log('   Die Datei ist unveraendert; es gibt nichts zurueckzunehmen.');
    process.exitCode = 2;
    return;
  }
  console.log(`Vorabpruefung: ${vorabRegeln.length} Regeln, ${tagsNeu} Markierungen, `
    + 'keine Loecher, keine unerreichbare Regel.');

  /* ⛔ Nie direkt auf die bestehende Datei: grammar-data.js — dieselbe Datei, zweites Werkzeug.
       Bricht der Lauf mitten im Schreiben ab, steht dort eine leere Datei —
       und eine leere Datei besteht jeden Test. Erst daneben, dann umbenennen;
       rename ist auf demselben Laufwerk unteilbar.
       [[leere_datei_besteht_jeden_test]] */
    fs.writeFileSync(GD + '.neu', quelle, 'utf8');
    fs.renameSync(GD + '.neu', GD);
  console.log(`${fertig.length} Regeln und ${neueTags.length} Markierungen eingetragen.`);

  /* ---- Gegenproben. Faellt eine durch, wird zurueckgenommen. -------------
     ⚠️ Alles ab hier steht in try/catch: Wirft eine der Pruefungen selbst
     (etwa weil die Datei nicht mehr laedt), stirbt der Prozess sonst NACH der
     Meldung "gruen" und die Ruecknahme wird nie erreicht. */
  const zurueck = (grund, zeilen = []) => {
    fs.copyFileSync(sicherung, GD);
    fs.unlinkSync(sicherung);
    console.log(`\n⛔ ${grund} - Aenderung ZURUECKGENOMMEN.`);
    for (const z of zeilen) console.log('   ' + z);
    process.exitCode = 2;
  };

  try {
    let gruen = true, ausgabe = '';
    try {
      ausgabe = execFileSync('node', ['validate.js'], { cwd: REPO, encoding: 'utf8' });
    } catch (e) {
      gruen = false; ausgabe = (e.stdout || '') + (e.stderr || '');
    }
    if (!gruen) {
      zurueck('validate.js schlaegt fehl',
        ausgabe.split('\n').filter(z => /fehl|FEHL|⛔|✗/.test(z)).slice(0, 12));
      return;
    }
    console.log('validate.js: gruen.');

    const { GRAMMAR_RULES, SENTENCE_TAGS } = ladeGD();

    /* Zusicherung 1: kein LOCH in der Regelliste. Ein Loch entsteht durch ein
       Komma zu viel und ist unsichtbar - forEach, filter und map ueberspringen
       es, also auch validate.js und die App. Nur for…of stolpert, und zwar
       Tage spaeter in einem anderen Werkzeug. Deshalb wird hier ausdruecklich
       mit einer Index-Schleife nachgesehen. */
    const loecher = [];
    for (let i = 0; i < GRAMMAR_RULES.length; i++) {
      if (GRAMMAR_RULES[i] === undefined || !GRAMMAR_RULES[i].id) loecher.push(i);
    }
    if (loecher.length) {
      zurueck(`${loecher.length} Loch/Loecher in GRAMMAR_RULES`,
        ['an Stelle ' + loecher.join(', ') + ' steht kein Objekt.',
         'Ursache ist fast immer ein Komma zu viel beim Einschub.']);
      return;
    }

    /* Zusicherung 2: Markierungen duerfen nur DAZUkommen.
       Das ist die scharfe Fassung. Die alte Zusicherung ("keine Regel ohne
       Zugang") merkt einen verlorenen Eintrag nur, wenn die Regel dadurch
       voellig unmarkiert wird - gemessen deckt sie damit 25 von 173 Listen ab,
       weil 51 der 77 markierten Regeln an mehreren Saetzen haengen. */
    const markenNachher = Object.values(SENTENCE_TAGS).flat().length;
    const listenNachher = Object.keys(SENTENCE_TAGS).length;
    const erwartet = markenVorher + neueTags.length;
    if (markenNachher !== erwartet || listenNachher < listenVorher) {
      zurueck('Markierungen stimmen nicht', [
        `vorher ${markenVorher} auf ${listenVorher} Saetzen,`,
        `${neueTags.length} neue -> erwartet ${erwartet},`,
        `tatsaechlich ${markenNachher} auf ${listenNachher} Saetzen.`,
        markenNachher < erwartet
          ? 'Es sind welche VERSCHWUNDEN - meist ein doppelt vergebener Schluessel.'
          : 'Es sind zu viele - ein Eintrag wurde doppelt geschrieben.',
      ]);
      return;
    }
    console.log(`Markierungen: ${markenVorher} + ${neueTags.length} = ${markenNachher} ✓`);

    const markiert = new Set(Object.values(SENTENCE_TAGS).flat().map(t => t.ruleId));
    /* Zusicherung 3: keine Regel weder markiert noch ausgeblendet. */
    const unsichtbar = GRAMMAR_RULES.filter(r => !markiert.has(r.id) && !r.ausgeblendet);
    if (unsichtbar.length) {
      zurueck(`${unsichtbar.length} Regeln weder markiert noch ausgeblendet`,
        ['in der App unerreichbar:', ...unsichtbar.map(r => '  ' + r.id)]);
      return;
    }

    /* Zusicherung 4: jede neue Regel ist auch wirklich in GRAMMAR_RULES
       angekommen. Landet ein Eintrag durch einen Suchfehler in einer anderen
       Liste, faellt das sonst NUR auf, wenn er eine Markierung hat - eine
       ausgeblendete Regel hinterlaesst keine Spur, auf die eine Pruefung
       anschlagen koennte. */
    const drin = new Set(GRAMMAR_RULES.map(r => r.id));
    const verirrt = fertig.filter(b => !drin.has(b.e.id)).map(b => b.e.id);
    if (verirrt.length) {
      zurueck(`${verirrt.length} Regeln stehen nicht in GRAMMAR_RULES`,
        ['eingetragen, aber nicht auffindbar: ' + verirrt.join(', '),
         'wahrscheinlich in eine andere Liste der Datei geschrieben.']);
      return;
    }

    console.log(`Keine unerreichbare Regel: ${GRAMMAR_RULES.length} Regeln, `
      + `${markiert.size} markiert, `
      + `${GRAMMAR_RULES.filter(r => r.ausgeblendet).length} bewusst ausgeblendet.`);

    fs.unlinkSync(sicherung);   // alles gut - die Sicherung nicht liegenlassen
    console.log('\nNoch zu tun, damit die Aenderung auch beim Nutzer ankommt:');
    console.log('  1. CACHE_NAME in sw.js hochzaehlen');
    console.log('  2. node werkzeuge/veroeffentlichen.mjs --mit-daten');
    console.log('     (git push allein veroeffentlicht NICHTS)');
  } catch (e) {
    /* Auch ein Absturz IN der Pruefung fuehrt zur Ruecknahme. Ohne diesen
       Zweig bliebe eine womoeglich kaputte Datei stehen, nachdem oben schon
       "gruen" gemeldet wurde. */
    zurueck('Pruefung selbst abgebrochen: ' + e.message);
  }
}

/* -------------------------------------------------------------------- Lauf */

const args = process.argv.slice(2);
if (args.includes('--entwuerfe')) machEntwuerfe();
else if (args.includes('--einbauen')) einbauen();
else if (args.includes('--pruefen')) pruefen(true);
else {
  console.log('Baustein E der Regelkette. Einer von drei Schritten waehlen:');
  console.log('  --entwuerfe   Entscheidungen der Freigabeseite -> Entwuerfe');
  console.log('  --pruefen     zeigen, was eingetragen wuerde (aendert nichts)');
  console.log('  --einbauen    eintragen, danach validate.js; faellt es durch,');
  console.log('                wird die Aenderung zurueckgenommen');
}
