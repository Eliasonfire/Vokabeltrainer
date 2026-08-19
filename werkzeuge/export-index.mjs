/* export-index.mjs -- den Samsung-Notes-Export-Index pruefen und schreiben
 *
 * Aufruf:
 *   node werkzeuge/export-index.mjs --pruefen
 *   node werkzeuge/export-index.mjs --live <list_notes.json>
 *       Haelt den Index gegen die LEBENDE Datenbank. Exitcode 2, wenn eine
 *       Notiz neuer ist als ihr Export.
 *       Vergleicht jeden Eintrag mit dem echten PDF. Schreibt nichts.
 *
 *   node werkzeuge/export-index.mjs --schreiben <uuid> --geaendert <unix-sekunden> [--titel "..."]
 *       Traegt eine Notiz ein. pageCount wird SELBST gemessen, nie uebergeben.
 *
 * WARUM ES DAS GIBT (29.07.2026)
 * -----------------------------
 * Den Index schreibt kein Code, sondern ein manueller Cowork/Computer-Use-
 * Schritt. Der Vertrag dazu steht in MCP-Samsung-Notes-PageRender.md (Z. 14/31):
 *
 *   noteLastModifiedAt = NoteDB.LastModifiedAt ZUM EXPORTZEITPUNKT
 *   pageCount          = Seiten IM PDF
 *
 * Am 28.07.2026 wurden beide Regeln verletzt, und zwar beide Male durch
 * Abschreiben der falschen Quelle:
 *   - als noteLastModifiedAt das DATEIDATUM der PDF eingetragen
 *   - als pageCount die Zaehlung aus der PageDB (143/15/18) statt der echten
 *     PDF-Seiten (142/14/17)
 * Folge: get_note_page_count meldete Seiten, die es im PDF nicht gibt, und der
 * Handschrift-Abgleich der Wartungsroutine fiel ab dem 28.07. in JEDEM Lauf
 * still aus - `vokabeltrainer-wartung.md` Schritt 4 ueberspringt ihn bei
 * veraltetem Eintrag wortlos.
 *
 * Dieses Skript nimmt genau die beiden Handgriffe ab, bei denen es schiefging:
 * es MISST die Seitenzahl selbst und warnt, wenn der uebergebene Zeitstempel
 * verdaechtig nach dem Dateidatum der PDF aussieht - der Signatur des Fehlers
 * von damals.
 *
 * Was es NICHT tut: den Zeitstempel selbst besorgen. Der steht in der
 * Samsung-Notes-Datenbank, die nur die MCP liest (`list_notes` liefert
 * `lastModifiedAt`). Er wird deshalb uebergeben - aber nicht ungeprueft
 * geglaubt. */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ORDNER = process.env.SAMSUNG_NOTES_EXPORT_DIR
  || 'G:\\1. Workspace\\SamsungNotes-Export';
const INDEX = path.join(ORDNER, 'export-index.json');

const args = process.argv.slice(2);
const wert = name => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

function ladeIndex(){
  if (!fs.existsSync(INDEX)) return {};
  try { return JSON.parse(fs.readFileSync(INDEX, 'utf8')); }
  catch (e){ console.error(`${INDEX} ist kein gueltiges JSON: ${e.message}`); process.exit(1); }
}

/* Seiten im PDF - die einzig gueltige Quelle fuer pageCount. */
function pdfSeiten(pfad){
  const aus = execFileSync('pdfinfo', [pfad], { encoding: 'utf8' });
  const m = /^Pages:\s+(\d+)$/m.exec(aus);
  if (!m) throw new Error(`pdfinfo liefert keine Seitenzahl fuer ${pfad}`);
  return Number(m[1]);
}

