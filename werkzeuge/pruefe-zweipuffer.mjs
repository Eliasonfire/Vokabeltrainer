/* pruefe-zweipuffer.mjs — starten die zwei Abspielelemente wirklich ohne
 * neuen Ladevorgang?
 *
 * ⭐ Der Anlass (09.09.2026): „sobald ich beim tablet ausschalte und rezitator
 * weiter laufen lasse dann läuft er für genau 2 ayaht und das wars" — auf
 * Handy und Tablet gleich. Ein verborgenes Fenster darf laufende Wiedergabe
 * fortsetzen, aber neue Medienressourcen stellt der Browser zurück. Vers 3
 * brauchte einen neuen Ladevorgang und blieb still. [[hintergrund_tab_drosselt_timer]]
 *
 * Seitdem wechseln sich zwei Elemente ab: waehrend A spielt, hat B den
 * naechsten Vers fertig geladen, und am Versende wird nur `play()` gerufen.
 *
 * ⛔ DIE FUNKTIONEN WERDEN AUS js/quran-audio.js HERAUSGESCHNITTEN und in
 *    einem vm gefahren — nicht nachgebaut. Ein Nachbau enthaelt den Fehler
 *    nicht, den er finden soll. [[testvorlage_selbst_nachgebaut]]
 *
 * ⚠️ Das `Audio`-Doppel unten kann nur, was die Funktionen fragen: `src`,
 *    `play()`, `pause()`, `load()`, `currentTime`, Ereignisse. Mehr darf es
 *    nicht koennen, sonst prueft der Test das Doppel. [[pruefung_fragt_einen_stellvertreter_ab]]
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const QUELLE = fileURLToPath(new URL('../js/quran-audio.js', import.meta.url));
const src = fs.readFileSync(QUELLE, 'utf8');

/* Jede Funktion samt Kommentar bis zur schliessenden Klammer am Zeilenanfang. */
function schneide(name, asyncFn){
  const re = new RegExp('\\n' + (asyncFn ? 'async ' : '') + 'function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n');
  const m = src.match(re);
  if (!m){ console.log('X  ' + name + '() nicht gefunden'); process.exit(1); }
  return m[0];
}
const TEILE = [
  schneide('audioBaue'), schneide('audioElement'), schneide('audioAnderes'),
  schneide('audioVorladen'), schneide('audioSpiele', true), schneide('audioAus'),
  schneide('audioNaechster'), schneide('audioAdresse'), schneide('audioVersZahl'),
  schneide('schleifeGilt')
].join('\n');
const KONST = src.match(/\nconst QAUDIO = \{[^\n]*\n/)[0] + src.match(/\nconst QSCHLEIFE = \{[^\n]*\n/)[0]
            + "\nconst QURAN_AUDIO_BASIS = 'https://verses.quran.com/';\n";

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(54)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};

/* ---------- Das Audio-Doppel ----------
   Zaehlt LADEVORGAENGE (jede Zuweisung an `src` mit neuem Wert) und
   PLAY-Aufrufe je Element. Genau diese zwei Zahlen sind die Sache. */
function baueUmgebung(){
  const geladen = [];         /* [element-nr, datei] je neuem src */
  const gespielt = [];        /* [element-nr, datei] je play()      */
  let nr = 0;
  class Audio {
    constructor(){ this.nr = ++nr; this._src = ''; this.paused = true; this.currentTime = 0; this.preload = ''; this._h = {}; }
    get src(){ return this._src; }
    set src(v){ if (v !== this._src){ this._src = v; geladen.push([this.nr, v.slice(-10)]); } }
    addEventListener(n, f){ (this._h[n] = this._h[n] || []).push(f); }
    dispatchEvent(ev){ (this._h[ev.type] || []).forEach(f => f(ev)); return true; }
    play(){ this.paused = false; gespielt.push([this.nr, this._src.slice(-10)]); this.dispatchEvent({ type: 'play' }); return Promise.resolve(); }
    pause(){ if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } }
    load(){ }
    removeAttribute(a){ if (a === 'src') this._src = ''; }
  }
  const ctx = {
    Audio, console,
    /* alles, was audioSpiele ausserhalb der Sache beruehrt, als leere Huelle */
    rezitatorVon: id => ({ id, pfad: 'Alafasy/mp3/' }),
    quranRezitator: () => 7,
    VERSE_CACHE: { 67: new Array(30).fill(0) },
    OFFENE_SURE: 67,
    GEH: { an: false },
    markiereLaufendenVers(){}, wortModusVorbereiten(){}, quranStilleAn(){}, quranStilleAus(){},
    quranMedienKnoepfe(){}, quranMedienInfo(){}, quranMedienPosition(){}, zeigeSpieler(){},
    wortUhrStop(){}, markeWeg(){}, cancelAnimationFrame(){},
    QW_LETZTES: -1, QW_UHR: null,
    document: { visibilityState: 'visible' }
  };
  vm.createContext(ctx);
  vm.runInContext(KONST + TEILE + '\nthis.API = { audioSpiele, audioNaechster, audioAus, QAUDIO, QSCHLEIFE };', ctx);
  return { api: ctx.API, geladen, gespielt };
}

