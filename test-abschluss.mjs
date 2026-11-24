// test-abschluss.mjs — die Seite „Runde geschafft“ nach jeder Lernrunde (24.11.2026, aus Talib d26eeba).
//
// In Talib Vorschlag 3 der Recherche; Elias dort: „ich nehme alle deine vorschläge“. Für den Vokabeltrainer
// sein Auftrag zur Liste der Unterschiede: „startbildschirm, hören, hot bar, statistik und übung sollst du
// übernehmen“. Talibs Prüfer, angepasst: keine Mini-Runde des Starts; die letzte Taste ist „Zur Startseite“
// (Talibs „Weiter lernen“ hängt an weiterRunde(), das es hier nicht gibt).
//
// Geprüft wird:
//   - die Seite steht in index.html mit ihren Feldern und Tasten; js/abschluss.js wird geladen und liegt im Vorrat
//   - das Ende der Runde hält das Ergebnis fest und führt auf die Seite, ohne Eintrag im Verlauf für die Runde
//   - „gewusst“ zählt nur gezählte Karten, vor dem Sichern, und übersteht Schließen und Fortsetzen
//   - ohne Ergebnis gibt es die Seite nicht (Zurück-Taste, neu geladen)
//   - die Rechnungen stimmen (am echten Code): Zahlen der Runde, Ziel der großen Taste
//   - die Seite schreibt nichts; beim Verlassen wird das Ergebnis verworfen und der Verlauf umgeschrieben
//   - die Ring-Rechnung der Startseite ist dieselbe (ringKarten(), ringExtra() in js/start.js)
// Mit Störtest: jede verdorbene Fassung muss rot werden.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const lies = p => readFileSync(join(HIER, p), 'utf8');
const ECHT = { seite: lies('index.html'), nav: lies('js/navigation.js'), lernen: lies('js/lernen.js'),
  ab: lies('js/abschluss.js'), sw: lies('sw.js'), start: lies('js/start.js') };
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function laufe(t, still){
  const { seite, nav, lernen, ab, sw, start } = t;
  let fehler = 0;
  const pruefe = (ok, text, mehr) => {
    if (!ok) fehler++;
    if (!still) console.log(ok ? '  ✔ ' + text : '  ✘ ' + text + (mehr !== undefined ? '   gemessen: ' + JSON.stringify(mehr) : ''));
  };

  // 1. Die Seite
  const st = seite.match(/<section class="screen" id="screen-fertig" data-screen="fertig">([\s\S]*?)<\/section>/);
  const s = st ? st[1] : '';
  pruefe(!!st, 'die Seite #screen-fertig steht in index.html');
  pruefe(!!st && seite.indexOf('id="screen-fertig"') < seite.indexOf('</main>'), 'sie steht im Hauptbereich (vor </main>)');
  pruefe(/<h2[^>]*>Runde geschafft<\/h2>/.test(s), 'sie heißt „Runde geschafft“');
  const fehlend = ['rfSatz', 'rfKarten', 'rfGewusst', 'rfNeu', 'rfSerieZeile', 'rfSerie', 'rfWeiter', 'rfHeim'].filter(id => !s.includes('id="' + id + '"'));
  pruefe(fehlend.length === 0, 'alle Felder und Tasten sind da', fehlend);
  pruefe(/<button[^>]*class="[^"]*btn-primary[^"]*"[^>]*id="rfWeiter"/.test(s), 'die große Taste ist die Haupttaste');
  pruefe(!/data-nav=/.test(s), 'die Tasten gehen über das Programm der Seite, nicht über data-nav (sonst bliebe die Seite im Verlauf)');
  pruefe(/<symbol id="ic-flame"/.test(seite), 'das Zeichen der Serie (ic-flame) gibt es');
  pruefe(/Stil-Schicht · Runde geschafft[\s\S]*?\.es-kachel\{[\s\S]*?\.rf-ring\{/.test(seite), 'der Block „Stil-Schicht · Runde geschafft“ steht im Stylesheet');
  const iLernen = seite.indexOf('<script src="js/lernen.js"></script>');
  const iAb = seite.indexOf('<script src="js/abschluss.js"></script>');
  pruefe(iAb > iLernen && iLernen > 0, 'js/abschluss.js wird nach js/lernen.js geladen');
  pruefe(sw.includes("'./js/abschluss.js'"), 'js/abschluss.js liegt im Vorrat für ohne Netz (sw.js)');

  // 2. Das Ende der Runde in js/lernen.js
  const iFertig = lernen.indexOf("rundenLeiste('learnProgressFill', 'learnCount', rundeGezaehlt(), rundeGezaehlt());");
  const ende = iFertig > 0 ? lernen.slice(iFertig, iFertig + 4500) : '';
  pruefe(!!ende, 'das Ende der Runde ist gefunden');
  const iMerken = ende.indexOf('rundeAbschlussMerken()');
  const iZeigen = ende.indexOf("showScreen(mitSeite ? 'fertig' : 'home', { ersetzen: true })");
  pruefe(iMerken > 0 && iZeigen > iMerken, 'erst das Ergebnis festhalten, dann die Seite zeigen — mit „ersetzen“ (kein Eintrag für die beendete Runde)');
  pruefe(/const mitSeite = typeof rundeAbschlussMerken === 'function' && rundeAbschlussMerken\(\);/.test(ende),
    'fehlt js/abschluss.js, endet die Runde wie früher auf der Startseite');
  pruefe(/feier-banner\.feier-gross/.test(ende), 'steht das große Banner, wartet die Seite, bis es weg ist');
  const iZaehlen = lernen.indexOf('if (s.richtig && !rundenRolle(SESSION.idx)) SESSION.gewusst = (Number(SESSION.gewusst) || 0) + 1;');
  const iSichern = iZaehlen > 0 ? lernen.indexOf('rundeSichern(SESSION.idx + 1);', iZaehlen) : -1;
  pruefe(iZaehlen > 0 && iSichern > iZaehlen && iSichern - iZaehlen < 400, '„gewusst“ zählt nur gezählte Karten und wird vor dem Sichern gezählt');
  pruefe((lernen.match(/SESSION\.gewusst\s*=/g) || []).length === 1, '„gewusst“ wird an genau einer Stelle hochgezählt');
  pruefe(/gewusst: Number\(SESSION\.gewusst\) \|\| 0,\s*\n\s*zeit: Date\.now\(\)/.test(lernen), 'die gesicherte Runde merkt sich „gewusst“');
  pruefe(/SESSION = \{ words, idx, dirs: \[\], fertig: false, laut, ziel, rollen, gewusst: Number\(g\.gewusst\) \|\| 0 \};/.test(lernen),
    'eine fortgesetzte Runde bekommt „gewusst“ zurück');
  pruefe(/rollen: neueRollen,\s*\n\s*gewusst: Number\(SESSION\.gewusst\) \|\| 0,/.test(lernen), 'eine umgebaute Runde behält „gewusst“');

  // 3. Der Seitenwechsel
  pruefe(/if \(name === 'fertig' && !\(typeof RUNDE_ERGEBNIS !== 'undefined' && RUNDE_ERGEBNIS\)\) name = 'home';/.test(nav),
    'ohne Ergebnis führt „fertig“ zur Startseite');
  pruefe(/navMap = \{[^}]*\bfertig:'learn-entry'/.test(nav), 'auf der Seite leuchtet „Lernen“ in der Leiste');
  pruefe(/if \(name==='fertig' && typeof renderRundeFertig === 'function'\) renderRundeFertig\(\);/.test(nav), 'beim Zeigen wird die Seite gefüllt');
  const iSperre = nav.indexOf("name === 'fertig' && !(");
  pruefe(iSperre > 0 && iSperre < nav.indexOf("document.getElementById('screen-'+name)"), 'die Sperre steht vor dem Umschalten der Seite');

  // 4. Die Rechnungen, am echten Code
  const fn = (text, name) => { const m = text.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}')); return m ? m[0] : ''; };
  const rErg = fn(ab, 'rundeErgebnis'), rNae = fn(ab, 'rundeNaechstes'), rVerl = fn(ab, 'rundeFertigVerlassen'),
        rRender = fn(ab, 'renderRundeFertig'), rMerken = fn(ab, 'rundeAbschlussMerken');
  pruefe(!!(rErg && rNae && rVerl && rRender && rMerken), 'die fünf Funktionen stehen in js/abschluss.js');
  if (rErg) {
    let f = null; try { f = new Function(rErg + '\nreturn rundeErgebnis;')(); } catch (e) { f = null; }
    const worte = [{ id: 'a' }, { id: 'b' }, { id: 'a' }, { id: 'c' }, { id: 'a' }];
    const rollen = ['info', null, 'uebung', null, null];
    const stand = { a: { gruppe: 'T', gruppeArt: 'neu' }, b: { gruppe: 'T', gruppeArt: 'alt' }, c: { gruppe: 'G', gruppeArt: 'neu' } };
    const r = f ? f(worte, rollen, 2, stand, 'T') : null;
    pruefe(gleich(r, { karten: 3, gewusst: 2, neu: 1 }),
      'Zahlen der Runde: Infokarte und Übung zählen nicht, ein neues Wort zählt einmal, nur der heutige Tag', r);
    pruefe(!!f && f(worte, rollen, 9, stand, 'T').gewusst === 3 && f(worte, rollen, undefined, stand, 'T').gewusst === 0,
      '„gewusst“ ist nie größer als die Karten und ohne Zähler 0');
    pruefe(!!f && gleich(f([], null, 0, {}, 'T'), { karten: 0, gewusst: 0, neu: 0 }), 'eine leere Runde rechnet sich ohne Fehler');
  }
  if (rNae) {
    let f = null; try { f = new Function(rNae + '\nreturn rundeNaechstes;')(); } catch (e) { f = null; }
    if (f) {
      const hoeren = { nav: 'hoeren', stand: 2, ziel: 10 }, saetze = { nav: 'sentences', stand: 0, ziel: 3 }, voll = { nav: 'hoeren', stand: 10, ziel: 10 };
      const a = f({ stand: 10, ziel: 30 }, hoeren, 50);
      pruefe(a.nav === 'learn-entry' && a.taste === 'Nächste Runde' && a.satz === 'Noch 20 Karten bis zu deinem Tagesziel.', 'Tagesziel offen und Karten da: „Nächste Runde“', a);
      pruefe(f({ stand: 29, ziel: 30 }, hoeren, 5).satz === 'Noch 1 Karte bis zu deinem Tagesziel.', 'eine Karte fehlt: Einzahl');
      const b = f({ stand: 10, ziel: 30 }, hoeren, 0);
      pruefe(b.nav === 'hoeren' && b.taste === 'Weiter mit Hören', 'Tagesziel offen, aber keine Karte mehr da: weiter zum zweiten Ring (Hören)', b);
      const c = f({ stand: 30, ziel: 30 }, saetze, 100);
      pruefe(c.nav === 'sentences' && c.taste === 'Weiter mit Sätzen' && c.satz === 'Dein Tagesziel bei den Karten ist erreicht.', 'Karten voll: weiter zum zweiten Ring (Sätze)', c);
      const d = f({ stand: 30, ziel: 30 }, voll, 100);
      pruefe(d.nav === 'home' && d.taste === 'Zur Startseite', 'beide Ringe voll: Zur Startseite', d);
      pruefe(f(null, null, 0).nav === 'home' && f({ stand: null, ziel: null }, { nav: 'hoeren', stand: null, ziel: null }, 3).nav === 'home', 'ohne Stand: Startseite, kein Fehler');
    } else pruefe(false, 'rundeNaechstes() lässt sich ausführen');
  }

  // 5. Die Seite schreibt nichts
  pruefe(!/PROGRESS\[[^\]]+\]\s*(\.\w+\s*)?=[^=]|LS\.set|saveProgress|saveSettings|touchStreak\(|tagZaehlen\(|merkeQuote\(/.test(ab),
    'js/abschluss.js schreibt keinen Lernstand und zählt nichts hoch');

  // 6. Verlassen
  if (rVerl) {
    const lauf = ziel => {
      const prot = [];
      const hist = { state: { screen: 'fertig', tiefe: 3 }, replaceState(st) { this.state = st; prot.push('ersetzt:' + st.screen + ':' + st.tiefe); } };
      try {
        const f = new Function('history', 'showScreen', 'lernenBeginnen', 'let RUNDE_ERGEBNIS = { karten: 1 };\n' + rVerl +
          '\nrundeFertigVerlassen(' + JSON.stringify(ziel) + ');\nreturn RUNDE_ERGEBNIS;');
        const erg = f(hist, (n, o) => prot.push('zeige:' + n + (o && o.ersetzen ? ':ersetzen' : '')), () => prot.push('lernen'));
        return { erg, prot };
      } catch (e) { return { erg: 'Fehler', prot: [String(e)] }; }
    };
    const heim = lauf('home');
    pruefe(heim.erg === null && gleich(heim.prot, ['ersetzt:home:3', 'zeige:home:ersetzen']), '„Zur Startseite“: Ergebnis weg, Verlauf zeigt die Startseite, kein neuer Eintrag', heim);
    const sae = lauf('sentences');
    pruefe(sae.erg === null && gleich(sae.prot, ['ersetzt:home:3', 'zeige:sentences']), '„Weiter mit Sätzen“: Verlauf zeigt die Startseite, dann die Übung', sae);
    const ler = lauf('learn-entry');
    pruefe(ler.erg === null && gleich(ler.prot, ['ersetzt:home:3', 'lernen']), '„Nächste Runde“: Verlauf zeigt die Startseite, dann beginnt die Runde', ler);
  }
  pruefe(/weiter\.addEventListener\('click', \(\) => rundeFertigVerlassen\(weiter\.dataset\.ziel \|\| 'home'\)\)/.test(ab)
    && /heim\.addEventListener\('click', \(\) => rundeFertigVerlassen\('home'\)\)/.test(ab), 'beide Tasten verlassen die Seite über rundeFertigVerlassen()');
  pruefe(/weiter\.dataset\.ziel = n\.nav/.test(rRender) && /heim\.hidden = n\.nav === 'home'/.test(rRender),
    'die große Taste trägt ihr Ziel; führt sie zur Startseite, ist die zweite Taste weg');
  pruefe(/ringKarten\(\)/.test(rRender) && /ringExtra\(\)/.test(rRender), 'die Wahl der Taste nimmt dieselben Ringe wie die Startseite');

  // 7. Dieselbe Ring-Rechnung auf der Startseite
  const rTr = fn(start, 'renderTagesringe');
  pruefe(/function ringKarten\(\)/.test(start) && /function ringExtra\(\)/.test(start), 'ringKarten() und ringExtra() stehen in js/start.js');
  pruefe(/= ringKarten\(\);/.test(rTr) && /= ringExtra\(\);/.test(rTr), 'renderTagesringe() rechnet über dieselben zwei Funktionen');
  return fehler;
}

console.log('test-abschluss.mjs — die Seite „Runde geschafft“\n');
const fehler = laufe(ECHT, false);

console.log('\nStörtest:');
const mit = (feld, alt, neu) => Object.assign({}, ECHT, { [feld]: typeof alt === 'string' ? ECHT[feld].replace(alt, neu) : ECHT[feld].replace(alt, neu) });
const stoerungen = [
  ['Seite fehlt', mit('seite', 'id="screen-fertig" data-screen="fertig"', 'id="screen-x" data-screen="x"')],
  ['Taste über data-nav', mit('seite', 'id="rfHeim"', 'id="rfHeim" data-nav="home"')],
  ['Feld fehlt', mit('seite', 'id="rfGewusst"', 'id="rfWusste"')],
  ['Skript nicht geladen', mit('seite', '<script src="js/abschluss.js"></script>', '')],
  ['nicht im Vorrat', mit('sw', "'./js/abschluss.js',", '')],
  ['Seite ohne „ersetzen“', mit('lernen', "showScreen(mitSeite ? 'fertig' : 'home', { ersetzen: true })", "showScreen(mitSeite ? 'fertig' : 'home')")],
  ['gewusst zählt jede Karte', mit('lernen', 'if (s.richtig && !rundenRolle(SESSION.idx)) SESSION.gewusst', 'if (s.richtig) SESSION.gewusst')],
  ['gewusst nicht gesichert', mit('lernen', /gewusst: Number\(SESSION\.gewusst\) \|\| 0,(\s*\n\s*zeit: Date\.now\(\))/, '$1')],
  ['Fortsetzen verliert gewusst', mit('lernen', ', gewusst: Number(g.gewusst) || 0 };', ' };')],
  ['Seite ohne Ergebnis erreichbar', mit('nav', "if (name === 'fertig' && !(typeof RUNDE_ERGEBNIS !== 'undefined' && RUNDE_ERGEBNIS)) name = 'home';", '')],
  ['leuchtet nichts', mit('nav', "fertig:'learn-entry', ", '')],
  ['Rechnung zählt Infokarten', mit('ab', 'liste.filter((_, i) => !(rollen && rollen[i])).length', 'liste.length')],
  ['Taste ohne Tagesziel-Prüfung', mit('ab', 'k.stand < k.ziel && vorrat > 0', 'vorrat > 0')],
  ['Seite schreibt Lernstand', mit('ab', 'RUNDE_ERGEBNIS = null;\n  try', 'RUNDE_ERGEBNIS = null; LS.set("x", 1);\n  try')],
  ['Verlauf nicht umgeschrieben', mit('ab', "try { history.replaceState(Object.assign({}, history.state || {}, { screen: 'home' }), ''); } catch (err){ /* ohne Verlauf */ }", '')],
  ['Startseite rechnet eigene Ringe', mit('start', 'const { stand: kStand, ziel: kZiel } = ringKarten();', 'const kStand = 0, kZiel = 1;')]
];
let alleRot = true;
for (const [name, t] of stoerungen){
  if (Object.keys(ECHT).every(k => t[k] === ECHT[k])){ alleRot = false; console.log('  ✘ ' + name + ' — Störung griff nicht'); continue; }
  const r = laufe(t, true);
  if (r > 0) console.log('  ✔ ' + name + ' → ' + r + ' rot');
  else { alleRot = false; console.log('  ✘ ' + name + ' → blieb grün'); }
}
console.log('');
console.log(!fehler && alleRot ? '✔ Seite „Runde geschafft“ stimmt, jede Störung erkannt (' + stoerungen.length + ')'
  : '✘ ' + fehler + ' gescheitert' + (alleRot ? '' : ', mindestens eine Störung unbemerkt'));
process.exit(!fehler && alleRot ? 0 : 1);
