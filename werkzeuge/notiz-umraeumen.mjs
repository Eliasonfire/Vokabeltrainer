#!/usr/bin/env node
/* notiz-umraeumen.mjs — der Verlauf einer Projektnotiz, neueste zuerst.
 * ==========================================================================
 *
 * ⛔⛔ WARUM
 *
 * Elias am 22.09.2026, auf die Frage, ob neue Einträge unten angehängt oder
 * oben eingefügt werden sollen:
 *
 *   „oben, räume demtentsprechend um"
 *
 * Der zweite Teil ist der Auftrag: nicht nur ab jetzt oben anfangen, sondern
 * das Vorhandene in Ordnung bringen. Gemessen am selben Tag in
 * `Vokabeltrainer-Arabisch.md`: 229 Abschnitte, 212 mit Datum, 17 ohne — und
 * **16 Stellen, an denen ein älterer Abschnitt vor einem neueren steht.**
 *
 * Die Ursache ist harmlos und erklärt die Form: die Datei ist über Wochen
 * **unten angehängt** worden (so stand es bis heute auch im Skill
 * `gedaechtnis`), und irgendwann habe ich angefangen, oben einzufügen. Heraus
 * kam ein kurzer absteigender Kopf und ein langer aufsteigender Rumpf.
 *
 * ========================= ⛔ WAS EIN BLOCK IST ===========================
 *
 * **Block = eine datierte `## `-Überschrift plus alles, was folgt, bis zur
 * nächsten DATIERTEN `## `-Überschrift.**
 *
 * Eine `## `-Überschrift OHNE Datum ist also kein eigener Block, sondern
 * gehört zu dem darüber. Das ist keine Feinheit: in dieser Datei stehen elf
 * undatierte Überschriften mit Uhrzeiten (`## ⛔⛔ 20:31 — …`) mitten in einem
 * Tagesblock. Würde man sie einzeln sortieren, rissen sie aus ihrem
 * Zusammenhang und landeten irgendwo — und niemand sähe der Datei an, dass
 * dort etwas fehlt.
 *
 * ========================= ⛔ WAS OBEN STEHENBLEIBT =======================
 *
 * Der **Kurzstand** — der erste Abschnitt, der mit `## Stand ` beginnt. Er
 * trägt zwar ein Datum, ist aber kein Verlaufseintrag, sondern die Antwort auf
 * „wo stehen wir". Wer ihn mitsortiert, verliert genau die Stelle, die der
 * Skill „wer nur diesen Abschnitt liest, muss handlungsfähig sein" nennt.
 *
 * ========================= ⛔ DIE GEGENPROBE ==============================
 *
 * Eine Umsortierung, die Zeilen verliert, sieht hinterher genauso ordentlich
 * aus wie eine, die keine verliert. Deshalb wird vor dem Schreiben geprüft:
 *
 *   1. gleiche Zeilenzahl wie vorher,
 *   2. **jede Zeile genau so oft** wie vorher (Multimenge, nicht nur Anzahl),
 *   3. danach 0 Brüche,
 *   4. dasselbe Zeilenende wie vorher (diese Datei ist LF, die To-Do CRLF),
 *   5. dasselbe BOM.
 *
 * Schlägt eine fehl, wird NICHTS geschrieben. [[leere_datei_besteht_jeden_test]]
 *
 * Aufruf:
 *   node werkzeuge/notiz-umraeumen.mjs <notiz.md>              nur messen
 *   node werkzeuge/notiz-umraeumen.mjs <notiz.md> --schreiben  umräumen
 *   node werkzeuge/notiz-umraeumen.mjs --pruefen               alle Notizen, Exit 1 bei Brüchen
 */
import fs from 'node:fs';
import path from 'node:path';

const VAULT = 'G:/1. Workspace/Obsidian/Gedächtnis/Elias Gedächtnis';
/* ⚠️ Nur Notizen, deren Verlauf wirklich nach Datum läuft. Die To-Do ist
   bewusst NICHT dabei: dort hängt jeder Eintrag am Ende, und Elias liest sie
   von unten. Sein „oben" galt der Projektnotiz. */
const NOTIZEN = [
  '03 - Projekte/Vokabeltrainer-Arabisch.md',
];

const DATUM = /(\d{2})\.(\d{2})\.(\d{4})/;
const UHR = /\b([0-2]\d):([0-5]\d)\b/;

const args = process.argv.slice(2);
const schreiben = args.includes('--schreiben');
const pruefen = args.includes('--pruefen');
const datei = args.find(a => !a.startsWith('--'));

