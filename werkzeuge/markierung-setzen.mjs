/* markierung-setzen.mjs -- eine Markierung an eine SCHON VORHANDENE Regel haengen
 * (oder eine ueberzaehlige wieder abnehmen).
 *
 * Aufruf:
 *   node werkzeuge/markierung-setzen.mjs <auftrag.json> --pruefen    zeigen, was passieren wuerde
 *   node werkzeuge/markierung-setzen.mjs <auftrag.json> --einbauen   eintragen
 *
 * Aufbau der Auftragsdatei:
 *   {
 *     "markierungen": [
 *       { "satzId": "mb1-46-2", "ruleId": "zarf-makan-rollenname-01",
 *         "matchText": "<arabisch>", "warum": "Beleg in einem Satz" }
 *     ],
 *     "entfernen": [
 *       { "satzId": "mb1-51-1", "ruleId": "istifham-liman-01", "warum": "..." }
 *     ],
 *     "entsperren": ["zarf-makan-rollenname-01"]
 *   }
 *
 * ⛔ WARUM DER TEXT IN EINER DATEI STEHT UND NICHT AUF DER BEFEHLSZEILE
 * Arabisch mit Taschkil in einer Shell-Zeichenkette ist an einem einzigen Tag
 * fuenfmal schiefgegangen - jedes Mal lautlos, weil die Shell Teile des Textes
 * schluckt und der Rest gueltig aussieht. Deshalb JSON, immer.
 *
 * ================== WOZU DAS NEBEN uebernehmen.mjs ========================
 *
 * uebernehmen.mjs traegt NEUE Regeln aus der Kandidatenkette ein und braucht
 * dafuer entscheidungen.json. Dieses Werkzeug macht den umgekehrten,
 * kleineren Fall: die Regel steht schon in grammar-data.js, ihr fehlt nur der
 * Beispielsatz, der sie in der App ueberhaupt erreichbar macht.
 *
 * Am 18.08.2026 betraf das 13 Regeln. Drei davon liessen sich ohne jeden neuen
 * Satz sichtbar machen, weil in vorhandenen Saetzen noch ein Markierungsplatz
 * frei war - dafuer gab es bis dahin kein Werkzeug.
 *
 * ================== ⛔ DIE FALLE, DIE DIESES WERKZEUG NICHT STELLEN DARF ===
 *
 * `ausgeblendet: true` hat ZWEI voellig verschiedene Bedeutungen, und sie
 * sehen in der Datei gleich aus:
 *
 *   1. Die Kette fand keinen Beispielsatz -- dann ist es ein Platzhalter und
 *      soll weg, sobald eine Markierung da ist.
 *   2. Elias hat die Regel ABBESTELLT -- ta-marbuta-fem-01, am 29.07.2026:
 *      "Die Regel fuer weibliche Endungen brauche ich nicht." Die Regel hat
 *      8 Markierungen UND ist ausgeblendet. Das ist kein Widerspruch, das ist
 *      seine Entscheidung.
 *
 * Ein Werkzeug, das `ausgeblendet` automatisch loescht, sobald eine Regel eine
 * Markierung hat, haette ihm diese Regel zurueck in die App geholt. Deshalb:
 * Entsperren passiert NUR fuer Regeln, die in `entsperren` ausdruecklich
 * genannt sind, und das Werkzeug verweigert es, wenn im Regelblock ein Hinweis
 * auf eine Abbestellung steht.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GD = path.join(REPO, 'grammar-data.js');

/* Arabisch immer in NFC vergleichen. Der Korantext kodiert die Hamzah zerlegt,
   die Lehrbuchsaetze zusammengesetzt; ohne diesen Schritt findet der Vergleich
   einfach nichts und meldet keinen Fehler. */
const nfc = s => String(s == null ? '' : s).normalize('NFC');

/* Kommentare durch Leerzeichen ersetzen, LAENGENTREU - nur so bleiben die
   Fundstellen im Abbild und im Original dieselben. Ein Blockkommentar vor der
   schliessenden Klammer hat sonst schon einen Eintrag mitten in eine
   Begruendung geschrieben; die Datei blieb gueltig, die Markierung war weg. */
