/* pruefe-muster.mjs — Suchmuster, denen der Backslash abhanden gekommen ist
 * ===========================================================================
 *
 * ⛔⛔ WARUM ES DIESES WERKZEUG GIBT
 *
 * Ein Regex, der durch eine Shell geschrieben wird, verliert seine
 * Backslashes — und zwar STILL. Aus `\s*` wird `s*`, aus `\.` wird `.`, aus
 * `\d+` wird `d+`. Nichts stuerzt ab, nichts warnt, die Datei parst sauber.
 * Der Ausdruck trifft nur ab jetzt etwas anderes.
 *
 * Am 20.08.2026 ist das FUENFMAL an einem Tag passiert, zwei davon unbemerkt.
 * Am 21.08.2026 kamen zwei weitere heraus, in werkzeuge/wartet-auf-elias.mjs:
 *
 *     /.(js|html)$/    gemeint war  /\.(js|html)$/
 *     /functions*$/    gemeint war  /function\s*$/
 *
 * Das zweite ist die gefaehrliche Sorte. `/functions*$/` verlangt ein Ende auf
 * "function" plus beliebig viele "s". Geprueft wurde damit, ob vor einem
 * Funktionsnamen das Wort `function` steht — und dort steht ein LEERZEICHEN
 * dahinter. Die Pruefung sagte also immer nein. Sie haette eine Deklaration
 * als Aufrufer gezaehlt und damit einen Posten von Elias' Warteseite
 * verschwinden lassen: kein Fehler, sondern eine falsche Antwort.
 *
 * ⭐ Der Grund fuer ein Werkzeug statt eines Vorsatzes: der Vorsatz „schreib
 * Regexe nie durch die Shell" steht seit dem 20.08. im Gedaechtnis und hat den
 * 21.08. nicht verhindert. Ein Muster, das man nicht sieht, faellt niemandem
 * beim Lesen auf — es sieht ja aus wie ein Muster.
 * [[python_backslash_b_wird_backspace]] [[nutztext_nie_in_shell_strings]]
 *
 * ---------------------------------------------------------------------------
 * ⛔ WAS ES NICHT KANN
 *
 * Es liest keine JavaScript-Grammatik. Es sucht nach FORMEN, die fast immer
 * ein verlorener Backslash sind, und legt sie zum Lesen vor. Die Liste ist
 * eine KANDIDATENLISTE, keine Fehlerliste — jeder Treffer will angesehen
 * werden. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * Deshalb steht unten eine EIGENPRUEFUNG mit Faellen, deren Antwort feststeht:
 * kaputte, die gefunden werden MUESSEN, und heile, die NICHT gefunden werden
 * duerfen. Schlaegt sie fehl, meldet das Werkzeug einen Fehler, statt „alles
 * sauber" zu sagen. Ein Pruefwerkzeug, das nicht scheitern kann, ist keins.
 * [[pruefwerkzeug_mit_eingebauter_antwort]] [[stoertest_muss_wirkung_nachweisen]]
 *
 * Aufruf:
 *   node werkzeuge/pruefe-muster.mjs           prueft das Projekt
 *   node werkzeuge/pruefe-muster.mjs --eichung nur die Eigenpruefung zeigen
 *
 * Exitcode: 0 sauber · 1 Kandidaten gefunden · 3 Eigenpruefung gescheitert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NUR_EICHUNG = process.argv.includes('--eichung');

/* ---------------------------------------------------------------------------
   Die Muster. Jedes sucht eine Form, die fast nie Absicht ist.

   ⚠️ Jedes Muster braucht seinen `heil`-Gegenpol in der Eigenpruefung unten —
   sonst weiss niemand, ob es zu gierig ist. Ein Muster ohne Gegenprobe faengt
   irgendwann alles und wird dann weggeklickt. */
