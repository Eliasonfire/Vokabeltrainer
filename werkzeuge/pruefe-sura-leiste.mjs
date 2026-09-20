#!/usr/bin/env node
/**
 * pruefe-sura-leiste.mjs — die Leiste des Handys zeigt die GANZE Sure (20.09.2026)
 *
 * Elias um 04:03 mit Bild des Sperrbildschirms: „sag mal könnte man auch wenn der
 * koran läuft statt das beim audio player meines handys von ayah zu ayah geht
 * sondern das die ganze sura angezeigt wird. weil dann könnte ich auch mehr zum
 * ende springen in der sure".
 *
 * Bewacht wird SEIN Satz und die eine Ausnahme, an der er still kippen würde:
 *   1. sind alle Verslängen bekannt, meldet die App die Summe und „davor + Stelle"
 *   2. ⛔ fehlt EINE Länge, bleibt es beim einzelnen Vers — nie eine Summe mit Lücke
 *   3. gemessene Längen schlagen geschätzte; ohne Zeitmarken reicht „alle gemessen"
 *   4. Ziehen am Punkt: anderer Vers → an dessen ANFANG, derselbe Vers → genau gespult
 *   5. verdrahtet: `seekto` wird belegt UND wieder freigegeben, beide Elemente messen
 *
 * ⚠️ Was hier NICHT geprüft werden kann: ob Android den Balken wirklich so zeichnet
 * und den Punkt ziehen lässt. Das zeigt nur sein Handy (hier läuft kein Ton).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audio = fs.readFileSync(path.join(REPO, 'js', 'quran-audio.js'), 'utf8');
const ohneKommentare = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const audioNackt = ohneKommentare(audio);

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(74)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};
const schneide = (name) => {
  const m = audio.match(new RegExp('\\nfunction ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n'));
  if (!m){ console.log('X  ' + name + '() nicht gefunden'); process.exit(1); }
  return m[0];
};
const TEILE = ['quranMedienPosition', 'suraDauerMerken', 'suraLaengen', 'suraLeiste', 'quranMedienSprung']
  .map(schneide).join('\n');

/** Drei Verse; Zeitmarken in ms: Vers 1 endet bei 10 000, Vers 2 bei 20 000, Vers 3 bei 30 000. */
function umgebung(opt = {}){
  const gemeldet = [], gespielt = [];
  let abrufe = 0;
  const marken = { 1: [[0, 4000], [4000, 10000]], 2: [[0, 20000]], 3: [[0, 30000]] };
  if (opt.ohneVers) delete marken[opt.ohneVers];
  const ctx = {
    navigator: { mediaSession: { setPositionState: (s) => gemeldet.push(s) } },
    QAUDIO: { el: { duration: 21, currentTime: 5, playbackRate: 1 }, sure: 67, vers: 2 },
    QSEG: opt.keineMarken ? { '7:67': 'fehlt' } : (opt.nochNichtGeholt ? {} : { '7:67': marken }),
    QDAUER: opt.gemessen ? { '7:67': Object.assign({}, opt.gemessen) } : {},
    segSchluessel: (r, s) => r + ':' + s,
    quranRezitator: () => 7,
    audioVersZahl: () => 3,
    segmenteHolen: () => { abrufe++; ctx.QSEG['7:67'] = 'laedt'; return Promise.resolve(); },
    audioSpiele: (s, v) => gespielt.push([s, v]),
    tonLog: () => {},
    isFinite, Number, Math, Object, Promise,
  };
  vm.createContext(ctx);
  vm.runInContext((opt.teile || TEILE) + '\nthis.API = { quranMedienPosition, suraLaengen, suraLeiste, quranMedienSprung };', ctx);
  return { api: ctx.API, ctx, gemeldet, gespielt, abrufe: () => abrufe };
}

console.log('1. Alle Längen bekannt → das Handy bekommt die ganze Sure:');
{
  const u = umgebung();
  u.api.quranMedienPosition();
  const s = u.gemeldet[0] || {};
  /* Vers 2 läuft, seine Datei ist 21 s lang (gemessen) statt 20 s (geschätzt). */
  pruefe('Dauer = Summe aller Verse, der laufende GEMESSEN (10 + 21 + 30)', 61, s.duration);
  pruefe('Stelle = alles davor + Stelle im Vers (10 + 5)', 15, s.position);
  pruefe('die gemessene Länge des laufenden Verses ist gemerkt', 21, (u.ctx.QDAUER['7:67'] || {})[2]);
}

console.log('2. ⛔ Fehlt EINE Länge, bleibt es beim einzelnen Vers:');
{
  const u = umgebung({ ohneVers: 3 });
  u.api.quranMedienPosition();
  const s = u.gemeldet[0] || {};
  pruefe('Dauer = nur die laufende Datei', 21, s.duration);
  pruefe('Stelle = nur die Stelle im Vers', 5, s.position);
  pruefe('suraLeiste() sagt ehrlich „weiß ich nicht"', null, u.api.suraLeiste());
}

