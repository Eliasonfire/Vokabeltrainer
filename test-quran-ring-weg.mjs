/* test-quran-ring-weg.mjs — vom Ring in die Sure, an den Seitenanfang, zurück zum Start
 *
 *   node test-quran-ring-weg.mjs
 *
 * ⛔ DREI SÄTZE VON ELIAS, alle vom 02.10.2026, alle zur täglichen Koran-Aufgabe:
 *
 *   A. „wenn ich auf zurück gehen also von meinem handy zurück ziehe
 *       (wischgeste) dann lande ich wenn ich meine tägliche sure gelesen habe
 *       beim koran und nicht auf dem starbildschirm … wenn ich fertig bin mit
 *       zb einer sura dann will ich wieder zum startbildschirm (also wo ich
 *       davor war)"
 *   B. „wenn ich auf die random seite gehe möchte ich direkt am anfang der
 *       seite sein bzw am anfang der ersten ayah dieser seite damit ich direkt
 *       anfangen kann zu lesen."
 *   C. „beim kästchen modus kann ich das gar nciht sehen anders als beim listen
 *       modus. beim kästchen modus will ich natürlich auch sehen welche seite
 *       wo ist."
 *
 * ⛔ Die Funktionen werden aus den echten Dateien GESCHNITTEN, nicht nachgebaut:
 * showScreen() (js/navigation.js), quranEbeneMerken(), zeigeVers(),
 * zeigeVersNachAufbau(), haltVersOben() (js/quran.js), oeffneSureVomRing()
 * (js/start.js). [[testvorlage_selbst_nachgebaut]] Nur openSurah() ist ein
 * Stellvertreter — er tut für die Historie dasselbe wie das Original, und dass
 * das Original diese Zeile noch trägt, prüft Teil A mit.
 *
 * Störtests am echten Quelltext — jeder MUSS rot werden:
 *   1. der Ring ruft showScreen('quranfull') wieder MIT eigener Ebene
 *   2. showScreen() kennt `ohneEbene` nicht mehr
 *   3. der Halt fasst nicht mehr nach (kein Beobachter, keine Uhren)
 *   4. der Halt hört nicht auf, wenn er den Bildschirm anfasst
 *   5. die Seitentrennung ist außerhalb der Liste wieder ausgeblendet
 *
 * Exit 0 = hält · 1 = Befund oder wirkungsloser Störtest
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8');

function schneide(quelle, name, datei){
  let start = quelle.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(datei + ': ' + name + '() nicht gefunden');
  let tiefe = 0, i = quelle.indexOf('{', start);
  for (; i < quelle.length; i++){
    if (quelle[i] === '{') tiefe++;
    else if (quelle[i] === '}'){ tiefe--; if (!tiefe) break; }
  }
  if (tiefe) throw new Error(datei + ': Klammern von ' + name + '() gehen nicht auf');
  if (quelle.slice(start - 6, start) === 'async ') start -= 6;
  return quelle.slice(start, i + 1);
}

/* ---------- A. Ring → Sure → „zurück" → Start ---------- */
async function teilA(d){
  const f = [];
  let code;
  try {
    code = [schneide(d.nav, 'showScreen', 'js/navigation.js'),
            schneide(d.quran, 'quranEbeneMerken', 'js/quran.js'),
            schneide(d.start, 'oeffneSureVomRing', 'js/start.js')].join('\n');
  } catch (e){ return [e.message]; }
  if (!d.quran.includes('if (!opt.ausHistorie) quranEbeneMerken({ sure:id });'))
    f.push('openSurah() legt die Sure nicht mehr mit quranEbeneMerken({ sure:id }) ab — der Stellvertreter in diesem Test stimmt dann nicht mehr');

  const neueWelt = () => {
    const stapel = [{ screen: 'home', tiefe: 0 }];
    const lage = { zeiger: 0, aktiv: 'home', geoeffnet: [] };
    const w = {
      Object, Number,
      history: {
        get state(){ return stapel[lage.zeiger]; },
        pushState(st){ stapel.length = lage.zeiger + 1; stapel.push(st); lage.zeiger++; },
        replaceState(st){ stapel[lage.zeiger] = st; }
      },
      document: {
        querySelector: s => (s === '.screen.active' ? { id: 'screen-' + lage.aktiv } : null),
        getElementById: id => (id === 'main' ? { scrollTop: 120 } : null)
      },
      zeigeBildschirm: n => { lage.aktiv = n; return n; },
      __lage: lage
    };
    vm.createContext(w);
    vm.runInContext(code + '\nasync function openSurah(id, opt){ const o = opt || {};'
      + ' if (!o.ausHistorie) quranEbeneMerken({ sure:id }); __lage.geoeffnet.push([id, opt]); }', w);
    return { w, stapel, lage };
  };

  /* 1. Sein Weg: Start → Ring „Zufällig" (Sure 10 ab Vers 7). */
  const { w, stapel, lage } = neueWelt();
  await w.oeffneSureVomRing(10, 7);
  if (stapel.length !== 2)
    f.push('nach dem Tipp auf den Ring liegen ' + stapel.length + ' Einträge in der Historie statt 2 (Start, Sure) — „zurück" landet dann auf der Surenliste');
  const oben = stapel[stapel.length - 1] || {};
  if (oben.screen !== 'quranfull' || oben.sure !== 10) f.push('der oberste Eintrag ist nicht die geöffnete Sure: ' + JSON.stringify(oben));
  if (oben.tiefe !== 1) f.push('die Sure liegt auf Tiefe ' + oben.tiefe + ' statt 1');
  if (stapel[0].screen !== 'home') f.push('der Start-Eintrag wurde überschrieben: ' + JSON.stringify(stapel[0]));
  if (stapel[0].rollstand !== 120) f.push('der Start-Eintrag hat seinen Rollstand nicht bekommen (' + stapel[0].rollstand + ' statt 120) — „zurück" käme oben heraus');
  if (lage.aktiv !== 'quranfull') f.push('der Quran-Bildschirm wird nicht gezeigt');
  const g = lage.geoeffnet[0];
  if (!g || g[0] !== 10 || !g[1] || g[1].vers !== 7) f.push('openSurah() bekam nicht Sure 10 mit Vers 7: ' + JSON.stringify(g));
  /* 2. Die Wischgeste: genau EIN Schritt zurück ist der Start. */
  lage.zeiger = Math.max(0, lage.zeiger - 1);
  if ((w.history.state || {}).screen !== 'home' || (w.history.state || {}).sure)
    f.push('ein „zurück" aus der Sure landet nicht auf dem Start, sondern auf ' + JSON.stringify(w.history.state));

  /* 3. Ein Ring ohne Vers (tägliche Sure) gibt keinen Vers mit. */
  const o = neueWelt();
  await o.w.oeffneSureVomRing(93, 0);
  if (o.lage.geoeffnet[0] && o.lage.geoeffnet[0][1] !== undefined) f.push('ein Ring ohne Vers gibt trotzdem Optionen mit');
  if (o.stapel.length !== 2) f.push('Ring ohne Vers: ' + o.stapel.length + ' Einträge statt 2');

  /* 4. Der Reiter „Quran" legt weiter seine eigene Ebene an. */
  const t = neueWelt();
  t.w.showScreen('quranfull');
  if (t.stapel.length !== 2 || t.stapel[1].screen !== 'quranfull' || t.stapel[1].tiefe !== 1)
    f.push('showScreen("quranfull") ohne Option legt keine eigene Ebene mehr an: ' + JSON.stringify(t.stapel));
  return f;
}

