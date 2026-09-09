/* pruefe-js-quelltext.mjs — die Eichung fuer `js-quelltext.mjs`.

   ⛔ Ein Werkzeug, das Fundstellen zaehlt, ist erst eine Messung, wenn es
   an Faellen geeicht ist, deren Antwort unabhaengig feststeht. Zweiseitig:
   es muss einen bekannten Treffer FINDEN **und** bei einem bekannten
   Nicht-Treffer SCHWEIGEN. Ein Stripper, der alles leert, besteht sonst
   jede Nicht-Treffer-Probe. [[gruener_pruefer_beweist_nur_geprueftes]]

   ⚠️ Zwei Stoertests am Ende weisen nach, dass diese Pruefung ueberhaupt
   rot werden kann. [[stoertest_muss_wirkung_nachweisen]] */

import { ohneKommentareUndTexte, zeileVon } from './js-quelltext.mjs';

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ROT  ' + name + '\n       ist:  ' + JSON.stringify(ist) + '\n       soll: ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + name);
  return ok;
};

/* Sucht leere catch-Bloecke — genau die Suche, um die es geht. */
const LEER = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
function leereCatch(quelle) {
  const rein = ohneKommentareUndTexte(quelle);
  const treffer = [];
  let m;
  LEER.lastIndex = 0;                       /* [[regexp_g_merkt_sich_lastindex]] */
  while ((m = LEER.exec(rein))) treffer.push(zeileVon(quelle, m.index));
  return treffer;
}

console.log('Eichung: js-quelltext.mjs');

/* ---- Seite 1: bekannte TREFFER muessen gefunden werden ---- */
pruefe('echtes leeres catch (e)', leereCatch('try { a(); } catch (e){ }'), [1]);
pruefe('echtes leeres catch ohne Bindung', leereCatch('try { a(); } catch { }'), [1]);
pruefe('zwei in zwei Zeilen', leereCatch('try{a()}catch(e){}\ntry{b()}catch(_){}'), [1, 2]);

/* ---- Seite 2: bekannte NICHT-Treffer muessen schweigen ---- */
pruefe('im Blockkommentar (der echte Fall aus js/feier.js)',
  leereCatch('/* das leere `catch {}` hat den Fall unauffindbar gemacht. */\nfunction f(){}'), []);
pruefe('im Zeilenkommentar', leereCatch('// hier stand mal catch (e){ }\nlet a = 1;'), []);
pruefe('in einer Zeichenkette', leereCatch('const s = "catch (e){ }";'), []);
pruefe('catch mit Inhalt zaehlt nicht', leereCatch('try{a()}catch(e){ melde(e); }'), []);

/* ---- Seite 3: der Stripper darf nicht zu viel wegnehmen ---- */
const mitRegex = 'const r = /\\/\\//g;\ntry { a(); } catch (e){ }';
pruefe('Regex mit // frisst die naechste Zeile nicht', leereCatch(mitRegex), [2]);
pruefe('Division bleibt Division', leereCatch('const q = a / b; try{c()}catch(e){}'), [1]);
const mitApostroph = "const s = 'it\\'s';\ntry { a(); } catch (e){ }";
pruefe('maskiertes Anfuehrungszeichen beendet die Kette nicht', leereCatch(mitApostroph), [2]);

/* ---- Seite 4: VERSCHACHTELTE Template-Literale (09.09.2026) ----
   ⛔ Der Fehler, der vier Pruefer still zu wenig messen liess. Die alte
   Fassung suchte den naechsten Backtick — und der gehoerte zur INNEREN
   Zeichenkette. Ab da war alles vertauscht. */
const verschachtelt = 'const h = `<a>${ liste.map(x => `<b>${x}</b>`).join("") }</a>`;\ntry { a(); } catch (e){ }';
pruefe('verschachteltes Template: das catch danach wird gefunden', leereCatch(verschachtelt), [2]);
pruefe('verschachteltes Template: der Kommentar danach verschwindet',
  ohneKommentareUndTexte(verschachtelt + '\n/* weg */ const z = 1;').includes('weg'), false);
const mitKommentarDanach = 'const h = `${ f(`x`) }`;\n/* dieser Kommentar muss weg */\nconst a = 1;';
pruefe('nach zwei Ebenen ist der Faden noch da',
  /Kommentar/.test(ohneKommentareUndTexte(mitKommentarDanach)), false);
pruefe('der Code nach dem Template bleibt stehen',
  /const a = 1;/.test(ohneKommentareUndTexte(mitKommentarDanach)), true);

/* Zeilennummern muessen erhalten bleiben — sonst ist ein Befund nicht auffindbar. */
const lang = 'a\nb\nc\n/* weg */\ntry{a()}catch(e){}';
pruefe('Zeilennummern verschieben sich nicht', leereCatch(lang), [5]);
pruefe('Laenge bleibt gleich', ohneKommentareUndTexte(lang).length, lang.length);

/* ---- Stoertests: kann diese Pruefung ueberhaupt rot werden? ---- */
console.log('\nStoertests (beide MUESSEN rot melden):');
let stoerOk = 0;
if (leereCatch('/* catch (e){ } */').length !== 0) console.log('  ROT  Stoertest 1 haette schweigen muessen');
else stoerOk++;
/* Stoertest: ein Stripper, der nichts tut, findet den Kommentartreffer */
const roh = '/* catch (e){ } */';
LEER.lastIndex = 0;
if (LEER.test(roh)) { console.log('  ok   Stoertest: OHNE Stripper wird der Kommentar gefunden — die Probe hat Kraft'); stoerOk++; }
else { console.log('  ROT  Stoertest wirkungslos: auch ohne Stripper kein Treffer'); fehler++; }
/* Stoertest: ein Stripper, der ALLES leert, wuerde den echten Treffer verlieren */
LEER.lastIndex = 0;
if (!LEER.test('                         ')) { console.log('  ok   Stoertest: ein Alles-Leerer verliert den echten Treffer — Seite 1 hat Kraft'); stoerOk++; }
else { console.log('  ROT  Stoertest wirkungslos'); fehler++; }

console.log('\n' + (fehler ? '⛔ ' + fehler + ' Fehler' : '✅ alle Faelle richtig, ' + stoerOk + ' Stoertests wirksam'));
process.exit(fehler ? 1 : 0);