console.log('3. Rezitator OHNE Zeitmarken: erst wenn jeder Vers einmal geladen war:');
{
  const halb = umgebung({ keineMarken: true, gemessen: { 1: 11 } });
  halb.api.quranMedienPosition();
  pruefe('ein Vers fehlt noch → einzelner Vers', 21, (halb.gemeldet[0] || {}).duration);
  const voll = umgebung({ keineMarken: true, gemessen: { 1: 11, 3: 31 } });
  voll.api.quranMedienPosition();
  pruefe('alle gemessen → ganze Sure (11 + 21 + 31)', 63, (voll.gemeldet[0] || {}).duration);
  const neu = umgebung({ nochNichtGeholt: true });
  neu.api.quranMedienPosition(); neu.api.quranMedienPosition();
  pruefe('die Zeitmarken werden geholt, wenn sie fehlen — EINMAL, nicht je Takt', 1, neu.abrufe());
}

console.log('4. Er zieht den Punkt:');
{
  const u = umgebung(); u.api.quranMedienPosition();
  u.api.quranMedienSprung(35);
  pruefe('35 s liegt in Vers 3 (10 + 21 = 31) → Vers 3 von ANFANG', [[67, 3]], u.gespielt);
  const v = umgebung(); v.api.quranMedienPosition();
  v.api.quranMedienSprung(12);
  pruefe('12 s liegt im laufenden Vers 2 → genau gespult, kein neuer Vers', [2, 0], [v.ctx.QAUDIO.el.currentTime, v.gespielt.length]);
  const w = umgebung(); w.api.quranMedienPosition();
  w.api.quranMedienSprung(9999);
  pruefe('hinter dem Ende → der letzte Vers', [[67, 3]], w.gespielt);
  const x = umgebung({ ohneVers: 3 }); x.api.quranMedienPosition();
  x.api.quranMedienSprung(8);
  pruefe('ohne ganze Sure wird nur im laufenden Vers gespult', [8, 0], [x.ctx.QAUDIO.el.currentTime, x.gespielt.length]);
}

console.log('5. Verdrahtet:');
{
  pruefe('`seekto` ist belegt', true, /setze\('seekto',\s*\(d\)\s*=>\s*quranMedienSprung\(Number\(d && d\.seekTime\)\)\)/.test(audioNackt));
  pruefe('… und wird beim Beenden wieder freigegeben (der Geh-Modus nutzt dieselbe Sitzung)', true,
    /\['play', 'pause', 'stop', 'nexttrack', 'previoustrack', 'seekto'\]\.forEach\(n => setze\(n, null\)\)/.test(audioNackt));
  const baue = (audioNackt.match(/function audioBaue\(\)\{[\s\S]*?\n\}\n/) || [''])[0];
  pruefe('BEIDE Elemente messen ihre Länge, der Vers kommt aus dem Dateinamen', true,
    /addEventListener\('loadedmetadata'[\s\S]{0,260}suraDauerMerken\(QAUDIO\.sure, Number\(m\[2\]\), Number\(el\.duration\)\)/.test(baue));
  /* Elias gleich danach: „es wäre trotzdem gut wenn mir auf dem bildschirm
     dennoch angezeigt wird welche ayah ich gerade bin". Der Titel nennt den
     Vers weiter — nur der Balken darunter meint die ganze Sure. */
  pruefe('der Titel auf dem Sperrbildschirm nennt weiter den laufenden Vers', true,
    /title:\s*sureName\(QAUDIO\.sure\) \+ ' · Vers ' \+ QAUDIO\.vers/.test(audioNackt));
  const name = '067024.mp3'.match(/(\d{3})(\d{3})\.mp3/);
  pruefe('… „067024.mp3" → Sure 67, Vers 24', [67, 24], [Number(name[1]), Number(name[2])]);
}

console.log('Störtests (jede zurückgedrehte Fassung muss auffallen):');
{
  /* a) die Lücke wird übergangen: fehlende Länge zählt als 0 statt als „weiß ich nicht". */
  const mitLuecke = TEILE.replace(/if \(!\(d > 0\) \|\| !isFinite\(d\)\) return null;/, 'if (!(d > 0) || !isFinite(d)) d = 0;');
  pruefe('a) die Störfassung unterscheidet sich vom Original', true, mitLuecke !== TEILE);
  const a = umgebung({ ohneVers: 3, teile: mitLuecke });
  a.api.quranMedienPosition();
  pruefe('a) eine Summe MIT Lücke (31 statt 21) fällt auf', 31, (a.gemeldet[0] || {}).duration);
  /* b) mitten in den anderen Vers statt an seinen Anfang. */
  pruefe('b) ein Sprung in einen anderen Vers ruft audioSpiele() ohne Stelle', true,
    /audioSpiele\(QAUDIO\.sure, vers\);/.test(schneide('quranMedienSprung')));
}

console.log(fehler === 0
  ? '\nAlles gruen: sind alle Verslängen bekannt, zeigt die Leiste des Handys die ganze Sure, und der Punkt lässt sich ziehen.'
  : '\n' + fehler + ' Probe(n) rot.');
process.exit(fehler === 0 ? 0 : 1);