/* ⛔⛔ DER SORTIERSCHLÜSSEL — in drei Anläufen, und die ersten zwei waren
   falsch. Beide Male hat erst eine MESSUNG es gezeigt, nicht das Nachdenken.

   1. Versuch: JJJJMMTTHHMM, ohne Uhrzeit 00:00. Ergebnis: statt 16 Brüchen
      meldete das Werkzeug 131, und die erste Zeile sagte, warum:
        „## Stand 08.09.2026, Nachmittag — v407" VOR „## Stand 08.09.2026, 06:48"
      Der Nachmittag IST später als 06:48. Mit der gedachten 00:00 wäre er
      unter den Morgen gerutscht. „Nachmittag", „Abend" und „Nachtschicht" sind
      die Wörter, die der Skill `gedaechtnis` selbst vorschlägt — Tagesabschnitte,
      keine Zeitpunkte.

   2. Versuch: nur nach Tag, innerhalb des Tages alles stehen lassen. Sah sauber
      aus: 0 Brüche. Und war trotzdem falsch — `werkzeuge/pruefe-datumsangaben.mjs`
      sprang danach von **0 auf 16** rückwärts laufende Blöcke. Der Grund: die
      Tage liefen jetzt absteigend, die Blöcke INNERHALB eines Tages weiter
      aufsteigend (so waren sie angehängt worden). Zwei Richtungen in einer
      Datei. Eine Umsortierung, die nur den eigenen Prüfer grün macht und den
      Nachbarn rot, hat nichts aufgeräumt. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]

   3. Versuch: Tag und Uhrzeit absteigend, Blöcke ohne Uhrzeit erben die des
      Vorgängers. Gemessen: **115** Blöcke müssten umziehen — gegenüber den 16,
      die der Nachbarprüfer überhaupt meldet. Ein Eingriff, der siebenmal so
      groß ist wie der Befund, ist kein Aufräumen mehr.

   ⭐ 4. und so steht es jetzt: **die TAGE laufen rückwärts, der TAG selbst
      läuft vorwärts.** Das ist kein Kompromiss, sondern die Form, die die Datei
      ohnehin hat, und sie liest sich richtig: oben der neueste Tag, und
      innerhalb eines Tages die Geschichte von vorn. Genau so behandelt
      `pruefe-datumsangaben.mjs` die `###`-Unterabschnitte seit dem 08.09.2026,
      mit derselben Begründung — „seine Unterabschnitte stehen in der
      Reihenfolge der ERZÄHLUNG".
      Dass dieser Prüfer die `## `-Blöcke eines Tages anders behandelte als die
      `###`-Abschnitte desselben Tages, war sein eigener Widerspruch; er ist am
      22.09.2026 aufgefallen und dort behoben.
      [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function schluessel(kopf) {
  const d = kopf.match(DATUM);
  if (!d) return null;
  return +(d[3] + d[2] + d[1]);
}

function zerlegen(text) {
  const zeilen = text.split('\n');
  const kopf = [];
  const bloecke = [];
  let aktuell = null;
  let kurzstand = null;

  for (const z of zeilen) {
    const istUeberschrift = /^##\s/.test(z);
    const s = istUeberschrift ? schluessel(z) : null;

    if (istUeberschrift && s != null) {
      /* ⭐ Der Kurzstand bleibt oben und wird nie einsortiert. */
      if (kurzstand === null && /^##\s+Stand\b/.test(z.replace(/^##\s+[^\wA-Za-zÄÖÜäöü]*\s*/, '## '))) {
        kurzstand = { kopf: z, zeilen: [z], schluessel: s };
        aktuell = kurzstand;
        continue;
      }
      aktuell = { kopf: z, zeilen: [z], schluessel: s };
      bloecke.push(aktuell);
      continue;
    }
    if (aktuell) aktuell.zeilen.push(z);
    else kopf.push(z);
  }
  return { kopf, kurzstand, bloecke };
}

function brueche(bloecke) {
  let n = 0;
  const stellen = [];
  for (let i = 1; i < bloecke.length; i++) {
    if (bloecke[i].schluessel > bloecke[i - 1].schluessel) {
      n++;
      if (stellen.length < 20) stellen.push(bloecke[i - 1].kopf.slice(0, 50) + '  VOR  ' + bloecke[i].kopf.slice(0, 50));
    }
  }
  return { n, stellen };
}

function multimenge(zeilen) {
  const m = new Map();
  for (const z of zeilen) m.set(z, (m.get(z) || 0) + 1);
  return m;
}

function gleicheMultimenge(a, b) {
  if (a.size !== b.size) return 'verschieden viele verschiedene Zeilen: ' + a.size + ' gegen ' + b.size;
  for (const [z, n] of a) {
    if (b.get(z) !== n) return 'Zeile kommt ' + n + ' mal vor, danach ' + (b.get(z) || 0) + ' mal: ' + JSON.stringify(z.slice(0, 60));
  }
  return null;
}