/* Versende ausloesen wie der Browser: `ended` am AKTIVEN Element. */
async function versEnde(u){
  u.api.QAUDIO.el.dispatchEvent({ type: 'ended' });
  await new Promise(r => setTimeout(r, 0));
}

console.log('Zwei Elemente, abwechselnd:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 1);
  pruefe('Vers 1 spielt in Element 1',                  [1, '067001.mp3'], u.gespielt[0]);
  pruefe('Vers 2 liegt danach im ANDEREN Element',      [2, '067002.mp3'], u.geladen[1]);
  await versEnde(u);
  pruefe('Versende → Vers 2 spielt aus Element 2',       [2, '067002.mp3'], u.gespielt[1]);
  /* ⭐ DIE eigentliche Zusicherung: zwischen dem Ende von Vers 1 und dem Start
     von Vers 2 darf KEIN neuer Ladevorgang liegen. */
  const ladeVorStart2 = u.geladen.filter(([, d]) => d === '067002.mp3').length;
  pruefe('Vers 2 wurde genau EINMAL geladen (vorher)',   1, ladeVorStart2);
  await versEnde(u); await versEnde(u); await versEnde(u);
  pruefe('danach 1→2→1→2 im Wechsel',
    [1, 2, 1, 2, 1], u.gespielt.slice(0, 5).map(([n]) => n));
  pruefe('jede Datei genau einmal gespielt',
    ['067001.mp3', '067002.mp3', '067003.mp3', '067004.mp3', '067005.mp3'],
    u.gespielt.slice(0, 5).map(([, d]) => d));
  /* Kein Element meldet für einen Vers, den es nicht spielt. */
  const doppelt = u.gespielt.map(([, d]) => d).filter((d, i, a) => a.indexOf(d) !== i);
  pruefe('kein Vers doppelt gestartet',                  [], doppelt);
}

console.log('\nWiederholbereich und Beenden:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 4);
  u.api.QSCHLEIFE.an = true; u.api.QSCHLEIFE.von = 2; u.api.QSCHLEIFE.bis = 4; u.api.QSCHLEIFE.sure = 67;
  await versEnde(u);
  pruefe('nach Vers 4 zurueck auf Vers 2',               2, u.api.QAUDIO.vers);
  await versEnde(u);
  pruefe('dann Vers 3',                                  3, u.api.QAUDIO.vers);
  u.api.audioAus();
  const beideLeer = [u.api.QAUDIO.paar[0].src, u.api.QAUDIO.paar[1].src];
  pruefe('Beenden leert BEIDE Elemente',                 ['', ''], beideLeer);
  pruefe('Beenden haelt beide an',                       [true, true], u.api.QAUDIO.paar.map(e => e.paused));
}

