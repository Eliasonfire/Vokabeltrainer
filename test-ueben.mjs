// test-ueben.mjs — „Üben“ in der Leiste unten: Start · Lernen · Quran · Üben (24.11.2026, aus Talib e286fd6).
//
// Elias zur Liste der Unterschiede zwischen Talib und dem Vokabeltrainer: „startbildschirm, hören, hot bar,
// statistik und übung sollst du übernehmen“. In Talib zur Reihenfolge: „üben soll ganz rechts sein und mit
// quran tauschen“, „lass wurzeln und sätze plätze tauschen“ (23.11.2026) und „ich möchte das sätze ganz unten
// sind in all meinen apps“ (24.11.2026). Talibs Karte „Lesen“ gibt es hier nicht; eine Tour auch nicht
// (Elias: „die tour durch die app brauche ich natürlich nciht“).
//
// Geprüft wird:
//   - die Leiste hat genau diese vier Einträge in dieser Reihenfolge
//   - die Seite „Üben“ steht im Hauptbereich, mit „Zurück“ und genau den Karten Hören, Wurzeln, Sätze
//   - jede Karte führt auf eine Seite, die es gibt; jedes Bild der Seite und der Leiste gibt es
//   - in zeigeBildschirm() leuchtet bei „Üben“, Hören, Sätze und Wurzeln der Eintrag „Üben“
//   - keine Seite lässt einen Eintrag leuchten, den die Leiste nicht hat
//   - der Stilblock „Stil-Schicht · Üben“ steht im Stylesheet
// Mit Störtest: jede verdorbene Fassung muss rot werden.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const SEITE = readFileSync(join(HIER, 'index.html'), 'utf8');
const NAV = readFileSync(join(HIER, 'js', 'navigation.js'), 'utf8');

const alle = (text, muster) => [...text.matchAll(muster)].map(m => m[1]);

function laufe(seiteRoh, navRoh, still){
  let fehler = 0;
  const pruefe = (ok, text, mehr) => {
    if (!ok) fehler++;
    if (!still) console.log(ok ? '  ✔ ' + text : '  ✘ ' + text + (mehr !== undefined ? '   gemessen: ' + JSON.stringify(mehr) : ''));
  };
  const seite = seiteRoh.replace(/<!--[\s\S]*?-->/g, ' ');
  const nav = navRoh.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // 1. Die Leiste
  const leisteTreffer = seite.match(/<nav class="bottombar">([\s\S]*?)<\/nav>/);
  const leiste = leisteTreffer ? leisteTreffer[1] : '';
  const eintraege = alle(leiste, /<button class="nav-btn[^"]*" data-nav="([^"]+)"/g);
  pruefe(JSON.stringify(eintraege) === JSON.stringify(['home', 'learn-entry', 'quranfull', 'ueben']),
    'die Leiste hat genau vier Einträge: Start, Lernen, Quran, Üben', eintraege);

  // 2. Die Seite „Üben“
  const seiteTreffer = seite.match(/<section class="screen" id="screen-ueben" data-screen="ueben">([\s\S]*?)<\/section>/);
  const ueben = seiteTreffer ? seiteTreffer[1] : '';
  pruefe(!!seiteTreffer, 'die Seite „Üben“ steht in index.html');
  pruefe(!!seiteTreffer && seite.indexOf('id="screen-ueben"') < seite.indexOf('</main>'), 'sie steht im Hauptbereich (vor </main>)');
  pruefe(/<button class="icon-btn" data-back/.test(ueben), 'sie hat eine Taste „Zurück“');
  const karten = alle(ueben, /<button type="button" class="uw-karte" data-nav="([^"]+)"/g);
  pruefe(JSON.stringify(karten) === JSON.stringify(['hoeren', 'wurzeln', 'sentences']),
    'sie hat genau drei Karten in dieser Reihenfolge: Hören, Wurzeln, Sätze (Sätze ganz unten)', karten);
  const ohneSeite = karten.filter(k => !seite.includes('id="screen-' + k + '"'));
  pruefe(karten.length > 0 && ohneSeite.length === 0, 'jede Karte führt auf eine Seite, die es gibt', ohneSeite);
  const bilder = alle(ueben + leiste, /<use href="#([^"]+)"/g);
  const ohneBild = bilder.filter(b => !seite.includes('<symbol id="' + b + '"'));
  pruefe(bilder.length >= 7 && ohneBild.length === 0, 'jedes Bild der Seite und der Leiste gibt es als Zeichnung', ohneBild);
  const namen = alle(ueben, /<span class="uw-name">([^<]+)<\/span><span class="uw-sub">[^<]+<\/span>/g);
  pruefe(namen.length === karten.length && karten.length > 0, 'jede Karte hat einen Namen und einen Satz', namen);

  // 3. Die Zuordnung in zeigeBildschirm()
  const mapTreffer = nav.match(/const navMap = (\{[^}]*\});/);
  let navMap = null;
  try { navMap = mapTreffer ? new Function('return ' + mapTreffer[1])() : null; } catch (e) { navMap = null; }
  pruefe(!!navMap, 'die Zuordnung der Leiste (navMap) ist lesbar');
  if (navMap) {
    const falsch = ['ueben', 'hoeren', 'sentences', 'wurzeln'].filter(s => navMap[s] !== 'ueben');
    pruefe(falsch.length === 0, 'bei Üben, Hören, Sätze und Wurzeln leuchtet der Eintrag „Üben“', falsch);
    const fremd = Object.entries(navMap).filter(([, ziel]) => !eintraege.includes(ziel)).map(([s, z]) => s + '→' + z);
    pruefe(fremd.length === 0, 'keine Seite lässt einen Eintrag leuchten, den die Leiste nicht hat', fremd);
    pruefe(/const navName = navMap\[name\] \|\| name;/.test(nav), 'es gibt keinen Sonderweg neben der Zuordnung');
  }

  // 4. Der Stil
  pruefe(/Stil-Schicht · Üben[\s\S]*?\.uw-karte\{/.test(seiteRoh), 'der Block „Stil-Schicht · Üben“ mit .uw-karte steht im Stylesheet');
  return fehler;
}