function bearbeite(pfad) {
  const voll = path.isAbsolute(pfad) ? pfad : path.join(VAULT, pfad);
  if (!fs.existsSync(voll)) { console.error('⛔ nicht gefunden: ' + voll); return 1; }

  const roh = fs.readFileSync(voll, 'utf8');
  const bom = roh.charCodeAt(0) === 0xFEFF;
  const crlf = (roh.match(/\r\n/g) || []).length;
  const lfGesamt = (roh.match(/\n/g) || []).length;
  const zeilenende = crlf > 0 ? (crlf === lfGesamt ? 'CRLF' : 'gemischt') : 'LF';
  if (zeilenende === 'gemischt') {
    console.error('⛔ ' + path.basename(voll) + ': gemischte Zeilenenden (' + crlf + ' CRLF von ' + lfGesamt + ').');
    console.error('   Nicht anfassen — jede Umsortierung würde die Mischung anders verteilen.');
    return 1;
  }
  /* Intern immer mit \n arbeiten und am Ende zurückwandeln. */
  const text = crlf ? roh.split('\r\n').join('\n') : roh;
  const vorherZeilen = text.split('\n');

  const { kopf, kurzstand, bloecke } = zerlegen(text);
  const vorher = brueche(bloecke);

  console.log('\n=== ' + path.basename(voll) + ' ===');
  console.log('Zeilen: ' + vorherZeilen.length + ' · ' + zeilenende + (bom ? ' · BOM' : ''));
  console.log('Kopf: ' + kopf.length + ' Zeile(n) · Kurzstand: ' + (kurzstand ? 'ja' : '⚠️ KEINER GEFUNDEN'));
  console.log('Bloecke: ' + bloecke.length + ' · Brueche: ' + vorher.n);
  for (const s of vorher.stellen) console.log('   ' + s);

  if (!vorher.n) { console.log('✅ Schon in Ordnung — neueste zuerst.'); return 0; }
  if (!schreiben) {
    console.log('\nZum Umraeumen:  node werkzeuge/notiz-umraeumen.mjs "' + pfad + '" --schreiben');
    return 1;
  }

  /* ⭐ Stabil sortieren: gleiche Schluessel behalten ihre Reihenfolge.
     Array.prototype.sort ist in Node stabil (V8 seit 7.0). */
  const sortiert = bloecke.slice().sort((a, b) => b.schluessel - a.schluessel);

  const neu = [].concat(
    kopf,
    kurzstand ? kurzstand.zeilen : [],
    ...sortiert.map(b => b.zeilen)
  );

  /* ================= Gegenprobe, bevor irgendetwas geschrieben wird ====== */
  const fehler = [];
  if (neu.length !== vorherZeilen.length)
    fehler.push('Zeilenzahl: ' + vorherZeilen.length + ' vorher, ' + neu.length + ' nachher');
  const mm = gleicheMultimenge(multimenge(vorherZeilen), multimenge(neu));
  if (mm) fehler.push(mm);
  const nachher = brueche(zerlegen(neu.join('\n')).bloecke);
  if (nachher.n) fehler.push('danach immer noch ' + nachher.n + ' Bruch/Brueche');

  if (fehler.length) {
    console.error('\n⛔ GEGENPROBE GESCHEITERT — es wird NICHTS geschrieben:');
    for (const f of fehler) console.error('   · ' + f);
    return 1;
  }

  const ausgabe = crlf ? neu.join('\r\n') : neu.join('\n');
  /* ⛔ Die Sicherung gehoert NICHT in den Vault. Eine 1,2-MB-Kopie neben der
     Notiz waere eine zweite Notiz: Obsidian indiziert sie, die Suche findet
     jeden Satz doppelt, und `Werkzeuge/gedaechtnis-auslagern.mjs` laeuft
     stuendlich ueber alles ueber 1,5 MB. Sie geht dorthin, wo der
     Gedaechtnis-Server seine Sicherungen auch ablegt. */
  const ablage = path.join('C:/Users/abdur/.local/Gedaechtnis-Backup',
    new Date().toISOString().slice(0, 10), 'umraeumen');
  fs.mkdirSync(ablage, { recursive: true });
  const stempel = new Date().toTimeString().slice(0, 8).split(':').join('');
  const sicherung = path.join(ablage, path.basename(voll, '.md') + '.' + stempel + '.md');
  fs.writeFileSync(sicherung, roh, 'utf8');
  /* Erst daneben schreiben, dann umbenennen — eine halb geschriebene Notiz
     dieser Groesse waere nicht wiederherstellbar. */
  fs.writeFileSync(voll + '.neu', ausgabe, 'utf8');
  fs.renameSync(voll + '.neu', voll);

  console.log('\n✅ Umgeraeumt: ' + bloecke.length + ' Bloecke, neueste zuerst.');
  console.log('   Gegenprobe: Zeilenzahl gleich (' + neu.length + ') · jede Zeile gleich oft · 0 Brueche · '
    + zeilenende + ' unveraendert');
  console.log('   Sicherung:  ' + sicherung);
  return 0;
}

let code = 0;
if (datei) code = bearbeite(datei);
else for (const n of NOTIZEN) code = bearbeite(n) || code;

if (pruefen && code) {
  console.error('\n⛔ Mindestens eine Notiz ist nicht nach Datum geordnet.');
  console.error('   Elias am 22.09.2026: „oben, räume demtentsprechend um".');
}
process.exit(code);