const leer = s => s.replace(/[^\n]/g, ' ');
const ohneKommentare = t => t
  .replace(/\/\*[\s\S]*?\*\//g, leer)
  .replace(/(^|[^:])(\/\/[^\n]*)/g, (v, vor, k) => vor + leer(k));

function ladeGD() {
  const quelle = fs.readFileSync(GD, 'utf8');
  const o = (new Function(quelle + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))();
  return { quelle, ...o };
}

function ladeSaetze() {
  const aus = new Map();
  const lb = path.join(REPO, 'lehrbuch-saetze.js');
  if (fs.existsSync(lb)) {
    const o = (new Function(fs.readFileSync(lb, 'utf8')
      + ';return typeof LEHRBUCH_SAETZE!=="undefined"?LEHRBUCH_SAETZE:[];'))();
    for (const s of o) if (s && s.sentAr)
      aus.set(String(s.id), { ar: nfc(s.sentAr), de: s.sentDe || '', woher: 'Lehrbuch S.' + s.seite });
  }
  /* ⚠️ Die arabicroots-Saetze stehen in vocab-data.js, NICHT in
     data/vokabeln-*.js. Die Dateien dort haben Kennungen, aber keinen einzigen
     Satz - ein erster Entwurf suchte dort und fand 27 statt 198. */
  const vd = path.join(REPO, 'vocab-data.js');
  if (fs.existsSync(vd)) {
    const o = (new Function(fs.readFileSync(vd, 'utf8')
      + ';return typeof VOCAB_DATA!=="undefined"?VOCAB_DATA:[];'))();
    for (const v of o) if (v && v.sentAr)
      aus.set(String(v.id), { ar: nfc(v.sentAr), de: v.sentDe || '', woher: 'arabicroots' });
  }
  /* ⛔⛔ DRITTE QUELLE, am 19.08.2026 dazu — und ihr Fehlen war kein Schoenheits-
     fehler. Die fuenf an dem Tag verfassten Saetze liegen in
     data/beispielsaetze.js. Dieses Werkzeug kannte sie nicht und meldete
     "Satz nicht gefunden (weder Lehrbuch noch arabicroots)" — es liess sich
     also gar KEINE Markierung an sie haengen. Damit standen sie nur unter
     "Alle", in keinem Thema, und erzeugten keine einzige Uebungsaufgabe.

     ⚠️ Dieselbe Luecke hatte am selben Tag pruefe-saetze.js. Wer eine vierte
     Satzquelle anlegt, muss BEIDE Werkzeuge mitnehmen — und vorrat.mjs, das
     die Vollstaendigkeit misst.

     Reihenfolge: zuletzt geladen gewinnt nicht, denn beispielsaetze.js traegt
     nur Saetze zu Woertern, die in vocab-data.js KEINEN haben. Ueberschneidung
     gibt es nicht; stuende doch eine da, waere die handverlesene aus
     vocab-data.js die aeltere und richtige — deshalb wird hier nur ergaenzt. */
  /* ⛔⛔ VIERTE QUELLE (19.08.2026): data/fachbegriffe.js.
     Der Kommentar oben sagt: "Wer eine vierte Satzquelle anlegt, muss BEIDE
     Werkzeuge mitnehmen." Genau das ist jetzt eingetreten — die fuenf
     Besitzendungen sind Karteikarten MIT `sentAr`, und js/saetze.js liest
     `VOCAB_DATA.filter(w => w.sentAr)`. Ohne diesen Block meldete das
     Werkzeug "Satz nicht gefunden" und keine der fuenf haette je eine
     Markierung bekommen. */
  const fb = path.join(REPO, 'data', 'fachbegriffe.js');
  if (fs.existsSync(fb)) {
    const o = (new Function(fs.readFileSync(fb, 'utf8')
      + ';return typeof FACHBEGRIFF_VOKABELN!=="undefined"?FACHBEGRIFF_VOKABELN:[];'))();
    for (const v of o) if (v && v.sentAr && !aus.has(String(v.id)))
      aus.set(String(v.id), { ar: nfc(v.sentAr), de: v.sentDe || '', woher: 'fachbegriff' });
  }
  const bs = path.join(REPO, 'data', 'beispielsaetze.js');
  if (fs.existsSync(bs)) {
    const o = (new Function(fs.readFileSync(bs, 'utf8')
      + ';return typeof BEISPIELSAETZE!=="undefined"?BEISPIELSAETZE:{};'))();
    for (const [id, s] of Object.entries(o || {}))
      if (s && s.sentAr && !aus.has(String(id)))
        aus.set(String(id), { ar: nfc(s.sentAr), de: s.sentDe || '', woher: 'verfasst' });
  }
  return aus;
}

/* Den Schluessel NUR innerhalb des Blocks suchen und unabhaengig von der Sorte
   der Anfuehrungszeichen. Ohne Endgrenze wuerde eine gleichlautende Zeichenfolge
   HINTER dem Block gefunden; ohne Quote-Toleranz legt das Werkzeug einen
   ZWEITEN Schluessel an - und im Objektliteral gewinnt der spaetere still. */
function findeSchluessel(text, satzId, von, bis) {
  const block = text.slice(von, bis);
  const roh = String(satzId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp('(["\'\\u0060]?)' + roh + '\\1\\s*:').exec(block);
  return m ? von + m.index : -1;
}

/* Den Anfang eines Regelblocks im Quelltext finden.
   ⚠️ grammar-data.js mischt zwei Schreibweisen: 84 Regeln stehen als `id:`,
   9 als `"id":` - letztere hat uebernehmen.mjs mit JSON.stringify geschrieben.
   Eine Suche nur nach `id:` findet genau die neun neuen Regeln nicht, also
   ausgerechnet die, um die es hier geht. Erster Versuch am 18.08. brach daran
   ab (immerhin: er brach ab, statt still nichts zu tun). */
function findeRegel(text, id) {
  const roh = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp('["\']?id["\']?\\s*:\\s*["\']' + roh + '["\']').exec(text);
  return m ? m.index : -1;
}

/* Ueberlappung zweier Fundstellen im selben Satz. Zwei Markierungen duerfen
   sich nicht ueberschneiden, sonst zerlegt buildSentenceHtml den Satz falsch. */
function ueberlappt(satz, a, b) {
  const ia = satz.indexOf(a), ib = satz.indexOf(b);
  if (ia < 0 || ib < 0) return false;
  return ia < ib + b.length && ib < ia + a.length;
}

function pruefe(auftrag) {
  const { quelle, GRAMMAR_RULES, SENTENCE_TAGS } = ladeGD();
  const saetze = ladeSaetze();
  const regeln = new Map(GRAMMAR_RULES.filter(Boolean).map(r => [r.id, r]));
  /* ⛔ Der Bestand VOR diesem Lauf, als eigene Menge festgehalten.
     Ohne sie meldete die Pruefung "Regel gibt es schon" fuer jede neue Regel:
     sie lag da schon in derselben Karte, weil die naechste Zeile sie
     hineinlegt. Ein Werkzeug, das seine eigene Eingabe fuer den Bestand
     haelt, kann nur ablehnen. */
  const vorhandeneIds = new Set(regeln.keys());
  /* Regeln, die DIESER Lauf erst anlegt, gelten fuer die Markierungspruefung
     schon als vorhanden - sonst koennte man eine neue Regel nie im selben
     Auftrag sichtbar machen und muesste sie zwischendurch ausgeblendet
     lassen. */
  for (const r of (auftrag.regeln || [])) if (r && r.id) regeln.set(r.id, r);
  const fehler = [], hinweise = [], gut = [];

  for (const m of (auftrag.markierungen || [])) {
    const wo = m.ruleId + ' @ ' + m.satzId;
    const r = regeln.get(m.ruleId);
    if (!r) { fehler.push(wo + ': Regel steht nicht in GRAMMAR_RULES'); continue; }
    const s = saetze.get(String(m.satzId));
    if (!s) { fehler.push(wo + ': Satz nicht gefunden (weder Lehrbuch noch arabicroots)'); continue; }
    const text = nfc(m.matchText);
    if (!text) { fehler.push(wo + ': matchText ist leer'); continue; }
    if (!s.ar.includes(text)) {
      fehler.push(wo + ': matchText kommt im Satz nicht vor');
      hinweise.push('    Satz : ' + s.ar);
      hinweise.push('    Suche: ' + text);
      continue;
    }
    const vorhanden = (SENTENCE_TAGS[String(m.satzId)] || []);
    if (vorhanden.some(t => t.ruleId === m.ruleId)) {
      fehler.push(wo + ': diese Regel ist an diesem Satz schon markiert'); continue;
    }
    const kollision = vorhanden.find(t => ueberlappt(s.ar, text, nfc(t.matchText)));
    if (kollision) {
      fehler.push(wo + ': ueberlappt mit ' + kollision.ruleId + ' {' + kollision.matchText + '}');
      continue;
    }
    if (vorhanden.length >= 3) {
      fehler.push(wo + ': der Satz hat schon 3 Markierungen (Hoechstzahl)'); continue;
    }
    gut.push({ ...m, matchText: text, satz: s, belegt: vorhanden.length });
  }

  /* Neue Regeln pruefen.
     ⚠️ Warum das hier steht und nicht in uebernehmen.mjs: jenes Werkzeug baut
     Entwuerfe aus der Kandidatenkette und kennt nur `source` (Folge +
     Zeitmarke). Eine BUCHREGEL braucht `ergaenzung: true` + `buchQuelle` und
     entsteht beim Lesen, nicht beim Auswerten eines Transkripts. Bis zum
     18.08.2026 gab es dafuer gar keinen gepruefen Weg - die zehn vorhandenen
     Buchregeln stehen von Hand in der Datei. */
  const neueRegeln = [];
  for (const r of (auftrag.regeln || [])) {
    const wo = 'Regel ' + (r.id || '(ohne id)');
    if (!r.id) { fehler.push(wo + ': keine id'); continue; }
    if (vorhandeneIds.has(r.id)) { fehler.push(wo + ': gibt es schon'); continue; }
    for (const f of ['name', 'shortExplanation', 'color'])
      if (!r[f]) fehler.push(wo + ': Feld ' + f + ' fehlt');
    /* ⛔ validate.js weist eine Regel zurueck, die `ergaenzung` UND `source`
       traegt. Beides zugleich behauptet, der Lehrer habe gesagt, was im Buch
       steht - genau die Verwechslung, die Goal-Prompt E.1 verbietet. */
    const hatBuch = r.ergaenzung === true && r.buchQuelle;
    const hatFolge = !!r.source;
    if (hatBuch && hatFolge) fehler.push(wo + ': hat ergaenzung UND source - nur eines von beiden');
    if (!hatBuch && !hatFolge) fehler.push(wo + ': weder source noch ergaenzung+buchQuelle');
    /* ⛔ Diese Bedingungen sind aus validate.js abgeschrieben, nicht erfunden.
       Der erste Lauf am 18.08. schrieb eine Regel, die hier durchkam und
       danach an validate.js scheiterte: `kapitel` fehlte, und das Werk stand
       nicht in dessen Liste. Eine Vorabpruefung, die das eigentliche Tor nicht
       kennt, laesst genau das durch, wogegen sie gebaut ist. Aendert sich
       validate.js, gehoert es hier nachgezogen. */
    const BUCHWERKE = ['sharh-madinah-1', 'bayna-yadayk-2',
                       'madina-schluessel-1', 'madina-schluessel-2', 'madina-schluessel-3'];
    if (hatBuch) {
      if (!Number.isInteger(r.kapitel) || r.kapitel < 1)
        fehler.push(wo + ': ergaenzung braucht ein `kapitel` als Zahl (validate.js besteht darauf)');
      if (!BUCHWERKE.includes(r.buchQuelle.werk))
        fehler.push(wo + ': buchQuelle.werk "' + r.buchQuelle.werk + '" kennt validate.js nicht '
          + '(erlaubt: ' + BUCHWERKE.join(', ') + ')');
      for (const f of ['lektion', 'seite'])
        if (!Number.isInteger(r.buchQuelle[f]) || r.buchQuelle[f] < 1)
          fehler.push(wo + ': buchQuelle.' + f + ' fehlt oder ist keine Zahl');
    }
    neueRegeln.push(r);
  }

  /* Entfernen pruefen. Eine Markierung abzunehmen kann eine Regel unerreichbar
     machen - deshalb wird gezaehlt, was danach noch uebrig bleibt. */
  const weg = [];
  for (const m of (auftrag.entfernen || [])) {
    const wo = m.ruleId + ' @ ' + m.satzId;
    const liste = SENTENCE_TAGS[String(m.satzId)] || [];
    const t = liste.find(x => x.ruleId === m.ruleId);
    if (!t) { fehler.push(wo + ': diese Markierung gibt es dort nicht'); continue; }
    const restlich = Object.entries(SENTENCE_TAGS)
      .filter(([k]) => k !== String(m.satzId))
      .flatMap(([, l]) => l).filter(x => x.ruleId === m.ruleId).length;
    if (!restlich) {
      fehler.push(wo + ': das ist die EINZIGE Markierung dieser Regel - '
        + 'sie waere danach in der App unerreichbar');
      continue;
    }
    weg.push({ ...m, matchText: t.matchText, restlich });
  }

  /* Entsperren pruefen - und die Abbestellung schuetzen. */
  const entsperren = [];
  for (const id of (auftrag.entsperren || [])) {
    const r = regeln.get(id);
    if (!r) { fehler.push('entsperren ' + id + ': Regel gibt es nicht'); continue; }
    if (!r.ausgeblendet) { hinweise.push('  ' + id + ' ist gar nicht ausgeblendet - uebersprungen'); continue; }
    const i = findeRegel(quelle, id);
    const block = i >= 0 ? quelle.slice(i, quelle.indexOf('ausgeblendet', i) + 40) : '';
    if (/abbestellt|brauche ich nicht|nicht mehr angezeigt/i.test(block)) {
      fehler.push('entsperren ' + id + ': im Regelblock steht eine ABBESTELLUNG von Elias '
        + '- das Werkzeug entsperrt sie nicht. Wenn das doch gewollt ist, von Hand und mit Begruendung.');
      continue;
    }
    const wirdMarkiert = gut.some(x => x.ruleId === id)
      || Object.values(SENTENCE_TAGS).flat().some(t => t.ruleId === id);
    if (!wirdMarkiert) {
      fehler.push('entsperren ' + id + ': bekommt keine Markierung - waere danach weder markiert noch ausgeblendet');
      continue;
    }
    entsperren.push(id);
  }

  /* Saetze, die SCHON VORHER mehr als 3 Markierungen haben. Die duerfen den
     Lauf nicht blockieren - sie sind ein alter Mangel, kein Ergebnis dieses
     Auftrags. Gemeldet werden sie trotzdem: am 18.08.2026 hatte mb1-51-1
     unbemerkt 4, eingetragen von uebernehmen.mjs, und keine Pruefung sagte es. */
  const vorherZuViel = new Set(Object.keys(SENTENCE_TAGS)
    .filter(k => SENTENCE_TAGS[k].length > 3));
  for (const k of vorherZuViel)
    hinweise.push('  ⚠️ ' + k + ' hat schon vor diesem Lauf '
      + SENTENCE_TAGS[k].length + ' Markierungen (erlaubt sind 3)');

  return { quelle, GRAMMAR_RULES, SENTENCE_TAGS, neueRegeln, gut, weg, entsperren, fehler, hinweise, vorherZuViel };
}

function zeige(p) {
  console.log('Auftrag: ' + p.neueRegeln.length + ' neue Regel(n), ' + p.gut.length + ' Markierung(en) tragbar, '
    + p.weg.length + ' abzunehmen, ' + p.entsperren.length + ' Regel(n) zu entsperren, '
    + p.fehler.length + ' Fehler.\n');
  for (const g of p.gut) {
    console.log('  ✅ ' + g.ruleId);
    console.log('     Satz [' + g.satzId + ', ' + g.satz.woher + ', ' + g.belegt + '/3 belegt]');
    console.log('     ' + g.satz.ar);
    console.log('     markiert wird: ' + g.matchText);
    if (g.warum) console.log('     warum: ' + g.warum);
  }
  for (const w of p.weg) {
    console.log('  ➖ ' + w.ruleId + ' @ ' + w.satzId + '  {' + w.matchText + '}');
    console.log('     bleibt an ' + w.restlich + ' anderen Satz/Saetzen markiert');
    if (w.warum) console.log('     warum: ' + w.warum);
  }
  for (const e of p.fehler) console.log('  ⛔ ' + e);
  for (const h of p.hinweise) console.log(h);
}

function einbauen(p) {
  if (p.fehler.length) {
    console.log('⛔ ' + p.fehler.length + ' Fehler - NICHTS geschrieben.');
    for (const e of p.fehler) console.log('   ' + e);
    process.exitCode = 2; return;
  }
  if (!p.gut.length && !p.weg.length && !p.entsperren.length && !p.neueRegeln.length) { console.log('Nichts zu tun.'); return; }

  let quelle = p.quelle;
  const ze = /\r\n/.test(quelle) ? '\r\n' : '\n';   /* Zeilenende der Zieldatei MESSEN, nicht annehmen */
  const markenVorher = Object.values(p.SENTENCE_TAGS).flat().length;
  const listenVorher = Object.keys(p.SENTENCE_TAGS).length;

  /* Neue Regeln ans Ende von GRAMMAR_RULES. Zuerst, damit die Markierungen
     danach auf eine Regel zeigen, die schon dasteht. */
  for (const r of p.neueRegeln) {
    const start = quelle.indexOf('const GRAMMAR_RULES');
    const ende = quelle.indexOf(ze + '];', start);
    if (ende < 0) { console.log('⛔ Ende von GRAMMAR_RULES nicht gefunden'); process.exitCode = 2; return; }
    const davor = ohneKommentare(quelle.slice(0, ende)).slice(-200);
    const komma = /,\s*$/.test(davor) ? '' : ',';
    /* JSON.stringify erzeugt immer LF. Die Zeilen einzeln einruecken und mit
       dem Zeilenende der ZIELDATEI zusammensetzen - sonst mischt die Datei
       CRLF und LF, und jede spaetere Suche nach ze + '];' geht daneben. */
    const text = JSON.stringify(r, null, 2).split('\n').map(l => '  ' + l).join(ze);
    quelle = quelle.slice(0, ende) + komma + ze + text + quelle.slice(ende);
  }

  /* Erst abnehmen, dann anhaengen. Andersherum koennte eine gerade gesetzte
     Markierung von der Entfernung wieder getroffen werden. */
  for (const w of p.weg) {
    const blockVon = quelle.indexOf('const SENTENCE_TAGS');
    const blockBis = quelle.indexOf(ze + '};', blockVon);
    const stelle = findeSchluessel(quelle, w.satzId, blockVon, blockBis);
    if (stelle < 0) { console.log('⛔ ' + w.satzId + ' nicht gefunden - abgebrochen'); process.exitCode = 2; return; }
    const listeEnde = stelle + ohneKommentare(quelle.slice(stelle, blockBis)).indexOf(']');
    const abschnitt = quelle.slice(stelle, listeEnde);
    const re = new RegExp('\\{[^{}]*ruleId:\\s*["\']'
      + w.ruleId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\'][^{}]*\\}');
    const m = re.exec(abschnitt);
    if (!m) { console.log('⛔ Eintrag ' + w.ruleId + ' in ' + w.satzId + ' nicht gefunden - abgebrochen'); process.exitCode = 2; return; }
    const von = stelle + m.index;
    const zeilenAnfang = quelle.lastIndexOf('\n', von) + 1;
    let zeilenEnde = quelle.indexOf('\n', von + m[0].length);
    if (zeilenEnde < 0) zeilenEnde = von + m[0].length;
    const zeile = quelle.slice(zeilenAnfang, zeilenEnde).trim();
    if (zeile !== m[0] && zeile !== m[0] + ',') {
      console.log('⛔ ' + w.ruleId + ' @ ' + w.satzId + ' steht nicht allein auf seiner Zeile '
        + '- von Hand entfernen, das Werkzeug raet hier nicht.');
      process.exitCode = 2; return;
    }
    quelle = quelle.slice(0, zeilenAnfang) + quelle.slice(zeilenEnde + 1);
    /* War es der letzte Eintrag, haengt beim vorherigen jetzt ein Komma vor der
       schliessenden Klammer. Das ist gueltiges JavaScript und erzeugt KEIN Loch
       (anders als ein Komma zu viel MITTEN in der Liste), sieht aber unfertig
       aus - also weg damit, und nur innerhalb dieser einen Liste. */
    const neuEnde = stelle + ohneKommentare(quelle.slice(stelle, quelle.indexOf(ze + '};', blockVon))).indexOf(']');
    const kopf = quelle.slice(0, neuEnde), schwanz = quelle.slice(neuEnde);
    quelle = kopf.replace(/,(\s*)$/, '$1') + schwanz;
  }

  for (const g of p.gut) {
    const eintrag = '{ ruleId: ' + JSON.stringify(g.ruleId)
      + ', matchText: ' + JSON.stringify(g.matchText) + ' }';
    const blockVon = quelle.indexOf('const SENTENCE_TAGS');
    const blockBis = quelle.indexOf(ze + '};', blockVon);
    const stelle = findeSchluessel(quelle, g.satzId, blockVon, blockBis);
    if (stelle >= 0) {
      const rest = quelle.slice(stelle, blockBis);
      const relativ = ohneKommentare(rest).indexOf(']');
      if (relativ < 0) { console.log('⛔ Liste zu ' + g.satzId + ' nicht gefunden - abgebrochen'); process.exitCode = 2; return; }
      const zu = stelle + relativ;
      const davor = quelle.slice(0, zu).replace(/\s*$/, '');
      quelle = davor + ',' + ze + '    ' + eintrag + ze + '  ' + quelle.slice(zu);
    } else {
      const ende = quelle.indexOf(ze + '};', blockVon);
      const davor = ohneKommentare(quelle.slice(0, ende)).slice(-200);
      const komma = /,\s*$/.test(davor) ? '' : ',';
      quelle = quelle.slice(0, ende) + komma + ze
        + '  ' + JSON.stringify(String(g.satzId)) + ': [' + ze
        + '    ' + eintrag + ze + '  ]' + quelle.slice(ende);
    }
  }

  /* Entsperren: die Zeile `ausgeblendet: true` im Block dieser Regel entfernen.
     Gesucht wird ab dem Regelanfang, nicht global - sonst trifft es die
     naechste Regel, die zufaellig auch ausgeblendet ist. */
  for (const id of p.entsperren) {
    const i = findeRegel(quelle, id);
    if (i < 0) { console.log('⛔ ' + id + ' im Quelltext nicht gefunden - abgebrochen'); process.exitCode = 2; return; }
    const re = /,?[ \t]*\r?\n[ \t]*"?ausgeblendet"?:\s*true/;
    const m = re.exec(quelle.slice(i, i + 6000));
    if (!m) { console.log('⛔ ' + id + ': ausgeblendet-Zeile im Block nicht gefunden - abgebrochen'); process.exitCode = 2; return; }
    quelle = quelle.slice(0, i + m.index) + quelle.slice(i + m.index + m[0].length);
  }

  /* ---- ALLES pruefen, BEVOR geschrieben wird ---------------------------- */
  let nR, nT;
  try {
    ({ GRAMMAR_RULES: nR, SENTENCE_TAGS: nT } =
      (new Function(quelle + ';return {GRAMMAR_RULES, SENTENCE_TAGS};'))());
  } catch (e) {
    console.log('⛔ Der neue Inhalt laedt nicht - NICHTS geschrieben.\n   ' + e.message);
    process.exitCode = 2; return;
  }
  const probleme = [];
  /* Loecher: `for...of` stuerzt daran, forEach/filter/map ueberspringen sie
     lautlos. Deshalb mit Index pruefen. */
  for (let i = 0; i < nR.length; i++)
    if (nR[i] === undefined || !nR[i].id) probleme.push('Loch in GRAMMAR_RULES an Stelle ' + i);
  for (const k of Object.keys(nT)) {
    const l = nT[k];
    if (!Array.isArray(l)) { probleme.push('SENTENCE_TAGS[' + k + '] ist keine Liste'); continue; }
    for (let i = 0; i < l.length; i++)
      if (l[i] === undefined || !l[i].ruleId) probleme.push('Loch in SENTENCE_TAGS[' + k + '] an Stelle ' + i);
    /* Nur beklagen, was DIESER Lauf verursacht haette. Ein Satz, der schon
       vorher zu viele hatte, wird oben als Hinweis gemeldet - er darf einen
       unbeteiligten Auftrag nicht blockieren. */
    if (l.length > 3 && !p.vorherZuViel.has(k))
      probleme.push(k + ' haette jetzt ' + l.length + ' Markierungen (mehr als 3)');
  }
  const markenNachher = Object.values(nT).flat().length;
  const erwartet = markenVorher + p.gut.length - p.weg.length;
  if (markenNachher !== erwartet)
    probleme.push('Markierungen: erwartet ' + erwartet
      + ', gezaehlt ' + markenNachher + (markenNachher < erwartet
        ? ' - es sind welche verschwunden (doppelter Schluessel?)' : ''));
  if (Object.keys(nT).length < listenVorher) probleme.push('eine Satz-Liste ist verschwunden');
  if (nR.length !== p.GRAMMAR_RULES.length + p.neueRegeln.length)
    probleme.push('Regelzahl: erwartet ' + (p.GRAMMAR_RULES.length + p.neueRegeln.length)
      + ', gezaehlt ' + nR.length);
  for (const r of p.neueRegeln)
    if (!nR.some(x => x && x.id === r.id)) probleme.push(r.id + ' steht nicht in GRAMMAR_RULES');
  const markNeu = new Set(Object.values(nT).flat().map(t => t.ruleId));
  for (const r of nR)
    if (r && !markNeu.has(r.id) && !r.ausgeblendet)
      probleme.push(r.id + ' waere weder markiert noch ausgeblendet');
  if (probleme.length) {
    console.log('⛔ ' + probleme.length + ' Fehler im neuen Inhalt - NICHTS geschrieben.');
    for (const x of probleme) console.log('   ' + x);
    process.exitCode = 2; return;
  }

  const sicherung = GD + '.vor-markierung';
  if (fs.existsSync(sicherung)) {
    console.log('⛔ ' + path.basename(sicherung) + ' liegt noch da - ein frueherer Lauf '
      + 'wurde nicht abgeschlossen. Erst ansehen, dann wegraeumen.');
    process.exitCode = 2; return;
  }
  fs.copyFileSync(GD, sicherung);
  fs.writeFileSync(GD, quelle, 'utf8');

  console.log('Eingetragen: ' + p.neueRegeln.length + ' Regel(n), ' + p.gut.length
    + ' Markierung(en), ' + p.weg.length + ' abgenommen, ' + p.entsperren.length + ' entsperrt.');
  console.log('  Regeln ' + nR.length + ' | Markierungen ' + markenVorher + ' -> ' + markenNachher
    + ' | ausgeblendet ' + nR.filter(r => r && r.ausgeblendet).length);
  console.log('  Sicherung: ' + path.basename(sicherung));
  try {
    console.log('\n--- node validate.js ---');
    console.log(execFileSync('node', ['validate.js'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n').slice(-4).join('\n'));
  } catch (e) {
    console.log('⛔ validate.js meldet einen Fehler:\n' + (e.stdout || e.message));
    console.log('   Zuruecknehmen mit: node -e "require(\'fs\').copyFileSync(\'grammar-data.js.vor-markierung\',\'grammar-data.js\')"');
    process.exitCode = 2;
  }
}

const args = process.argv.slice(2);
const datei = args.find(a => !a.startsWith('--'));
if (!datei) {
  console.log('Aufruf: node werkzeuge/markierung-setzen.mjs <auftrag.json> [--pruefen|--einbauen]');
  process.exit(1);
}
const auftrag = JSON.parse(fs.readFileSync(datei, 'utf8'));
const p = pruefe(auftrag);
zeige(p);
if (args.includes('--einbauen')) { console.log(''); einbauen(p); }
else console.log('\n(nur geprueft - mit --einbauen wird eingetragen)');