function pruefen(){
  const index = ladeIndex();
  const uuids = Object.keys(index);
  if (!uuids.length){ console.log('Der Index ist leer.'); return 0; }

  let schief = 0;
  for (const uuid of uuids){
    const e = index[uuid];
    const pdf = path.join(ORDNER, `${uuid}.pdf`);
    console.log(`\n${e.title || '(ohne Titel)'}  [${uuid}]`);

    if (!fs.existsSync(pdf)){
      console.log('  FEHLER  Zur Notiz gibt es kein Export-PDF.');
      schief++; continue;
    }

    const echt = pdfSeiten(pdf);
    const gleich = echt === e.pageCount;
    console.log(`  pageCount   ${e.pageCount}  ${gleich ? '= PDF' : `!= PDF (${echt})`}`);
    if (!gleich) schief++;

    /* Plausibilitaet der Zeitstempel. Ergaenzt 29.07.2026: Vorher prueften wir
       NUR die eine Fehlersignatur von damals (Wert = Dateidatum) und meldeten
       "0 Beanstandungen" auch dann, wenn gar kein brauchbarer Zeitstempel
       dastand - fehlend, 0, oder in Millisekunden. Ein Pruefer, der nur den
       zuletzt gemachten Fehler kennt, ist kein Pruefer. */
    for (const [feld, wert] of [['exportedAt', e.exportedAt], ['noteLastModifiedAt', e.noteLastModifiedAt]]){
      if (typeof wert !== 'number' || !Number.isFinite(wert)){
        console.log(`  FEHLER  ${feld} ist keine Zahl (${JSON.stringify(wert)}).`); schief++; continue;
      }
      if (wert > 1e12){
        console.log(`  FEHLER  ${feld}=${wert} sieht nach MILLISEKUNDEN aus. Erwartet werden Sekunden -`);
        console.log(`          list_notes liefert Millisekunden, also durch 1000 teilen und abrunden.`);
        schief++; continue;
      }
      /* Vor 2020 oder in der Zukunft kann kein Export-Zeitstempel liegen. */
      const jetzt = Math.floor(Date.now() / 1000);
      if (wert < 1577836800 || wert > jetzt + 86400){
        console.log(`  FEHLER  ${feld}=${wert} liegt ausserhalb des Moeglichen (${new Date(wert*1000).toISOString()}).`);
        schief++;
      }
    }
    if (!e.title || !String(e.title).trim()){
      console.log('  Hinweis  title fehlt - erschwert das Wiedererkennen im Index.');
    }

    /* Die Falle von 28.07.: das Dateidatum der PDF als Notiz-Zeitstempel. */
    const dateiSek = Math.floor(fs.statSync(pdf).mtimeMs / 1000);
    const nah = Math.abs(dateiSek - (e.noteLastModifiedAt || 0)) <= 5;
    console.log(`  geaendert   ${e.noteLastModifiedAt}  (${new Date((e.noteLastModifiedAt||0)*1000).toISOString()})`);
    if (nah){
      console.log(`  WARNUNG Der Wert liegt auf dem Dateidatum der PDF (${dateiSek}).`);
      console.log('          Genau so ist der Fehler vom 28.07.26 entstanden.');
      console.log('          Richtig ist NoteDB.LastModifiedAt, siehe list_notes.');
      schief++;
    }

    /* Zur Einordnung, ausdruecklich KEIN Fehler und keine Handlungsaufforderung.
       Samsung Notes stempelt LastModifiedAt auch, wenn eine Notiz nur geoeffnet
       wurde - ein spaeterer Zeitstempel heisst also "angefasst", nicht
       "Inhalt dazugekommen". Fuer diese drei Notizen hat Elias das am 29.07.26
       ausdruecklich entschieden: "da ist nichts neues dazu gekommen". Die PDFs
       zeigen den aktuellen Stand.
       Wichtig: `cacheStale` in der MCP vergleicht etwas ANDERES, naemlich den
       gespeicherten Wert gegen den heutigen DB-Wert. Deshalb kann hier eine
       Differenz stehen und die MCP trotzdem `stale: false` melden - beides ist
       richtig, es sind zwei verschiedene Fragen. */
    if (e.noteLastModifiedAt > e.exportedAt){
      const std = ((e.noteLastModifiedAt - e.exportedAt) / 3600).toFixed(1);
      console.log(`  Zur Info  Notiz ${std} h nach dem Export angefasst. Sagt nichts ueber neuen Inhalt;`);
      console.log('            am 29.07.26 von Elias geklaert. Erst neu exportieren, wenn er sagt, dass er etwas ergaenzt hat.');
    }
  }
  console.log(`\n=== ${schief} Beanstandung(en) bei ${uuids.length} Eintraegen ===`);
  return schief ? 1 : 0;
}

