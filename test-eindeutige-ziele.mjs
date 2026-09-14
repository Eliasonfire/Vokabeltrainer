/* test-eindeutige-ziele.mjs — bewacht, dass eine Tipp-Aufgabe ALLE richtigen
 * Stellen kennt und nicht nur eine (14.09.2026).
 *
 * ⭐ DER ANLASS IST EIN SATZ VON ELIAS. Er schickte ein Bildschirmfoto der
 * Aufgabe „Tippe den حَرْف جَرّ an." zu
 *     مَنْ مِنَ الصِّينِ؟ عَمَّارٌ مِنَ الصِّينِ.
 * und schrieb: „hier sind aber beide antworten richtig". Er hatte recht: beide
 * مِنَ sind حَرْف جَرّ, und die Aufgabe liess nur eines gelten.
 *
 * ⛔ Gemessen am selben Tag im laufenden Browser ueber alle 862 Aufgaben mit
 * Zielen: **179 waren mehrdeutig** —
 *     mubtada-khabar 107 · nat 56 · jarr-paar 13 · idafa 3 · alle-majrur 0
 * `alle-majrur` war als einziges sauber, weil es von vornherein nach ALLEN
 * fragt. Die anderen vier haben dieses Muster jetzt auch.
 *
 * Elias dazu: „sorge auch dafür das bei ähnlichen aufgaben, ähnliche fehler
 * nicht stattfinden." Genau das ist der Zweck dieser Datei. Sie prueft zwei
 * Dinge: dass `uebungSammel()` richtig rechnet, und dass keine Baufunktion an
 * ihr vorbei ein einzelnes Ziel festschreibt.
 * [[wirkung_an_der_quelle_stilllegen]] [[kandidatenliste_ist_keine_fehlerliste]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

function schneide(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}

/* ⚠️ Kommentarfrei suchen. Die Erklaerungen oben in uebung.js zitieren
   `ziele:[i]` als Beispiel — ein rohes grep zaehlte sie mit und der Test
   waere dauerhaft rot. [[stichworttreffer_im_kommentar]] */
const ohneKommentare = quelle
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

console.log('test-eindeutige-ziele.mjs — eine Aufgabe kennt alle richtigen Stellen\n');

/* ---------- 1. uebungSammel() rechnet richtig ---------- */
/* ⛔ NICHT abbrechen, wenn uebungSammel() fehlt — sonst ist die Gegenprobe
   gegen eine ältere Fassung wertlos: der Lauf stirbt vor den Prüfungen, die
   dort gerade anschlagen sollen. Ein Abbruch beweist, dass ein Name fehlt,
   nicht dass falsch gerechnet wird. [[stoertest_muss_wirkung_nachweisen]] */
const teil = schneide(quelle, 'uebungSammel');
let sammel = null;
pruefe('uebungSammel() gibt es', !!teil, 'fehlt in js/uebung.js');
if (teil){
  const c = { console };
  vm.createContext(c);
  vm.runInContext(teil + '\n;globalThis.__s = uebungSammel;', c);
  sammel = c.__s;
}

if (sammel){
  const leer = sammel([], 'einer', n => 'viele ' + n);
  pruefe('ohne Treffer entsteht keine Aufgabe', leer === null, JSON.stringify(leer));

  const eins = sammel([3], 'Tippe das X an.', n => 'Tippe alle ' + n + ' X an.');
  pruefe('ein Treffer: Frage im Singular', eins.frage === 'Tippe das X an.', eins.frage);
  pruefe('ein Treffer: bleibt beim Sofort-Antippen', eins.art === undefined, eins.art);
  pruefe('ein Treffer: genau dieses Ziel', eins.ziele.length === 1 && eins.ziele[0] === 3,
    JSON.stringify(eins.ziele));

  const drei = sammel([1, 4, 7], 'Tippe das X an.', n => 'Tippe alle ' + n + ' X an.');
  pruefe('mehrere Treffer: Frage nennt die Zahl', /\b3\b/.test(drei.frage), drei.frage);
  pruefe('mehrere Treffer: wird zur Mehrfachauswahl', drei.art === 'mehrfach', drei.art);
  pruefe('mehrere Treffer: ALLE sind Ziel',
    drei.ziele.length === 3 && drei.ziele.join(',') === '1,4,7', JSON.stringify(drei.ziele));
}

