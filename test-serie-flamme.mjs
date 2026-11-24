// Die Flamme oben in der Leiste: bei Serie 0 keine „0“, nur die graue Flamme.
//
// Elias, 23.11.2026, zu den sechs Vorschlägen der Recherche: „ich nehme alle deine vorschläge“ (Vorschlag 4).
// Aus Talib übernommen am 24.11.2026; Elias zur Liste der Unterschiede: „übernimm das in allen apps“.
// Geprüft wird:
//   - zeigeSerie() in js/kern.js setzt Zahl und Aussehen (am echten Code gerechnet: 0, 1, 7, kaputte Werte)
//   - es gibt nur diese EINE Stelle, die die Zahl schreibt; touchStreak() und die Startseite rufen sie
//   - die Seite zeigt beim Laden keine „0“ (leeres Feld, Klasse „leer“), das Feld der Flamme bleibt (Ziel der Tour)
//   - der Stil blendet die Zahl bei „leer“ aus
// Aufruf: node test-serie-flamme.mjs               (prüft index.html, js/kern.js, js/start.js)
//         node test-serie-flamme.mjs <Datei> ...   (andere Fassungen für die Störprobe; zugeordnet nach dem Namen:
//                                                   *.html, *start*.js, sonst = js/kern.js)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const pfade = { seite: join(HIER, 'index.html'), kern: join(HIER, 'js', 'kern.js'), start: join(HIER, 'js', 'start.js') };
for (const arg of process.argv.slice(2)) {
  const n = basename(arg).toLowerCase();
  if (n.endsWith('.html')) pfade.seite = arg; else if (n.includes('start')) pfade.start = arg; else pfade.kern = arg;
}
const seite = readFileSync(pfade.seite, 'utf8'), kern = readFileSync(pfade.kern, 'utf8'), start = readFileSync(pfade.start, 'utf8');

let fehler = 0;
const pruefe = (ok, text, mehr) => {
  if (ok) console.log('  ok  ' + text);
  else { console.log('  FEHLER  ' + text + (mehr !== undefined ? '  → ' + JSON.stringify(mehr) : '')); fehler++; }
};

// 1. Die Rechnung
const fn = kern.match(/function zeigeSerie\(anzahl\)\{[\s\S]*?\n\}/);
pruefe(!!fn, 'zeigeSerie() steht in js/kern.js');
if (fn) {
  const lauf = wert => {
    const zahl = { textContent: 'alt' };
    const klassen = new Set(['streak']);
    const badge = { classList: { toggle(k, an) { if (an) klassen.add(k); else klassen.delete(k); } } };
    new Function('document', fn[0] + '\nzeigeSerie(' + JSON.stringify(wert) + ');')(
      { getElementById: id => id === 'streakCount' ? zahl : id === 'streakBadge' ? badge : null });
    return zahl.textContent + '|' + (klassen.has('leer') ? 'leer' : 'an');
  };
  pruefe(lauf(0) === '|leer', 'Serie 0: keine Zahl, Flamme grau', lauf(0));
  pruefe(lauf(1) === '1|an', 'Serie 1: „1“, Flamme an', lauf(1));
  pruefe(lauf(7) === '7|an', 'Serie 7: „7“, Flamme an', lauf(7));
  pruefe(lauf(null) === '|leer' && lauf('x') === '|leer' && lauf(-3) === '|leer', 'kein Wert, Unsinn, negative Zahl: wie 0', [lauf(null), lauf('x'), lauf(-3)]);
  const ohne = () => { new Function('document', fn[0] + '\nzeigeSerie(3);')({ getElementById: () => null }); return true; };
  let hielt = false; try { hielt = ohne(); } catch (e) { hielt = false; }
  pruefe(hielt, 'fehlen die Felder in der Seite, wirft die Funktion keinen Fehler');
}

// 2. Nur eine Stelle schreibt die Zahl
const dateien = pfade.kern === join(HIER, 'js', 'kern.js')
  ? readdirSync(join(HIER, 'js')).filter(n => n.endsWith('.js')).map(n => [n, n === 'start.js' ? start : readFileSync(join(HIER, 'js', n), 'utf8')])
  : [['kern.js', kern], ['start.js', start]];
const schreiber = [];
for (const [name, text] of dateien) {
  const ohneFn = name === 'kern.js' && fn ? text.replace(fn[0], '') : text;
  if (/getElementById\('streakCount'\)/.test(ohneFn)) schreiber.push(name);
}
pruefe(schreiber.length === 0, 'außer zeigeSerie() fasst kein Programmteil das Feld der Zahl an', schreiber);
const touch = kern.match(/function touchStreak\(\)\{[\s\S]*?\n\}/);
pruefe(!!touch && /zeigeSerie\(s\.count\)/.test(touch[0]), 'touchStreak() zeigt die neue Serie über zeigeSerie()');
pruefe(/zeigeSerie\(getStreak\(\)\.count\)/.test(start), 'die Startseite zeigt die Serie über zeigeSerie()');

// 3. Die Seite
const kopf = seite.match(/<div class="([^"]*)" id="streakBadge"[^>]*>([\s\S]*?)<\/div>/);
pruefe(!!kopf, 'das Feld der Flamme (#streakBadge, Ziel der Tour) steht in der Seite');
if (kopf) {
  pruefe(kopf[1].split(/\s+/).includes('leer'), 'beim Laden gilt „leer“ (keine Zahl, bis das Programm sie setzt)', kopf[1]);
  pruefe(/<span id="streakCount"><\/span>/.test(kopf[2]), 'das Feld der Zahl ist beim Laden leer, nicht „0“', kopf[2].trim());
  pruefe(/class="streak-flame"/.test(kopf[2]), 'die Flamme steht im Feld');
}

// 4. Der Stil
const style = [...seite.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
pruefe(/\.streak\.leer #streakCount\{[^}]*display:none/.test(style), 'bei „leer“ ist die Zahl ausgeblendet');
pruefe(/\.streak\.leer \.streak-flame\{[^}]*grayscale/.test(style), 'bei „leer“ ist die Flamme grau');

console.log(fehler ? '\n' + fehler + ' FEHLER' : '\nalles in Ordnung');
process.exit(fehler ? 1 : 0);
