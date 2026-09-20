/* pruefe-tonprotokoll.mjs — schreibt das Ton-Protokoll des Rezitators wirklich
 * mit, und kommt es bei Claude an?
 *
 * Anlass (Elias, 20.09.2026): „es liefen so ca 3 verse bis es jetzt aufgehört
 * hat bei geschlossenem display zu spielen" — „dann steht da nichts, er hört
 * einfach auf zu spielen und das wars". Ein Fehler, den ich nie erlebe (hier
 * läuft kein Ton). Das Protokoll ist der einzige Weg zur Ursache — also darf
 * es selbst nicht still ausfallen. [[werkzeug_ohne_aufrufer]]
 *
 * ⛔ Die Funktionen werden aus js/quran-audio.js herausgeschnitten und gefahren.
 * ⭐ Zwei Störtests am Ende.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const lies = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const audio = lies('../js/quran-audio.js');
const einst = lies('../js/einstellungen.js');
const sync  = lies('../js/sync.js');
const ohneKommentare = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const audioNackt = ohneKommentare(audio);
const einstNackt = ohneKommentare(einst);

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(64)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};
const schneide = (name) => {
  const m = audio.match(new RegExp('\\nfunction ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n'));
  if (!m){ console.log('X  ' + name + '() nicht gefunden'); process.exit(1); }
  return m[0];
};
const mKonst = audio.match(/\nconst QTON_SCHLUESSEL[^\n]*\nconst QTON_MAX[^\n]*\nlet QTON = null;\n/);
if (!mKonst){ console.log('X  die Konstanten des Ton-Protokolls nicht gefunden'); process.exit(1); }
const TEILE = { log: schneide('tonLog'), element: schneide('tonLogElement'), text: schneide('tonProtokollText'), zahl: schneide('tonProtokollZahl') };

function umgebung(teile, opt = {}){
  const lager = Object.assign({}, opt.lager || {});
  const ctx = {
    localStorage: {
      getItem: (k) => (k in lager ? lager[k] : null),
      setItem: (k, v) => { if (opt.speicherVoll) throw new Error('QuotaExceededError'); lager[k] = String(v); },
    },
    document: { hidden: !!opt.verborgen },
    stillerFehler: () => { ctx.gemeldet = (ctx.gemeldet || 0) + 1; },
    QAUDIO: { paar: null, el: null },
    Date, JSON, String, Number, Array,
  };
  vm.createContext(ctx);
  vm.runInContext(mKonst[0] + teile.log + teile.element + teile.text + teile.zahl
    + '\nthis.API = { tonLog, tonLogElement, tonProtokollText, tonProtokollZahl };', ctx);
  return { api: ctx.API, lager, ctx };
}

/* ======================= 1. Es schreibt wirklich mit ====================== */
console.log('1. Das Protokoll schreibt mit und überlebt das Ende der Seite:');
{
  const u = umgebung(TEILE);
  u.api.tonLog('eins'); u.api.tonLog('zwei');
  const gespeichert = JSON.parse(u.lager.vt_tonprotokoll || '[]');
  pruefe('jede Zeile steht sofort im Gerätespeicher', 2, gespeichert.length);
  pruefe('… mit Zeitstempel und Text', ['number', 'zwei'], [typeof gespeichert[1][0], gespeichert[1][2]]);
  pruefe('tonProtokollZahl() zählt sie', 2, u.api.tonProtokollZahl());

  /* Die Seite war weg und kommt wieder: das alte Protokoll bleibt, und der
     Neustart bekommt eine eigene Zeile — er ist selbst ein Befund. */
  const v = umgebung(TEILE, { lager: { vt_tonprotokoll: u.lager.vt_tonprotokoll } });
  v.api.tonLog('drei');
  const danach = JSON.parse(v.lager.vt_tonprotokoll);
  pruefe('nach einem Neustart bleibt das Alte stehen', 4, danach.length);
  pruefe('… und der Neustart steht als eigene Zeile da', true, /neu gestartet/.test(danach[2][2]));

  const h = umgebung(TEILE, { verborgen: true });
  h.api.tonLog('bei Bildschirm aus');
  pruefe('eine verborgene Seite wird vermerkt (H)', true, / H bei Bildschirm aus/.test(h.api.tonProtokollText()));

  const viel = umgebung(TEILE);
  for (let i = 1; i <= 250; i++) viel.api.tonLog('Zeile ' + i);
  const ring = JSON.parse(viel.lager.vt_tonprotokoll);
  pruefe('höchstens 200 Zeilen, die NEUESTEN bleiben', [200, 'Zeile 250'], [ring.length, ring[ring.length - 1][2]]);

  const voll = umgebung(TEILE, { speicherVoll: true });
  let geworfen = false;
  try { voll.api.tonLog('Speicher voll'); } catch (e){ geworfen = true; }
  pruefe('tonLog() wirft NIE, auch bei vollem Speicher', false, geworfen);
  pruefe('… meldet es aber', 1, voll.ctx.gemeldet || 0);

  const el = { readyState: 2, networkState: 1, currentTime: 8.23, error: null, src: 'https://x/y/067004.mp3', currentSrc: '' };
  const e = umgebung(TEILE);
  e.ctx.QAUDIO.paar = [{}, el]; e.ctx.QAUDIO.el = el;
  e.api.tonLogElement('waiting', el);
  pruefe('eine Element-Zeile nennt Element, Ladezustand, Stelle, Datei', true,
    /B\* waiting rs2 ns1 t8\.2 067004\.mp3/.test(e.api.tonProtokollText()));
}