/* ---------- 2. ⭐ Die Sperre: keine Baufunktion schreibt ein einzelnes Ziel --- */
/* Der Fehler von damals sah im Quelltext so aus: `ziele:[i]` — ein einzelner
   Bezeichner in eckigen Klammern, mitten in einer forEach-Schleife. Genau das
   darf nicht wiederkommen. Erlaubt bleibt `ziele` als fertige Liste
   (alle-majrur) und alles, was durch uebungSammel() geht. */
{
  const treffer = [...ohneKommentare.matchAll(/ziele\s*:\s*\[\s*([A-Za-z_$][\w$]*)\s*(?:\+\s*\d+\s*)?\]/g)]
    .map(m => m[0]);
  pruefe('keine Aufgabe schreibt ein einzelnes Ziel fest',
    treffer.length === 0, treffer.length + ' Stelle(n): ' + treffer.join(' · '));
}

/* ---------- 3. Die vier reparierten Modi gehen über uebungSammel ---------- */
{
  for (const id of ['mubtada-khabar', 'nat', 'idafa', 'jarr-paar']){
    const anfang = ohneKommentare.indexOf("id:'" + id + "'");
    const naechste = ohneKommentare.indexOf("id:'", anfang + 5);
    const block = ohneKommentare.slice(anfang, naechste > 0 ? naechste : undefined);
    pruefe(id + ' sammelt seine Treffer', block.includes('uebungSammel('),
      'ruft uebungSammel() nicht auf');
  }
}

/* ---------- 4. Die Art der AUFGABE schlägt die des Modus ---------- */
/* ⛔ Ohne das bliebe eine Sammelaufgabe beim Sofort-Antippen: der erste Tipp
   wuerde ausgewertet, die uebrigen Stellen kaeme man nie. */
{
  const artVon = schneide(quelle, 'uebungArtVon');
  pruefe('uebungArtVon() gibt es', !!artVon, 'fehlt');
  if (artVon){
    pruefe('sie fragt zuerst die Aufgabe', /a\s*&&\s*a\.art/.test(artVon), artVon.slice(0, 80));
  }
  /* ⛔ ERSTER VERSUCH WAR EIN STILLER AUSFALL. Ich hatte nach Zeilen gesucht,
     die die Stelle UND `art` enthalten — `uebungArtVon` schreibt sich aber mit
     grossem A, die Suche fand nichts, `continue` sprang weiter, und der Test
     meldete grün, ohne etwas geprüft zu haben.
     [[leere_liste_ist_keine_messung]]

     Jetzt andersherum und ohne Schlupfloch: `m.art` darf im ganzen
     Auswertungsteil nur noch EINMAL vorkommen — in der Modusliste, wo es die
     Gruppen bildet. Jedes weitere Vorkommen heisst, dass wieder der Modus
     entscheidet statt der Aufgabe. */
  /* ⚠️ `uebungArtVon()` selbst liest `m.art` — das ist ihr Zweck und zählt
     nicht mit. Ohne diesen Ausschnitt wäre der Test dauerhaft rot, und zwar
     zu Recht misstrauisch, aber am falschen Ort. */
  const ohneArtVon = ohneKommentare.replace(schneide(ohneKommentare, 'uebungArtVon') || '', ' ');
  const mArt = [...ohneArtVon.matchAll(/\bm\.art\b/g)];
  pruefe('m.art entscheidet nur noch in der Modusliste (genau 1×)',
    mArt.length === 1, mArt.length + '×');
  const gruppen = ohneArtVon.split('\n').find(l => /\bm\.art\b/.test(l));
  pruefe('und zwar dort, wo die Gruppen gebildet werden',
    !!gruppen && gruppen.includes('UEBUNGEN.filter'), (gruppen || '—').trim().slice(0, 80));
  for (const name of ['uebungArtVon(a)']){
    const n = (ohneKommentare.match(new RegExp(name.replace(/[()]/g, '\\$&'), 'g')) || []).length;
    pruefe(name + ' entscheidet an mindestens 3 Stellen', n >= 3, n + '×');
  }
}

console.log('\n' + (schlecht ? '✘ ' : '✔ ') + ok + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