/* ---------- B. Der Sprung hält den Vers oben ---------- */
function teilB(d){
  const f = [];
  let code;
  try {
    const konst = (d.quran.match(/^const VERS_HALT_MS = [^\n]*$/m) || [])[0];
    const merker = (d.quran.match(/^let VERS_HALT_ENDE = [^\n]*$/m) || [])[0];
    if (!konst || !merker) return ['VERS_HALT_MS oder VERS_HALT_ENDE steht nicht mehr in js/quran.js'];
    code = 'let OFFENE_SURE = 10;\n' + konst + '\n' + merker + '\n'
      + ['zeigeVers', 'zeigeVersNachAufbau', 'haltVersOben'].map(n => schneide(d.quran, n, 'js/quran.js')).join('\n');
  } catch (e){ return [e.message]; }

  const KOPF = 50;
  const neueWelt = (mitBeobachter) => {
    const lage = { zielAbs: 3000, horcher: {}, uhren: [], beobachter: [] };
    const kasten = { scrollTop: 0, scrollTo(o){ this.scrollTop = o.top; }, getBoundingClientRect: () => ({ top: 0 }) };
    const ziel = { getBoundingClientRect: () => ({ top: lage.zielAbs - kasten.scrollTop }) };
    const w = {
      Math, Number,
      document: {
        getElementById: id => (id === 'main' ? kasten : id === 'verseList' ? {} : null),
        querySelector: s => (s.startsWith('#verseList .verse-item') ? ziel
          : s.includes('.quran-sticky') ? { getBoundingClientRect: () => ({ height: KOPF }) } : null),
        addEventListener: (n, fn) => { (lage.horcher[n] = lage.horcher[n] || new Set()).add(fn); },
        removeEventListener: (n, fn) => { if (lage.horcher[n]) lage.horcher[n].delete(fn); }
      },
      setTimeout: (fn, ms) => { lage.uhren.push({ fn, ms, aus: false }); return lage.uhren.length; },
      clearTimeout: nr => { if (lage.uhren[nr - 1]) lage.uhren[nr - 1].aus = true; }
    };
    if (mitBeobachter) w.ResizeObserver = function(cb){
      const b = { cb, an: false }; lage.beobachter.push(b);
      this.observe = () => { b.an = true; }; this.disconnect = () => { b.an = false; };
    };
    vm.createContext(w);
    vm.runInContext(code, w);
    return {
      w, lage, kasten,
      /* Wo steht der Vers? 8 px unter der Kopfleiste ist das Soll von zeigeVers(). */
      unterKopf: () => lage.zielAbs - kasten.scrollTop - KOPF,
      hoeheAendert: () => lage.beobachter.filter(b => b.an).forEach(b => b.cb()),
      uhr: ms => lage.uhren.filter(u => u.ms === ms && !u.aus).forEach(u => u.fn()),
      beruehre: n => [...(lage.horcher[n] || [])].forEach(fn => fn({})),
      horcherZahl: () => Object.values(lage.horcher).reduce((a, s) => a + s.size, 0),
      haltMs: vm.runInContext('VERS_HALT_MS', w)
    };
  };

  /* 1. Der Sprung selbst. */
  const a = neueWelt(true);
  if (a.w.zeigeVersNachAufbau(7) !== true) return ['zeigeVersNachAufbau() springt nicht'];
  if (a.unterKopf() !== 8) f.push('nach dem Sprung steht der Vers ' + a.unterKopf() + ' px unter der Kopfleiste statt 8');
  /* 2. Sein Bild: die Übersetzung wird eingesetzt, der Text darüber wächst. */
  a.lage.zielAbs += 400;
  a.hoeheAendert();
  if (a.unterKopf() !== 8)
    f.push('der Text über dem Vers ist um 400 px gewachsen, und der Seitenanfang steht ' + a.unterKopf() + ' px unter der Kopfleiste statt 8 — genau Elias\' Bild vom 02.10.2026');
  /* 3. Er fasst den Bildschirm an: ab da wird nichts mehr weggerissen. */
  a.beruehre('touchstart');
  a.lage.zielAbs += 300;
  a.hoeheAendert();
  [300, 900, 2000].forEach(a.uhr);
  if (a.unterKopf() !== 308) f.push('nach seiner Berührung wird weiter nachgefasst — das reißt ihm den Text weg, während er selbst rollt');
  if (a.horcherZahl() !== 0) f.push('nach dem Ende des Halts hängen noch ' + a.horcherZahl() + ' Horcher am Dokument');
  if (a.lage.beobachter.some(b => b.an)) f.push('nach dem Ende des Halts beobachtet der ResizeObserver weiter');

  /* 4. Ohne ResizeObserver fasst die Uhr nach. */
  const b = neueWelt(false);
  b.w.zeigeVersNachAufbau(7);
  b.lage.zielAbs += 400;
  b.uhr(300);
  if (b.unterKopf() !== 8) f.push('ohne ResizeObserver fasst niemand nach (' + b.unterKopf() + ' px statt 8)');

  /* 5. Eine andere Sure ist offen: der alte Halt darf dort nicht rollen. */
  const c = neueWelt(true);
  c.w.zeigeVersNachAufbau(7);
  vm.runInContext('OFFENE_SURE = 11', c.w);
  c.lage.zielAbs += 400;
  c.hoeheAendert();
  if (c.unterKopf() !== 408) f.push('der Halt rollt weiter, obwohl inzwischen eine andere Sure offen ist');

  /* 6. Ein neuer Sprung beendet den alten Halt; der Halt endet auch von selbst. */
  const e = neueWelt(true);
  e.w.zeigeVersNachAufbau(7);
  e.w.zeigeVersNachAufbau(9);
  if (e.lage.beobachter.filter(x => x.an).length !== 1) f.push('nach zwei Sprüngen laufen ' + e.lage.beobachter.filter(x => x.an).length + ' Beobachter statt 1');
  if (e.horcherZahl() !== 4) f.push('nach zwei Sprüngen hängen ' + e.horcherZahl() + ' Horcher statt 4 (je einer für touchstart, wheel, mousedown, keydown)');
  e.uhr(e.haltMs);
  if (e.horcherZahl() !== 0 || e.lage.beobachter.some(x => x.an)) f.push('der Halt endet nach ' + e.haltMs + ' ms nicht von selbst');
  return f;
}

