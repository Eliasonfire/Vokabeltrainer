/* pruefe-suchorte.mjs — welche Suche findet was?
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-suchorte.mjs
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFER BEWACHT — Elias am 11.09.2026, 22:39:
 *
 *   „ich möchte das wenn ich bei den kategorien suche es wirklich nur die wörter
 *    finden soll und nicht die regeln und wenn ich bei den regeln bin dann soll
 *    es auch wirklich nur nach regeln suchen. im startbildschirm kann es nach
 *    beidem suchen aber die wörter sollen immer über den regeln angezeigt
 *    werden"
 *
 *   Kategorien  nur Wörter               zeichneSuche()       js/kategorien.js
 *   Regeln      nur Regeln               renderRegeln()       js/regeln.js
 *   Start       Wörter, darunter Regeln  zeichneAlleSuche()   js/kategorien.js,
 *                                                             Bildschirm #screen-suche
 *
 * Vorher (Goal Regelsammlung, Punkt 10, am selben Tag gebaut) standen die
 * Regeln in den Kategorien ÜBER den Wörtern, und das Startfeld reichte in die
 * Kategorien durch. Genau dorthin fiele eine „Vereinfachung" zurück.
 *
 * ⭐ Gefahren wird der ECHTE Quelltext: der Block „Welche Suche findet was" aus
 * js/kategorien.js und renderRegeln() aus js/regeln.js laufen gegen einen
 * Schein-DOM. Die Suchen selbst (sucheTreffer, regelSuche) sind Attrappen mit
 * je zwei festen Treffern — WAS sie finden, bewachen pruefe-suche.js und
 * pruefe-regelsammlung.mjs; hier geht es nur darum, WO es erscheint.
 * ⚠️ Beide Attrappen liefern immer etwas: ein Begriff, der nur Wörter trifft,
 * bewiese für „nur Wörter" nichts. [[leere_liste_ist_keine_messung]]
 *
 * Störtests — jeder MUSS rot werden, sonst ist die grüne Zeile wertlos:
 *   1. die Kategorien bekommen die Regeln zurück
 *   2. auf der Suche vom Start stehen die Regeln oben
 *   3. auf der Suche vom Start fallen die Regeln weg
 *   4. das Startfeld reicht wieder in die Kategorien durch
 *   5. „Regeln" zeichnet ein Wort mit
 *   6. der Bildschirm „Suche" wird beim Öffnen nicht gezeichnet
 *
 * Exit 0 = hält · 1 = Befund oder wirkungsloser Störtest
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');

const ANFANG = '/* ---------- Welche Suche findet was';
const ENDE = '/* ---------- Ende: Welche Suche findet was';

let fehler = 0;
const ok = t => console.log('  ok   ' + t);
const rot = t => { fehler++; console.log('  ROT  ' + t); };

/* Eine Funktion samt Rumpf. Die Klammern werden in der Maske ohne Kommentare
   und Texte gezählt — eine Klammer in einem Kommentar oder Template zählte
   sonst mit. */
function schneideFunktion(quelle, name){
  const maske = ohneKommentareUndTexte(quelle);
  const kopf = maske.indexOf('function ' + name + '(');
  if (kopf < 0) return null;
  let tiefe = 0;
  for (let i = maske.indexOf('{', kopf); i >= 0 && i < maske.length; i++){
    if (maske[i] === '{') tiefe++;
    else if (maske[i] === '}' && --tiefe === 0) return quelle.slice(kopf, i + 1);
  }
  return null;
}

/* Gerade so viel DOM, wie die Zeichenfunktionen anfassen. Jede Id entsteht beim
   ersten Zugriff — ob es sie in index.html gibt, prüft befunde() getrennt. */
function scheinDom(){
  const el = {};
  const dom = { fokus: null };
  dom.hol = id => {
    if (!el[id]){
      const e = { id, value: '', innerHTML: '', textContent: '', verborgen: false, hoerer: {} };
      e.addEventListener = (typ, f) => { (e.hoerer[typ] = e.hoerer[typ] || []).push(f); };
      e.focus = () => { dom.fokus = id; };
      e.classList = {
        toggle: (k, an) => { if (k === 'hidden') e.verborgen = !!an; },
        add: k => { if (k === 'hidden') e.verborgen = true; },
        remove: k => { if (k === 'hidden') e.verborgen = false; },
        contains: k => k === 'hidden' && e.verborgen
      };
      el[id] = e;
    }
    return el[id];
  };
  dom.document = { getElementById: dom.hol, querySelectorAll: () => [] };
  return dom;
}

