/* pruefe-seitenspeicher.mjs — merkt jede Entscheidungsseite, wenn der
 * Speicher gesperrt ist?
 * ==========================================================================
 *
 * Aufruf:  node werkzeuge/pruefe-seitenspeicher.mjs
 * Exitcode 0 = jede Seite, die speichert, kann es auch sagen
 *          1 = eine Seite speichert stumm
 *
 * WOZU
 *
 * In der Nacht auf den 21.08.2026 waren SECHS von sieben Werkzeugen, die
 * Elias' Entscheidungsseiten erzeugen, gegen gesperrten Speicher
 * ungeschuetzt. Zwei starben dabei sogar beim LADEN — schwarzer Bildschirm,
 * keine Meldung. Die Loesung stand die ganze Zeit in freigabe-seite.mjs,
 * seit einem echten Vorfall ("Storage is disabled inside data: URLs"), und
 * ist nie zu den Nachbarn gewandert.
 *
 * Bei sieben Faellen aus demselben Grund ist die Einzelreparatur nicht mehr
 * die Antwort. Diese Pruefung verhindert die achte.
 * [[allgemeine_regel_statt_listeneintrag]] [[localstorage_kann_werfen]]
 *
 * ⚠️ GEPRUEFT WERDEN DIE WERKZEUGE, nicht die erzeugten Seiten. Vier der
 * sieben schreiben in den Projektordner statt nach artefakte/ — eine
 * Pruefung ueber artefakte/ saehe nur die Haelfte. Und das Werkzeug ist die
 * Ursache, die Seite nur die Wirkung.
 *
 * ⛔ EIGENE DATEI, obwohl pruefe-artefakt-inhalt.mjs thematisch nahe liegt:
 * dessen Schlussmeldung raet "den Vorbehalt in den KOPF der Seite
 * schreiben". Bei einem Speicher-Befund zeigte sie auf die falsche Ursache,
 * und eine Fehlermeldung, die in die Irre fuehrt, ist schlimmer als keine.
 * [[werkzeug_misst_kleineren_bestand]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));

/* Die Vorlage, auf die alle Meldungen zeigen. Fehlt sie, ist der Rat wertlos. */
const VORLAGE = 'freigabe-seite.mjs';
if (!fs.existsSync(path.join(HIER, VORLAGE))){
  console.log('⚠️  ' + VORLAGE + ' gibt es nicht mehr — die Meldungen unten verweisen');
  console.log('    auf eine Vorlage, die niemand mehr nachschlagen kann.');
}

const ohne = [], mit = [];
for (const f of fs.readdirSync(HIER).filter(n => n.endsWith('.mjs'))){
  const t = fs.readFileSync(path.join(HIER, f), 'utf8');
  /* Nur Werkzeuge, die eine Seite mit Speicher erzeugen. Diese Datei selbst
     nennt localStorage nur in Kommentaren — deshalb der Aufruf-Klammerntest
     und die ausdrueckliche Ausnahme. */
  if (f === 'pruefe-seitenspeicher.mjs') continue;
  if (!/localStorage\.setItem\(/.test(t)) continue;
  /* ⛔ UND es muss auch wirklich eine SEITE sein (09.09.2026). Der Test auf
     `localStorage.setItem(` allein traf am 09.09. `pruefe-sicherung.mjs` —
     einen reinen node-Pruefer, der den Speicher nur im Arbeitsspeicher
     NACHSTELLT, um den Rundlauf einer Sicherungsdatei zu messen. Er erzeugt
     keine Seite, und Elias gibt dort nichts ein; die Meldung war ein
     Stichworttreffer. [[stichworttreffer_ist_kein_inhaltstreffer]]

     ⭐ Die Grenze ist gemessen, nicht geschaetzt: alle sieben echten
     Seitenwerkzeuge tragen mindestens DREI HTML-Signale, der Pruefer null.
     ⚠️ Eine Verengung kann eine Pruefung blind machen — deshalb steht unten
     ein Stoertest, der genau das ausschliesst.
     [[begrenzung_haelt_messung_nicht_stand]] */
  const htmlSignale = (t.match(/\.html|<html|<!DOCTYPE|<script/gi) || []).length;
  if (!htmlSignale) continue;
  (/SPEICHER_GEHT/.test(t) ? mit : ohne).push(f);
}

console.log('');
console.log('=== Entscheidungsseiten: merken sie gesperrten Speicher? ===');
console.log('');
for (const f of ohne){
  console.log('  ⛔  werkzeuge/' + f);
  console.log('      erzeugt eine Seite, die speichert, aber nicht merkt, wenn');
  console.log('      der Speicher gesperrt ist. Elias’ Eingaben verschwinden dann');
  console.log('      lautlos, und beim naechsten Oeffnen faengt er von vorn an.');
}
console.log('  ' + mit.length + ' Werkzeug(e) mit Absicherung'
  + (ohne.length ? ', ' + ohne.length + ' OHNE' : ' — keines ohne'));
console.log('');

/* ⛔ STOERTEST ZUR VERENGUNG (09.09.2026). Seit dem HTML-Signal-Test koennte
   diese Pruefung still blind werden — findet sie GAR nichts mehr, meldet sie
   trotzdem „alles in Ordnung". Deshalb eine Untergrenze: am 09.09.2026 gab es
   sieben echte Seitenwerkzeuge. Faellt die Zahl darunter, ist das ein Befund
   ueber die PRUEFUNG, nicht ueber die Seiten.
   [[begrenzung_haelt_messung_nicht_stand]] [[leere_liste_ist_keine_messung]] */
const MINDESTENS = 7;
if (mit.length + ohne.length < MINDESTENS){
  console.log('⛔ Diese Pruefung sieht nur noch ' + (mit.length + ohne.length)
    + ' Seitenwerkzeug(e), am 09.09.2026 waren es ' + MINDESTENS + '.');
  console.log('   Entweder wurden welche entfernt — dann diese Zahl anpassen —');
  console.log('   oder der HTML-Signal-Test ist zu eng und die Pruefung ist blind.');
  process.exit(1);
}

if (ohne.length){
  console.log('⛔ ' + ohne.length + ' Seite(n) speichern stumm.');
  console.log('   Vorlage: werkzeuge/' + VORLAGE + ' — eine Probe beim Start');
  console.log('   (Testeintrag schreiben, lesen, loeschen) und eine sichtbare');
  console.log('   Warnung. ⚠️ warneSpeicher() muss AUCH beim Start gerufen werden:');
  console.log('   war der Speicher von Anfang an gesperrt, kehrt sichern() sofort');
  console.log('   um und die Warnung kaeme nie.');
  process.exit(1);
}
console.log('✅ Jede Seite, die speichert, kann es auch sagen.');
process.exit(0);