/* ---------- C. Die Seitentrennung in beiden Ansichten ---------- */
function teilC(d){
  const f = [];
  const css = d.html.replace(/\/\*[\s\S]*?\*\//g, '');
  if (!/\.seiten-ende\{\s*display:\s*flex;?\s*\}/.test(css))
    f.push('index.html: `.seiten-ende{ display:flex; }` fehlt — die Seitentrennung ist nicht mehr in jeder Ansicht eingeblendet');
  if (/\.seiten-ende\s*\{[^}]*display:\s*none/.test(css))
    f.push('index.html: eine Regel blendet `.seiten-ende` aus — im Kästchenmodus sähe er nicht, wo die Seite anfängt');
  if (!d.quran.includes('<div class="seiten-ende" aria-hidden="true">Seite ${hier}</div>'))
    f.push('js/quran.js: renderVerses() baut die Seitentrennung nicht mehr');
  return f;
}

async function befunde(d){
  return [...await teilA(d), ...teilB(d), ...teilC(d)];
}

const echt = { nav: lies('js/navigation.js'), start: lies('js/start.js'), quran: lies('js/quran.js'), html: lies('index.html') };
let rot = 0;

const b = await befunde(echt);
if (b.length){ rot++; b.forEach(t => console.log('  ❌ ' + t)); }
else {
  console.log('  ✅ A: Ring → Sure liegt direkt über dem Start, ein „zurück" führt auf den Start');
  console.log('  ✅ B: der angesprungene Vers bleibt an der Kopfleiste, bis er den Bildschirm anfasst');
  console.log('  ✅ C: die Seitentrennung ist in beiden Ansichten eingeblendet');
}

const ersetze = (feld, alt, neu) => d => Object.assign({}, d, { [feld]: d[feld].replace(alt, neu) });
const STOERTESTS = [
  ['der Ring ruft showScreen("quranfull") wieder MIT eigener Ebene',
    ersetze('start', "showScreen('quranfull', { ohneEbene: true })", "showScreen('quranfull')")],
  ['showScreen() kennt `ohneEbene` nicht mehr',
    ersetze('nav', 'if (opt.ohneEbene){', 'if (false){')],
  ['der Halt fasst nicht mehr nach (kein Beobachter, keine Uhren)',
    d => ersetze('quran', '[300, 900, 2000].map(ms => setTimeout(nachfassen, ms))', '[]')(
         ersetze('quran', 'beobachter.observe(liste);', '')(d))],
  ['der Halt hört nicht auf, wenn er den Bildschirm anfasst',
    ersetze('quran', 'BERUEHRUNG.forEach(n => document.addEventListener(n, ende, true));', '')],
  ['die Seitentrennung ist außerhalb der Liste wieder ausgeblendet',
    ersetze('html', '.seiten-ende{ display:flex; }', '.seiten-ende{ display:none; }')]
];
for (const [name, mach] of STOERTESTS){
  const g = mach(echt);
  if (['nav', 'start', 'quran', 'html'].every(k => g[k] === echt[k])){ rot++; console.log('  ❌ Störtest wirkungslos (nichts ersetzt): ' + name); continue; }
  if ((await befunde(g)).length) console.log('  ✅ Störtest wird rot: ' + name);
  else { rot++; console.log('  ❌ Störtest bleibt GRÜN: ' + name); }
}

if (rot){ console.log('\n⛔ ' + rot + ' Befund(e).'); process.exit(1); }
console.log('\n✔ Ring, Seitenanfang und Seitentrennung halten — und der Test kann rot werden.');