console.log('test-ueben.mjs — die Leiste unten und die Seite „Üben“\n');
const fehler = laufe(SEITE, NAV, false);

console.log('\nStörtest:');
const KARTE_SAETZE = SEITE.match(/\n\s*<button type="button" class="uw-karte" data-nav="sentences">[\s\S]*?<\/button>/);
const KARTE_HOEREN = SEITE.match(/\n\s*<button type="button" class="uw-karte" data-nav="hoeren">[\s\S]*?<\/button>/);
const stoerungen = [
  ['alte Leiste mit Hören und Sätze', SEITE.replace('<button class="nav-btn" data-nav="ueben">', '<button class="nav-btn" data-nav="hoeren"></button><button class="nav-btn" data-nav="ueben">'), NAV],
  ['Üben nicht ganz rechts', SEITE.replace(/(<button class="nav-btn" data-nav="quranfull">[\s\S]*?<\/button>)(\s*<!--[\s\S]*?-->)?(\s*<button class="nav-btn" data-nav="ueben">[\s\S]*?<\/button>)/, '$3$1'), NAV],
  ['Seite „Üben“ fehlt', SEITE.replace('id="screen-ueben" data-screen="ueben"', 'id="screen-xueben" data-screen="xueben"'), NAV],
  ['Sätze nicht ganz unten', KARTE_SAETZE && KARTE_HOEREN ? SEITE.replace(KARTE_SAETZE[0], '').replace(KARTE_HOEREN[0], KARTE_SAETZE[0] + KARTE_HOEREN[0]) : SEITE, NAV],
  ['Karte ohne Seite', SEITE.replace('class="uw-karte" data-nav="wurzeln"', 'class="uw-karte" data-nav="wurzelbaum"'), NAV],
  ['Bild fehlt', SEITE.replace('<symbol id="ic-hantel"', '<symbol id="ic-hantel-alt"'), NAV],
  ['Zurück fehlt', SEITE.replace(/(id="screen-ueben"[\s\S]*?)<button class="icon-btn" data-back/, '$1<button class="icon-btn" data-weg'), NAV],
  ['Hören leuchtet nicht bei Üben', SEITE, NAV.replace("hoeren:'ueben'", "hoeren:'home'")],
  ['Tabelle zeigt auf alten Knopf', SEITE, NAV.replace("sentences:'ueben'", "sentences:'sentences'")],
  ['Stilblock fehlt', SEITE.replace('Stil-Schicht · Üben', 'Stil-Schicht · Uebungen'), NAV]
];
let alleRot = true;
for (const [name, s, n] of stoerungen){
  if (s === SEITE && n === NAV){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const r = laufe(s, n, true);
  if (r > 0) console.log('  ✔ ' + name + ' → ' + r + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!fehler && alleRot ? '✔ Leiste und Seite „Üben“ stimmen, jede Störung erkannt (' + stoerungen.length + ')'
  : '✘ ' + fehler + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!fehler && alleRot ? 0 : 1);