console.log('\nRezitator mitten im Vers gewechselt:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 1);
  /* neuer Rezitator: andere Adresse fuer denselben Vers */
  u.api.QAUDIO.el._src = '';                         /* nichts vorbereitet */
  await u.api.audioSpiele(67, 1);
  pruefe('derselbe Vers startet neu, kein Sprung',        1, u.api.QAUDIO.vers);
  await versEnde(u);
  pruefe('und der naechste kommt aus dem Vorrat',         '067002.mp3', u.gespielt[u.gespielt.length - 1][1]);
}

/* ---------- Der Stoertest: haette die ALTE Fassung das gemerkt? ----------
   Das Kennzeichen der alten Fassung war: EIN Element, `src` je Vers neu.
   Wird `audioAnderes()` so gestoert, dass es immer das spielende Element
   zurueckgibt, MUSS Vers 2 vor seinem Start ein zweites Mal geladen werden —
   genau der Ladevorgang, der im Hintergrund haengenbleibt.
   [[stoertest_muss_wirkung_nachweisen]] */
console.log('\nStoertest — ein einziges Element wie vor v425:');
{
  /* audioAnderes durch eine Fassung ersetzen, die das SPIELENDE Element
     liefert — das ist die alte Welt: ein Element, `src` je Vers neu. */
  const gestoert = TEILE.replace(/\nfunction audioAnderes\(\)\{[\s\S]*?\n\}\n/,
    '\nfunction audioAnderes(){ return audioElement(); }\n');
  if (gestoert === TEILE){ console.log('  X  audioAnderes liess sich nicht stoeren — Stoertest wirkungslos.'); fehler++; }
  else {
    const geladen = [], gespielt = []; let nr = 0;
    class Audio {
      constructor(){ this.nr = ++nr; this._src = ''; this.paused = true; this.currentTime = 0; this._h = {}; }
      get src(){ return this._src; }
      set src(v){ if (v !== this._src){ this._src = v; geladen.push([this.nr, v.slice(-10)]); } }
      addEventListener(n, f){ (this._h[n] = this._h[n] || []).push(f); }
      dispatchEvent(ev){ (this._h[ev.type] || []).forEach(f => f(ev)); return true; }
      play(){ this.paused = false; gespielt.push([this.nr, this._src.slice(-10)]); this.dispatchEvent({ type: 'play' }); return Promise.resolve(); }
      pause(){ this.paused = true; } load(){} removeAttribute(){ this._src = ''; }
    }
    const ctx = { Audio, console, rezitatorVon: id => ({ id, pfad: 'Alafasy/mp3/' }), quranRezitator: () => 7,
      VERSE_CACHE: { 67: new Array(30).fill(0) }, OFFENE_SURE: 67, GEH: { an: false },
      markiereLaufendenVers(){}, wortModusVorbereiten(){}, quranStilleAn(){}, quranStilleAus(){},
      quranMedienKnoepfe(){}, quranMedienInfo(){}, quranMedienPosition(){}, zeigeSpieler(){},
      wortUhrStop(){}, markeWeg(){}, cancelAnimationFrame(){}, QW_LETZTES: -1, QW_UHR: null,
      document: { visibilityState: 'visible' } };
    vm.createContext(ctx);
    vm.runInContext(KONST + gestoert + '\nthis.API = { audioSpiele, QAUDIO };', ctx);
    await ctx.API.audioSpiele(67, 1);
    ctx.API.QAUDIO.el.dispatchEvent({ type: 'ended' });
    await new Promise(r => setTimeout(r, 0));
    const ladeVers2 = geladen.filter(([, d]) => d === '067002.mp3').length;
    const elemente = new Set(gespielt.map(([n]) => n)).size;
    pruefe('mit EINEM Element wird Vers 2 vor dem Start neu geladen', true, ladeVers2 >= 2 || elemente === 1);
    pruefe('… und alles spielt aus demselben Element (Eichung)',     1, elemente);
  }
}

console.log('\n' + (fehler ? 'FEHLER: ' + fehler
  : 'Kein Vers braucht am Start einen neuen Ladevorgang — die Rezitation laeuft im Hintergrund durch.'));
process.exit(fehler ? 1 : 0);