function schreiben(){
  const uuid = wert('--schreiben');
  const geaendert = Number(wert('--geaendert'));
  if (!uuid){ console.error('--schreiben braucht eine UUID.'); process.exit(1); }
  if (!Number.isInteger(geaendert) || geaendert < 1_000_000_000){
    console.error('--geaendert braucht NoteDB.LastModifiedAt in Unix-SEKUNDEN.');
    console.error('list_notes liefert Millisekunden - vorher durch 1000 teilen und abrunden.');
    process.exit(1);
  }
  const pdf = path.join(ORDNER, `${uuid}.pdf`);
  if (!fs.existsSync(pdf)){ console.error(`Kein Export-PDF unter ${pdf}.`); process.exit(1); }

  const dateiSek = Math.floor(fs.statSync(pdf).mtimeMs / 1000);
  if (Math.abs(dateiSek - geaendert) <= 5){
    console.error(`Abgelehnt: --geaendert (${geaendert}) ist das Dateidatum der PDF.`);
    console.error('Gebraucht wird NoteDB.LastModifiedAt aus list_notes, nicht das Dateidatum.');
    console.error('Das war der Fehler vom 28.07.26 - deshalb geht das hier nicht durch.');
    process.exit(1);
  }

  const index = ladeIndex();
  const alt = index[uuid];
  const seiten = pdfSeiten(pdf);                 // gemessen, nicht uebergeben
  index[uuid] = {
    title: wert('--titel') || (alt && alt.title) || uuid,
    exportedAt: dateiSek,                        // wann die PDF entstand
    noteLastModifiedAt: geaendert,
    pageCount: seiten
  };

  /* Vor dem Ueberschreiben sichern - am 29.07. rettete genau so eine Sicherung
     die Rekonstruktion, waehrend die aeltere nur EINE der drei Notizen kannte. */
  if (fs.existsSync(INDEX)){
    const heute = new Date(dateiSek * 1000).toISOString().slice(0, 10);
    fs.copyFileSync(INDEX, `${INDEX}.bak-${heute}`);
  }
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n', 'utf8');

  console.log(`${index[uuid].title}: pageCount ${seiten} (gemessen), geaendert ${geaendert}.`);
  if (alt && alt.pageCount !== seiten)
    console.log(`  pageCount korrigiert: ${alt.pageCount} -> ${seiten}`);
  console.log(`Geschrieben nach ${INDEX}.`);
}


/* ---------------------------------------------------------------------------
   --live <datei>: den Index gegen die LEBENDE Samsung-Notes-Datenbank halten

   ⛔ WARUM DAS FEHLTE, UND WAS ES GEKOSTET HAT (19.08.2026)

   `--pruefen` vergleicht den Index mit sich selbst und mit der PDF. Beides
   sind Werte VOM EXPORTZEITPUNKT. Damit kann diese Pruefung eine spaetere
   Aenderung an der Notiz gar nicht sehen — sie meldet „0 Beanstandungen",
   solange der eingefrorene Stand in sich stimmig ist.
   [[eingefrorenes_feld_ist_kein_zustand]]

   Am 19.08.2026 gemessen: der Index sagt fuer „Madina Buch 1 (Beschriftet)"
   28.07., die Datenbank sagt **09.08.** — die Notiz ist **12,4 Tage** neuer
   als ihr eigener Eintrag, und das Export-PDF stammt vom 27.07. Genau in
   diesem Zeitraum hat Elias die handschriftlichen Notizen ergaenzt, um die er
   heute gebeten hat. `--pruefen` meldete trotzdem gruen.

   ⚠️ Die Datei kommt von aussen, weil nur eine Claude-Sitzung den
   samsung-notes-MCP erreicht — dasselbe Verfahren wie bei
   `vorrat.mjs --stand`. Die Sitzung ruft `list_notes`, schreibt das Ergebnis
   weg, dieses Skript rechnet. So bleibt das Werkzeug offline pruefbar und
   sagt ehrlich, wie alt sein Wissen ist.

   Erwartet wird die Ausgabe von `list_notes` unveraendert: ein Array mit
   `uuid` und `lastModifiedAt` (ISO-Zeichenkette).

   ⭐ Der Schwellwert ist bewusst KEIN Zeitwert. Elias am 29.07.2026: Samsung
   Notes stempelt auch beim blossen Oeffnen, ein spaeterer Zeitstempel heisst
   „angefasst", nicht „Inhalt dazugekommen". Deshalb ist die Meldung hier eine
   FRAGE an ihn und kein Auftrag — ausser er hat gesagt, dass er etwas
   ergaenzt hat. Dann ist sie die Liste, was neu exportiert gehoert.
   --------------------------------------------------------------------------- */