/* Die Befunde für einen Stand der Quelltexte — leer heißt: hält. */
function befunde(q){
  const f = [];
  const a = q.kat.indexOf(ANFANG), b = q.kat.indexOf(ENDE);
  if (a < 0 || b < a) return ['js/kategorien.js: der Block „Welche Suche findet was" ist nicht zu finden — so prüft der Prüfer nichts'];
  const block = q.kat.slice(a, b);
  const renderRegeln = schneideFunktion(q.regeln, 'renderRegeln');
  if (!renderRegeln) return ['js/regeln.js: renderRegeln() nicht gefunden'];

  const dom = scheinDom();
  const zaehl = { sucheTreffer: 0, regelSuche: 0, bildschirm: [], wortkarte: null };
  const ctx = {
    console, document: dom.document,
    escapeHtml: s => String(s), icon: () => '', quranHaeufigkeit: () => null,
    istBekannt: () => true, kapitelBeschriftung: () => 'Kap. 1',
    sucheTreffer: () => { zaehl.sucheTreffer++; return [{ id: 'w1', ar: 'ب', de: 'Haus' }, { id: 'w2', ar: 'ت', de: 'Häuser' }]; },
    regelSuche: () => { zaehl.regelSuche++; return [{ id: 'r1' }, { id: 'r2' }]; },
    /* Dasselbe Kennzeichen wie die echte Zeile — regelZeileHtml() setzt
       data-regelkarte; dass es dabei bleibt, prüft Teil 5. */
    regelSuchZeilenHtml: liste => liste.map(r => '<div class="regel-zeile-rahmen"><button data-regelkarte="' + r.id + '"></button></div>').join(''),
    showScreen: name => { zaehl.bildschirm.push(name); },
    zeigeWortKarte: id => { zaehl.wortkarte = id; }
  };
  vm.createContext(ctx);
  try {
    vm.runInContext(block, ctx);
    vm.runInContext(renderRegeln, ctx);
  } catch (e){ return ['der Quelltext läuft im Schein-DOM nicht: ' + e.message]; }
  if (['zeichneSuche', 'zeichneAlleSuche', 'renderRegeln'].some(n => typeof ctx[n] !== 'function'))
    return ['zeichneSuche, zeichneAlleSuche oder renderRegeln fehlt nach dem Laden'];

  /* 1. Kategorien — „wirklich nur die wörter" */
  dom.hol('sucheEingabe').value = 'Haus';
  ctx.zeichneSuche();
  const kat = dom.hol('sucheTreffer').innerHTML;
  if (!kat.includes('data-suchwort')) f.push('die Kategorien zeigen keine Wörter');
  if (kat.includes('data-regelkarte') || zaehl.regelSuche) f.push('die Kategorien suchen oder zeigen Regeln — „wirklich nur die wörter finden soll und nicht die regeln"');

  /* 2. Regeln — „wirklich nur nach regeln" */
  const woerterVorher = zaehl.sucheTreffer;
  dom.hol('regelnSuche').value = 'Haus';
  ctx.renderRegeln();
  const reg = dom.hol('regelnInhalt').innerHTML;
  if (!reg.includes('data-regelkarte')) f.push('„Regeln" zeigt keine Regeln');
  if (reg.includes('data-suchwort') || zaehl.sucheTreffer !== woerterVorher) f.push('„Regeln" sucht oder zeigt Wörter — „auch wirklich nur nach regeln suchen"');

  /* 3. Das Startfeld führt auf den Bildschirm „Suche" */
  const start = dom.hol('startSuche');
  start.value = 'Ha';
  (start.hoerer.focus || []).forEach(h => h());
  const ziel = zaehl.bildschirm[zaehl.bildschirm.length - 1];
  if (ziel !== 'suche') f.push('das Startfeld führt nach „' + ziel + '" statt auf den Bildschirm „suche"');
  if (dom.hol('alleSuche').value !== 'Ha' || dom.fokus !== 'alleSuche') f.push('der Begriff vom Start kommt nicht im Feld der Suche an');

  /* 4. Die Suche vom Start — beides, die Wörter oben */
  dom.hol('alleSuche').value = 'Haus';
  const regelnVorher = zaehl.regelSuche;
  ctx.zeichneAlleSuche();
  const alle = dom.hol('alleSucheTreffer').innerHTML;
  const letztesWort = alle.lastIndexOf('data-suchwort'), ersteRegel = alle.indexOf('data-regelkarte');
  if (letztesWort < 0) f.push('die Suche vom Start zeigt keine Wörter');
  if (ersteRegel < 0 || zaehl.regelSuche === regelnVorher) f.push('die Suche vom Start zeigt keine Regeln — „im startbildschirm kann es nach beidem suchen"');
  if (letztesWort >= 0 && ersteRegel >= 0 && ersteRegel < letztesWort) f.push('auf der Suche vom Start steht eine Regel über einem Wort — „die wörter sollen immer über den regeln angezeigt werden"');
  (dom.hol('alleSucheTreffer').hoerer.click || []).forEach(h => h({ target: { closest: s => (s === '[data-suchwort]' ? { dataset: { suchwort: 'w1' } } : null) } }));
  if (zaehl.wortkarte !== 'w1') f.push('ein Tipp auf ein Wort der Suche öffnet die Wortkarte nicht');

  /* 5. Die Verdrahtung außerhalb des Blocks */
  const nav = ohneKommentareUndTexte(q.nav, { texte: false });
  if (!/name\s*===\s*'suche'[^\n]*zeichneAlleSuche\(\)/.test(nav)) f.push('js/navigation.js zeichnet den Bildschirm „suche" beim Öffnen nicht');
  if (!/\bsuche\s*:\s*'home'/.test(nav)) f.push('js/navigation.js: „suche" fehlt in navMap — unten leuchtete kein Reiter');
  if (!q.html.includes('<section class="screen" id="screen-suche"')) f.push('index.html: der Bildschirm #screen-suche fehlt');
  const ids = new Set([...block.matchAll(/getElementById\('([^']+)'\)/g), ...block.matchAll(/(?:feld|treffer|hinweis|leeren): '([^']+)'/g)].map(m => m[1]));
  const fehlen = [...ids].filter(id => !q.html.includes('id="' + id + '"'));
  if (fehlen.length) f.push('index.html kennt diese Ids nicht: ' + fehlen.join(', '));
  if (!/data-regelkarte="\$\{escapeHtml\(id\)\}"/.test(q.regeln)) f.push('js/regeln.js: regelZeileHtml() setzt data-regelkarte nicht mehr — die Attrappe oben prüft dann das Falsche');
  if (/closest\('#screen-suche'\)/.test(q.regeln)) f.push('js/regeln.js: der Regelkarten-Handler nimmt die Suche aus — ein Tipp auf eine Regel täte dort nichts');
  return f;
}

const ECHT = { kat: lies('js/kategorien.js'), regeln: lies('js/regeln.js'), nav: lies('js/navigation.js'), html: lies('index.html') };

console.log('\n=== Wo welche Suche was zeigt (Elias, 11.09.2026, 22:39) ===');
const echt = befunde(ECHT);
if (echt.length) echt.forEach(rot);
else ok('Kategorien nur Wörter · „Regeln" nur Regeln · Start beides, die Wörter oben · das Startfeld führt auf „Suche"');

console.log('\n=== Störtests — jeder muss rot werden ===');
const STOER = [
  ['die Kategorien bekommen die Regeln zurück', 'kat', 'mitRegeln: false', 'mitRegeln: true'],
  ['auf der Suche vom Start stehen die Regeln oben', 'kat', 'treffer.innerHTML = wortBlock + regelBlock;', 'treffer.innerHTML = regelBlock + wortBlock;'],
  ['auf der Suche vom Start fallen die Regeln weg', 'kat', 'mitRegeln: true', 'mitRegeln: false'],
  ['das Startfeld reicht wieder in die Kategorien durch', 'kat', "showScreen('suche')", "showScreen('categories')"],
  ['„Regeln" zeichnet ein Wort mit', 'regeln', '+ regelSuchZeilenHtml(treffer);', `+ regelSuchZeilenHtml(treffer) + '<div data-suchwort="x"></div>';`],
  ['der Bildschirm „Suche" wird beim Öffnen nicht gezeichnet', 'nav', "if (name==='suche'", "if (name==='suche-aus'"],
];
for (const [name, datei, alt, neu] of STOER){
  const n = ECHT[datei].split(alt).length - 1;
  if (n !== 1){ rot('Störtest „' + name + '": die Stelle steht ' + n + '× im Quelltext statt einmal — er greift nicht'); continue; }
  const b = befunde({ ...ECHT, [datei]: ECHT[datei].replace(alt, () => neu) });
  if (b.length) ok('Störtest „' + name + '" → rot: ' + b[0]);
  else rot('Störtest „' + name + '" blieb grün — diesen Rückfall sähe der Prüfer nicht');
}

console.log('');
if (fehler){ console.log('⛔ ' + fehler + ' Befund(e).'); process.exit(1); }
console.log('✅ Jede Suche zeigt, was Elias dort will: Kategorien Wörter, „Regeln" Regeln, der Start beides — die Wörter oben.');