const MUSTER = [
  {
    name: 'Schlüsselwort + s* statt \\s*',
    /* `function`, `return`, `const` … gefolgt von `s*` oder `s+`. Das ist der
       Fall vom 21.08.2026. Ein echtes `functions` gefolgt von `*` gibt es in
       keinem sinnvollen Ausdruck. */
    suche: /\b(function|return|const|let|var|class|new|typeof|case|else|import|export)s[*+]/g,
    gemeint: 'das Schlüsselwort, dann \\s* — der Backslash fehlt'
  },
  {
    name: 'Punkt vor einer Dateiendung nicht maskiert',
    /* `/.(js|html)$/` statt `/\.(js|html)$/`. Der unmaskierte Punkt trifft
       JEDES Zeichen — `xjs` zaehlt dann als .js-Datei. */
    suche: /(?<!\\)\.\((?:[a-z0-9]{1,6}\|){1,8}[a-z0-9]{1,6}\)\$/g,
    gemeint: 'vor der Klammer gehört \\. statt .'
  },
  {
    name: 'Zeichenklasse ohne Backslash am Musteranfang',
    /* `/d+/`, `/w+/`, `/s+/` direkt hinter dem oeffnenden Schraegstrich. Als
       Buchstabe gelesen ergibt das fast nie einen sinnvollen Ausdruck. */
    suche: /(?<![\w$)\]])\/(?:\^)?[dws][*+](?:\??)[/,)\]]/g,
    gemeint: 'gemeint war \\d, \\w oder \\s'
  },
  {
    name: 'Zeichenklasse ohne Backslash MITTEN im Muster',
    /* ⭐ Der Fall vom 21.08.2026, 09:0x — und der Beweis, dass die Form
       darueber nicht reicht. Sie verlangt das `s+` DIREKT hinter dem
       oeffnenden Schraegstrich; geschrieben wurde aber

         /(?:^|s)[ء-ي]s+[ء-ي]s+$/          statt  \s

       — jedes `s` mitten im Muster. `node --check` blieb gruen, denn der
       Ausdruck ist GUELTIG, er sucht nur etwas anderes: den Buchstaben s.
       Die Pruefung lief, meldete unveraendert 222/6, und nichts warnte.
       [[pruefwerkzeug_laedt_mehr_als_die_app]] — der Fehler sass in der
       MITTE, und die Extreme decken sie nicht ab.

       Verdaechtig ist d/w/s mit * oder +, wenn davor KEIN Buchstabe steht,
       der ein echtes Wort bilden koennte — also nach ] ) | ^ oder (.
       Der Gegenpol steht seit der ersten Fassung in HEIL: /https*:/ hat ein
       p davor und bleibt deshalb unangetastet.

       Gemessen vor dem Einbau: 3 Treffer im ganzen Bestand, alle drei in
       KOMMENTAREN, die genau diesen Fehler beschreiben — der Regex-Leser
       unten sieht Kommentare nicht, die echte Trefferzahl ist 0.
       [[stichworttreffer_im_kommentar]] */
    suche: /[\]\)\|\^\(][dws][*+]/g,
    gemeint: 'auch mitten im Muster gehört \\d, \\w oder \\s'
  },
  {
    name: 'Wortgrenze als Buchstabe b',
    /* `\b` wird zum Steuerzeichen 0x08, wenn es durch eine Shell laeuft.
       Bleibt es als nacktes `b` stehen, trifft es den Buchstaben b. */
    suche: /\/b[A-Za-z][\w$]*\\b/g,
    gemeint: 'am Anfang fehlt der Backslash vor dem b'
  },
  {
    name: 'Steuerzeichen 0x08 im Quelltext',
    /* ⚠️ Als EINZIGES Muster ueber die GANZE Datei, nicht nur ueber die
       Regex-Literale: ein ausgefuehrtes \b ist auch mitten in einer
       Zeichenkette ein Fehler — und dort besonders unsichtbar. */
    ganzeDatei: true,
    /* Das ist der Fall, in dem der Backslash nicht verschwunden, sondern
       AUSGEFUEHRT worden ist. Im Editor unsichtbar. */
    suche: /[\u0008\u0007\u000b\u000c]/g,
    gemeint: 'ein \\b oder \\a wurde ausgeführt statt geschrieben'
  }
];

/* ---------------------------------------------------------------------------
   EIGENPRUEFUNG. Ohne sie waere jedes „alles sauber" wertlos: es hiesse nur,
   dass die Muster nichts gefunden haben — nicht, dass sie etwas finden KOENNEN. */
const KAPUTT = [
  ['Schlüsselwort + s* statt \\s*',              'if (!/functions*$/.test(um)) aufrufer++;'],
  ['Schlüsselwort + s* statt \\s*',              'const d = /returns+null/;'],
  ['Punkt vor einer Dateiendung nicht maskiert', 'if (!/.(js|html)$/.test(e.name)) continue;'],
  ['Punkt vor einer Dateiendung nicht maskiert', 'files.filter(n => /.(mjs|cjs|json)$/.test(n))'],
  ['Zeichenklasse ohne Backslash am Musteranfang', 'const zahl = /d+/;'],
  ['Zeichenklasse ohne Backslash am Musteranfang', 'txt.split(/s+/)'],
  ['Zeichenklasse ohne Backslash MITTEN im Muster', 'if (/(?:^|s)[a-z]s+/.test(v)) continue;'],
  ['Zeichenklasse ohne Backslash MITTEN im Muster', 'const r = /(ab)d+/;'],
  ['Wortgrenze als Buchstabe b',                 'const w = /bWort\\b/;']
];

