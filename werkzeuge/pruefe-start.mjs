#!/usr/bin/env node
/* pruefe-start.mjs — was beim Start eingerichtet wird, und die eine Ausnahme
 *
 * ⛔⛔ DER ANLASS (09.09.2026). `js/init.js` (75 Zeilen) wurde von keinem
 * Pruefer genannt — die dritte und letzte solche Datei. Sie richtet zwei
 * Dinge ein, und beide haben eine Geschichte:
 *
 * 1. DAS BROWSERMENUE BLEIBT ZU. Elias mit Bild des aufgeklappten
 *    Chrome-Menues ueber dem Verstext: „habe lange drauf gehlaten an eine
 *    stelle und dann ist das auf gegangen, das soll eigentlich nicht
 *    passieren" — und auf die Rueckfrage: „grundsaetzlich auf der app nichts
 *    zu suchen".
 *
 *    ⛔⛔ MIT EINER AUSNAHME, und die ist keine Kuer: In einem Eingabefeld ist
 *    das lange Druecken der einzige Weg zu „Einfuegen". Faellt die Ausnahme
 *    weg, kann er in die Suche, ins Sprungfeld und ins Vokabelformular nichts
 *    mehr einsetzen — eine Faehigkeit weggenommen, die niemand zur Sprache
 *    gebracht hat. [[fehler_trifft_mehr_als_gemeldet]]
 *
 *    Genau diese Ausnahme ist die Sorte, die bei einer spaeteren Vereinfachung
 *    als „unnoetig" verschwindet. Deshalb steht sie hier unter Bewachung.
 *
 * 2. DIE SERVICE-WORKER-ANMELDUNG. Scheitert sie, hat die App keinen
 *    Offline-Betrieb und keinen Weg, sich zu erneuern. Seit v443 meldet sie
 *    das ueber `stillerFehler()` statt es zu schlucken.
 *
 * ⛔ Der echte Listener wird ausgeschnitten und ausgefuehrt.
 * [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const I = fs.readFileSync(path.join(REPO, 'js', 'init.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
};

/* ---------- Den contextmenu-Listener ausschneiden und ausfuehren ---------- */
const m = I.match(/document\.addEventListener\('contextmenu',\s*\(e\)=>\{[\s\S]*?\n\}\);/);
if (!m) { console.log('⛔ Der contextmenu-Listener ist nicht auffindbar — hat js/init.js einen neuen Aufbau?'); process.exit(1); }

const gebaut = new Function('document', 'return (' + m[0]
  .replace(/^document\.addEventListener\('contextmenu',\s*/, '')
  .replace(/\);\s*$/, '') + ');');

/* Eine Bühne, die nur `closest` kennt — mehr fragt der Listener nicht ab. */
const bauEreignis = (passt) => {
  let verhindert = false;
  return {
    ev: { target: { closest: (sel) => (passt(sel) ? { sel } : null) },
          preventDefault: () => { verhindert = true; } },
    war: () => verhindert,
  };
};
const listener = gebaut({});

console.log('=== Bleibt das Browsermenue zu? ===\n');
{
  /* Irgendwo auf der Seite: kein Eingabefeld in der Kette. */
  const e = bauEreignis(() => false);
  listener(e.ev);
  pruefe('langes Druecken im Verstext → Menue wird verhindert', e.war(), true);
}
{
  /* ⛔ Die Ausnahme: in einem Eingabefeld MUSS das Menue aufgehen, sonst gibt
     es kein „Einfuegen". */
  const felder = ['input', 'textarea', 'select', '[contenteditable=""]', '[contenteditable="true"]'];
  for (const f of felder) {
    const e = bauEreignis((sel) => sel.includes(f.split('[')[0] || f) || sel.includes(f));
    listener(e.ev);
    pruefe('in ' + f + ' bleibt „Einfuegen" erreichbar', e.war(), false);
  }
}
{
  /* ⚠️ Gefragt wird ueber `closest`, nicht ueber `tagName`: getippt wird oft
     auf ein KIND des Feldes. Diese Probe faellt durch, wenn jemand auf
     `e.target.tagName` umstellt — dann waere ein Klick auf ein Kind wieder
     gesperrt. */
  pruefe('geprueft wird mit closest(), nicht mit tagName', /closest\(/.test(m[0]) && !/tagName/.test(m[0]), true);
  pruefe('contenteditable ist beiden Schreibweisen nach dabei',
    /contenteditable=""/.test(m[0]) && /contenteditable="true"/.test(m[0]), true);
}

console.log('\n=== Meldet sich die Service-Worker-Anmeldung, wenn sie scheitert? ===\n');
{
  const sw = (I.match(/if \('serviceWorker' in navigator\)\{[\s\S]*?\n\}/) || [''])[0];
  pruefe('die Anmeldung steht in js/init.js', /serviceWorker\.register\(/.test(sw), true);
  /* ⛔ Der Fall aus v443: `.catch(()=>{})` schluckte den Fehler, und ohne
     Service Worker ist die App ein Browser-Tab mit Internetzwang. */
  pruefe('ihr Fehler wird NICHT stumm geschluckt', /\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(sw), false);
  pruefe('sie meldet ueber stillerFehler()', /stillerFehler\(/.test(sw), true);
  pruefe('die Meldung sagt, was fehlt (Offline-Betrieb)', /Offline/.test(sw), true);
}

/* ---------- Stoertest ---------- */
console.log('\n=== Stoertest ===\n');
{
  /* Ein Listener, der IMMER verhindert — die Ausnahme also weggelassen. */
  const ohneAusnahme = new Function('return (e)=>{ e.preventDefault(); };')();
  const e = bauEreignis(() => true);
  ohneAusnahme(e.ev);
  pruefe('ohne die Ausnahme wuerde die Probe rot', e.war(), true);
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Das Browsermenue bleibt zu — ausser dort, wo Elias einfuegen muss.');
process.exit(fehler ? 1 : 0);