/* ==================== 2. An den richtigen Stellen verdrahtet ============== */
console.log('2. Die Stellen, an denen die Antwort stehen kann:');
{
  const baue = audioNackt.match(/function audioBaue\(\)\{[\s\S]*?\n\}\n/);
  ['pause', 'ended', 'error', 'stalled', 'waiting', 'suspend', 'play'].forEach(n =>
    pruefe('beide Elemente melden `' + n + '`', true, !!baue && new RegExp("'" + n + "'").test(baue[0]) && /tonLogElement\(n, el\)/.test(baue[0])));
  pruefe('der Verswechsel sagt, ob aus dem Vorrat oder neu geladen wird', true, /tonLog\('SPIELE '/.test(audioNackt) && /NEUER LADEVORGANG/.test(audioNackt));
  pruefe('ein abgelehntes play() steht mit dem Fehlernamen da', true, /tonLog\('play\(\) ABGELEHNT '[\s\S]{0,80}err\.name/.test(audioNackt));
  pruefe('verborgen/sichtbar wird vermerkt', true, /addEventListener\('visibilitychange'[\s\S]{0,120}tonLog/.test(audioNackt));
  pruefe('einfrieren/auftauen wird vermerkt', true, /addEventListener\('freeze'/.test(audioNackt) && /addEventListener\('resume'/.test(audioNackt));
  pruefe('der Takt alle 10 s zeigt, ob Zeitgeber laufen', true, /audioWacheTick\.takt % 5 === 0[\s\S]{0,120}tonLog\('TAKT /.test(audioNackt));
  pruefe('die stille Schleife meldet ihr `pause`', true, /QAUDIO_STILLE\.addEventListener\(n,[\s\S]{0,80}tonLog\('STILLE '/.test(audioNackt));
  pruefe('SEIN Druck ist von einem System-`pause` unterscheidbar', true, /tonLog\('KNOPF Play\/Pause/.test(audioNackt) && /tonLog\('SPERRBILDSCHIRM pause'\)/.test(audioNackt));
}

/* ======================= 3. Es kommt bei Claude an ========================= */
console.log('3. Der Weg zu Claude (Einstellungen → Diagnose):');
{
  const stellen = (einstNackt.match(/diagnoseText\(\)\) \+ diagnoseAnhang\(\)/g) || []).length;
  pruefe('Schicken, Kopieren und Teilen hängen das Protokoll an', 3, stellen);
  pruefe('keine Stelle baut den Text noch OHNE Anhang', 0,
    (einstNackt.match(/textContent \|\| diagnoseText\(\);/g) || []).length);
  pruefe('diagnoseAnhang() ruft tonProtokollText()', true, /function diagnoseAnhang\(\)\{[\s\S]*?tonProtokollText\(\)[\s\S]*?\n\}/.test(einstNackt));
  pruefe('auf der sichtbaren Karte steht nur EINE Zeile dazu', 1, (einstNackt.match(/zeilen\.push\('Ton-Protokoll: '/g) || []).length);
  pruefe('das Protokoll wird NICHT abgeglichen', false, /'vt_tonprotokoll'/.test(ohneKommentare(sync)));
  pruefe('… und NICHT gesichert', false, /'vt_tonprotokoll'/.test(einstNackt));
}

/* ============================ 4. Störtests ================================ */
console.log('Störtests (jede zurückgedrehte Fassung muss auffallen):');
{
  /* a) tonLog ohne Schutz: bei vollem Speicher risse es die Wiedergabe mit. */
  const ohneSchutz = TEILE.log.replace(/\n  try \{\n/, '\n  {\n').replace(/\n  \} catch \(e\)\{\n[\s\S]*?\n  \}\n\}\n$/, '\n  }\n}\n');
  pruefe('a) die Störfassung unterscheidet sich vom Original', true, ohneSchutz !== TEILE.log);
  let geworfen = false;
  try { umgebung(Object.assign({}, TEILE, { log: ohneSchutz }), { speicherVoll: true }).api.tonLog('x'); } catch (e){ geworfen = true; }
  pruefe('a) ohne try/catch wirft tonLog bei vollem Speicher', true, geworfen);

  /* b) nur im Arbeitsspeicher: nach dem Ende der Seite wäre alles weg. */
  const nurRam = TEILE.log.replace(/\n\s*localStorage\.setItem\(QTON_SCHLUESSEL, JSON\.stringify\(QTON\)\);/, '');
  pruefe('b) die Störfassung unterscheidet sich vom Original', true, nurRam !== TEILE.log);
  const b = umgebung(Object.assign({}, TEILE, { log: nurRam }));
  b.api.tonLog('x');
  pruefe('b) ohne Speichern steht nichts im Gerätespeicher', undefined, b.lager.vt_tonprotokoll);
}

console.log(fehler === 0
  ? '\nAlles gruen: das Ton-Protokoll schreibt mit, überlebt das Ende der Seite und hängt an der Diagnose.'
  : '\n' + fehler + ' Probe(n) rot.');
process.exit(fehler === 0 ? 0 : 1);