/* ⛔ Diese hier sind HEIL und duerfen NICHT gemeldet werden. Ohne sie misst
   die Eichung nur die halbe Frage: „findet es Fehler" ohne „und laesst es
   Richtiges in Ruhe". [[stoertest_muss_wirkung_nachweisen]] */
const HEIL = [
  'if (!/function\\s*$/.test(um)) aufrufer++;',
  'if (!/\\.(js|html)$/.test(e.name)) continue;',
  'const zahl = /\\d+/;',
  'txt.split(/\\s+/)',
  'const w = /\\bWort\\b/;',
  'const url = /https*:\\/\\//;',      /* echtes s* — „http" oder „https" */
  'const p = "functions*";',           /* in einer Zeichenkette, kein Muster … */
  'const namen = ["news", "const"];',
  'let s = a / b * c;',                /* Division, kein Muster */
  'const plural = /[a-z]+\\s*/;',      /* korrekt maskiert, mitten im Muster */
  'if (/(?:ja|nein)\\s+/.test(x)) ok();',
  'const dw = obj.d + obj.w;'
];

/* ---------------------------------------------------------------------------
   REGEX-LITERALE HERAUSLOESEN

   ⛔ Der erste Entwurf suchte im ganzen Dateitext — und die Eigenpruefung hat
   ihn sofort erwischt: `const p = "functions*";` ist eine ZEICHENKETTE und
   wurde als kaputtes Muster gemeldet.

   ⭐ Der Prueffall blieb stehen. Ihn zu streichen waere die bequeme Loesung
   gewesen: die Eichung waere gruen geworden, ohne dass irgendetwas besser ist.
   Eine Pruefung, die gruener wird, ist kein Beweis, dass man recht hatte.
   [[zitierform_ist_nicht_satzkontext]]

   Also ein kleiner Leser. Er kennt keine JavaScript-Grammatik, aber genug:
   Zeichenketten, Vorlagen und Kommentare werden uebersprungen, und ein `/`
   gilt nur dann als Musteranfang, wenn davor kein Wert steht — sonst ist es
   eine Division. Damit faellt auch `let s = a / b * c;` heraus. */
function regexLiterale(text){
  const raus = [];
  let i = 0;
  let vorZeichen = '';                    /* letztes bedeutungstragendes Zeichen */
  while (i < text.length){
    const c = text[i];

    if (c === '"' || c === "'" || c === '`'){          /* Zeichenkette */
      const ende = c; i++;
      while (i < text.length && text[i] !== ende){ if (text[i] === '\\') i++; i++; }
      i++; vorZeichen = 'x'; continue;
    }
    if (c === '/' && text[i + 1] === '/'){             /* Zeilenkommentar */
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && text[i + 1] === '*'){             /* Blockkommentar */
      i = text.indexOf('*/', i + 2);
      if (i < 0) break;
      i += 2; continue;
    }
    if (c === '/'){
      /* Division oder Muster? Steht davor ein Wert (Name, Zahl, `)`, `]`),
         ist es eine Division. */
      if (/[\w$)\]]/.test(vorZeichen)){ i++; vorZeichen = '/'; continue; }
      const start = i; i++;
      let klasse = false, zu = false;
      while (i < text.length){
        const d = text[i];
        if (d === '\\'){ i += 2; continue; }
        if (d === '\n') break;                          /* kein Muster */
        if (d === '[') klasse = true;
        else if (d === ']') klasse = false;
        else if (d === '/' && !klasse){ zu = true; break; }
        i++;
      }
      if (zu){ raus.push({ text: text.slice(start, i + 1), pos: start }); i++; vorZeichen = 'x'; continue; }
      i = start + 1; vorZeichen = '/'; continue;
    }
    if (!/\s/.test(c)) vorZeichen = c;
    i++;
  }
  return raus;
}

function trefferIn(text){
  const gefunden = [];
  const literale = regexLiterale(text);
  for (const m of MUSTER){
    /* Das Steuerzeichen-Muster gilt fuer die GANZE Datei — ein ausgefuehrtes
       \b ist auch in einer Zeichenkette ein Fehler. Alle anderen nur dort, wo
       wirklich ein Muster steht. */
    const orte = m.ganzeDatei ? [{ text, pos: 0 }] : literale;
    for (const ort of orte){
      m.suche.lastIndex = 0;             /* ⛔ /g merkt sich lastIndex */
      let t;
      while ((t = m.suche.exec(ort.text)) !== null){
        gefunden.push({ muster: m.name, text: t[0], gemeint: m.gemeint, pos: ort.pos + t.index });
        if (t.index === m.suche.lastIndex) m.suche.lastIndex++;
      }
    }
  }
  return gefunden;
}