function live(){
  const datei = wert('--live');
  if (!datei){ console.error('--live braucht eine Datei mit der list_notes-Ausgabe.'); return 1; }
  if (!fs.existsSync(datei)){ console.error(`${datei} gibt es nicht.`); return 1; }

  let notizen;
  try { notizen = JSON.parse(fs.readFileSync(datei, 'utf8')); }
  catch (e){ console.error(`${datei} ist kein gueltiges JSON: ${e.message}`); return 1; }
  if (!Array.isArray(notizen)){
    console.error('Erwartet wird das Array aus list_notes.'); return 1;
  }

  const index = ladeIndex();
  const beiUuid = new Map(notizen.map(n => [String(n.uuid), n]));
  const alter = fs.statSync(datei).mtimeMs;
  console.log(`Abgleich gegen list_notes vom ${new Date(alter).toLocaleString('de-DE')}`);
  console.log(`  ${notizen.length} Notizen in der Datei, ${Object.keys(index).length} im Index`);

  let veraltet = 0, unbekannt = 0;
  for (const [uuid, e] of Object.entries(index)){
    const n = beiUuid.get(uuid);
    console.log(`\n${e.title || '(ohne Titel)'}  [${uuid}]`);
    if (!n){
      console.log('  ⚠️ In der list_notes-Ausgabe nicht enthalten — Titel geaendert oder Notiz geloescht?');
      unbekannt++; continue;
    }
    const dbSek = Math.floor(new Date(n.lastModifiedAt).getTime() / 1000);
    if (!Number.isFinite(dbSek)){
      console.log(`  ⚠️ lastModifiedAt nicht lesbar: ${JSON.stringify(n.lastModifiedAt)}`);
      unbekannt++; continue;
    }
    const iso = d => new Date(d * 1000).toLocaleString('de-DE');
    console.log(`  Export      ${iso(e.exportedAt)}`);
    console.log(`  Index sagt  ${iso(e.noteLastModifiedAt)}`);
    console.log(`  Datenbank   ${iso(dbSek)}`);
    if (dbSek > e.noteLastModifiedAt){
      const tage = ((dbSek - e.noteLastModifiedAt) / 86400).toFixed(1);
      console.log(`  ⛔ Die Notiz ist ${tage} Tage neuer als ihr Indexeintrag.`);
      console.log('     Der Export zeigt diesen Stand NICHT. Handschrift, die danach dazukam, fehlt.');
      veraltet++;
    } else {
      console.log('  ✅ Index und Datenbank stimmen ueberein.');
    }
  }

  console.log('');
  if (veraltet){
    console.log(`⛔ ${veraltet} Notiz(en) sind neuer als ihr Export.`);
    console.log('   Neu exportieren kann dieses Skript NICHT: Samsung Notes laesst sich nicht');
    console.log('   fernsteuern (MCP-Samsung-Notes-PageRender.md). Der Weg ist „Als Datei');
    console.log('   speichern → PDF" nach G:\\1. Workspace\\SamsungNotes-Export\\<uuid>.pdf,');
    console.log('   danach `--schreiben <uuid> --geaendert <sek>` mit dem Wert aus list_notes.');
  } else {
    console.log('✅ Kein Export ist hinter seiner Notiz zurueck.');
  }
  if (unbekannt) console.log(`⚠️ ${unbekannt} Eintrag/Eintraege konnten nicht zugeordnet werden.`);
  return veraltet || unbekannt ? 2 : 0;
}

if (args.includes('--pruefen')) process.exit(pruefen());
if (args.includes('--live')) process.exit(live());
if (args.includes('--schreiben')) { schreiben(); process.exit(0); }

console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*|^ \* ?|^ \*/gm, ''));