function eichung(){
  const fehler = [];
  for (const [erwartet, zeile] of KAPUTT){
    const t = trefferIn(zeile);
    if (!t.some(x => x.muster === erwartet))
      fehler.push(`NICHT gefunden (${erwartet}): ${zeile}`);
  }
  for (const zeile of HEIL){
    const t = trefferIn(zeile);
    if (t.length) fehler.push(`FALSCH gemeldet (${t[0].muster}): ${zeile}`);
  }
  return fehler;
}

/* ⛔ Alles Zwischendrin EINGERUECKT, das Urteil am Ende NICHT. Der Sammellauf
   werkzeuge/alle-pruefer.mjs zeigt je Pruefer die letzte NICHT eingerueckte
   Zeile — steht dort eine Detailzeile, liest sich der Zwischenstand wie das
   Ergebnis. Genau das war am 21.08.2026 bei zwei Pruefern der Fall. */
const eichFehler = eichung();
console.log(`  Eigenpruefung: ${KAPUTT.length} kaputte Faelle muessen gefunden, `
  + `${HEIL.length} heile duerfen NICHT gemeldet werden.`);
if (eichFehler.length){
  eichFehler.forEach(f => console.log('  ⛔ ' + f));
  console.log('');
  console.log('⛔⛔ Die Eigenpruefung ist gescheitert. Das Ergebnis unten waere wertlos —');
  console.log('   ein Werkzeug, das bekannte Faelle nicht trifft, sagt ueber unbekannte nichts.');
  process.exit(3);
}
console.log('  ✅ alle richtig einsortiert.');
if (NUR_EICHUNG) process.exit(0);

/* ---------------------------------------------------------------------------
   Der Durchlauf. ⛔ NICHT ueber data/ und transcripts/ — dort liegen 268 MB,
   und ein arabischer Text mit einem Schraegstrich waere ohnehin kein Muster. */
const AUS = new Set(['.git', '.deploy', 'node_modules', 'data', 'transcripts', 'artefakte', 'fonts', 'entwuerfe-icon']);
const dateien = [];
(function sammle(dir, rel){
  for (const e of fs.readdirSync(dir, { withFileTypes: true })){
    if (AUS.has(e.name)) continue;
    const voll = path.join(dir, e.name);
    if (e.isDirectory()){ sammle(voll, rel + e.name + '/'); continue; }
    if (!/\.(js|mjs|cjs|html)$/.test(e.name)) continue;
    /* Die grossen Datendateien im Wurzelverzeichnis bleiben draussen: sie sind
       erzeugt, enthalten keine Muster und kosten nur Zeit. */
    if (/^(quran-text|quran-frequency-data|vocab-data|surah-data|lehrbuch-saetze|quran-seiten)\.js$/.test(e.name)) continue;
    dateien.push({ voll, rel: rel + e.name });
  }
})(REPO, '');

/* ⛔ Diese Datei selbst ausnehmen — sie ENTHAELT die kaputten Formen als
   Beispiele. Ohne die Zeile meldete sie sich selbst und waere dauerhaft rot.
   [[stichworttreffer_im_kommentar]] */
const SELBST = 'werkzeuge/pruefe-muster.mjs';

let treffer = 0, betroffen = 0;
for (const d of dateien){
  if (d.rel === SELBST) continue;
  const text = fs.readFileSync(d.voll, 'utf8');
  const t = trefferIn(text);
  if (!t.length) continue;
  betroffen++;
  console.log('');
  console.log(`  ${d.rel}`);
  for (const x of t){
    treffer++;
    const zeile = text.slice(0, x.pos).split(/\r?\n/).length;
    console.log(`    Z. ${zeile}  ${JSON.stringify(x.text)}  — ${x.gemeint}`);
  }
}

console.log('');
console.log(`  ${dateien.length - 1} Datei(en) durchsucht (ohne ${SELBST}).`);
/* Ab hier NICHT mehr eingerueckt: das ist das Urteil, und der Sammellauf zeigt
   genau diese Zeile. Die Fallzahl steht darin — „sauber" ohne Nenner sagt
   nicht, ob ueberhaupt etwas geprueft wurde. [[trefferquote_ohne_preis]] */
if (!treffer){
  console.log(`✅ Kein Muster mit fehlendem Backslash — ${dateien.length - 1} Dateien, `
    + `${MUSTER.length} Formen, Eigenpruefung bestanden.`);
  process.exit(0);
}
console.log(`⛔ ${treffer} Kandidat(en) in ${betroffen} von ${dateien.length - 1} Dateien — `
  + 'jeden ansehen, das ist eine Kandidatenliste und keine Fehlerliste.');
process.exit(1);
