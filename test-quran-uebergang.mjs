/* test-quran-uebergang.mjs — die Pause zwischen zwei Ayat (v625, 26.09.2026).
 *
 * Elias vom Handy: „Rezitator: Pause zwischen Ayat zu lang. Wirkt abgehackt,
 * als würde nach jeder Ayah abgeschnitten und neu angesetzt, statt in einem
 * Stück gelesen. Ziel: flüssige Übergänge."
 *
 * Geprüft wird, was js/quran-audio.js daraus macht:
 *   1. audioStilleAus()      — findet erste und letzte Silbe in einer Datei
 *   2. audioUebergangZeit()  — wann der nächste Vers startet, und NIE vor der
 *                              letzten Silbe des laufenden
 *   3. audioLatenz()         — Median der gemessenen Anlaufzeiten, gedeckelt
 *   4. audioSpiele(…, {frueh}) mit zwei Abspielelementen: der alte Vers
 *      klingt aus statt angehalten zu werden, und sein Element wird erst nach
 *      seinem Ende neu beladen (sonst schnitte das den Nachhall ab)
 *   5. Störtests: ohne die Schutzzeilen wird dieser Test rot.
 *
 * ⛔ Die Funktionen werden aus der Quelle HERAUSGESCHNITTEN, nicht nachgebaut.
 * Ein Nachbau prüfte seine eigene Fassung. [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(REPO, 'js', 'quran-audio.js'), 'utf8').replace(/\r\n/g, '\n');
let fehler = 0;
const ok = (b, was) => { console.log((b ? '  ok  ' : '  ⛔  ') + was); if (!b) fehler++; };
const nah = (a, b, tol = 0.011) => typeof a === 'number' && Math.abs(a - b) <= tol;

function schneide(name, asyncFn){
  const re = new RegExp('\\n' + (asyncFn ? 'async ' : '') + 'function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n');
  const m = src.match(re);
  if (!m){ console.log('  ⛔  ' + name + '() nicht gefunden'); process.exit(1); }
  return m[0];
}
function konst(name){
  const m = src.match(new RegExp('\\nconst ' + name + ' = [^\\n]*\\n'));
  if (!m){ console.log('  ⛔  const ' + name + ' nicht gefunden'); process.exit(1); }
  return m[0];
}
const KONST = ['QAUDIO_VORLAUF', 'QAUDIO_SPRACHE_DB', 'QLATENZ'].map(konst).join('');
const REIN = ['audioStilleAus', 'audioVornBehalten', 'audioStartPos', 'audioLatenzMerken', 'audioLatenz', 'audioUebergangZeit'].map(n => schneide(n)).join('\n');

function rein(teile = REIN){
  const ctx = { Math, Number, console };
  vm.createContext(ctx);
  vm.runInContext(KONST + teile + '\nthis.API = { audioStilleAus, audioStartPos, audioLatenzMerken, audioLatenz, audioUebergangZeit, QAUDIO_VORLAUF };', ctx);
  return ctx.API;
}
const A = rein();
/* Die Pausen am Stück, wie sie in QURAN_REZITATOREN stehen — aus der Quelle
   gelesen, nicht abgeschrieben. */
const pauseVon = (pfad) => {
  const m = src.match(new RegExp("pfad: '" + pfad.replace(/\//g, '\\/') + "', pause: ([\\d.]+)"));
  return m ? Number(m[1]) : NaN;
};
const P_AFASY = pauseVon('Alafasy/mp3/'), P_BASIT = pauseVon('AbdulBaset/Mujawwad/mp3/'), P_SHATRI = pauseVon('Shatri/mp3/');
ok(P_AFASY === 0.42 && P_SHATRI === 0.64,
   'Pausen am Stück in QURAN_REZITATOREN: al-ʿAfāsī ' + P_AFASY + ' · ash-Shāṭirī ' + P_SHATRI);
/* ʿAbd al-Bāsiṭ: nicht gemessen (am Stück 4,07 s), sondern Elias' Wahl vom
   01.10.2026. Dieser Test bewacht seinen Satz. */
ok(P_BASIT === 0.42,
   'ʿAbd al-Bāsiṭ ' + P_BASIT + ' s — Elias, 01.10.2026: „du sollst bei ihm die zeit auch verkürzen in beiden apps", „Knapp eine halbe Sekunde"');

/* ---------- 1. Erste und letzte Silbe ---------- */
console.log('Stille messen (audioStilleAus):');
{
  const rate = 8000;
  /* 1,0 s Stille · 2,0 s Stimme (Amplitude 0,5) · 0,7 s Nachhall bei −40 dB */
  const n = Math.round(rate * 3.7);
  const k = new Float32Array(n);
  for (let i = 0; i < n; i++){
    const t = i / rate;
    if (t >= 1.0 && t < 3.0) k[i] = 0.5 * Math.sin(2 * Math.PI * 220 * t);
    else if (t >= 3.0) k[i] = 0.01 * Math.sin(2 * Math.PI * 220 * t);
  }
  const st = A.audioStilleAus([k], rate);
  ok(st && nah(st.vorn, 1.0, 0.021), 'erste Silbe bei 1,0 s gefunden (' + (st && st.vorn.toFixed(3)) + ')');
  ok(st && nah(st.hinten, 0.7, 0.021), 'Nachhall unter −30 dB zählt NICHT als Stimme: hinten 0,7 s (' + (st && st.hinten.toFixed(3)) + ')');
  ok(st && nah(st.dauer, 3.7, 0.001), 'Dauer 3,7 s');
  ok(A.audioStilleAus([new Float32Array(rate)], rate) === null, 'nur Stille → null (nichts zu kürzen)');
  const stereo = A.audioStilleAus([new Float32Array(n), k.map(x => x * 2)], rate);
  ok(stereo && nah(stereo.vorn, 1.0, 0.021), 'Stereo: Stimme nur rechts wird trotzdem gefunden');
  ok(nah(A.audioStartPos({ vorn: 1.69 }, { hinten: 1.0 }, 0, P_AFASY), 1.64, 0.001),
     'langer Nachhall davor: Start 50 ms vor der ersten Silbe, nicht bei 0');
  ok(A.audioStartPos({ vorn: 0.02 }, { hinten: 1.0 }, 0, P_AFASY) === 0, 'nie vor 0');
  ok(A.audioStartPos({ vorn: 1.69 }, null, 0, P_AFASY) === 0 && A.audioStartPos({ vorn: 1.69 }, { hinten: 1 }, 0, null) === 0
     && A.audioStartPos(null, { hinten: 1 }, 0, P_AFASY) === 0, 'ohne beide Messungen oder ohne Ziel-Pause bei 0 — wie bis v624');
}

/* ---------- 2. Wann der nächste Vers startet ---------- */
console.log('\nÜbergang (audioUebergangZeit):');
{
  /* Die Werte sind die, die der Browser am 26.09.2026 mit audioStilleHolen()
     an den echten Dateien gemessen hat; Anlaufzeit 0,139 s aus seinem Ton-
     Protokoll vom 20.09.2026. */
  const L = 0.139;
  /* al-ʿAfāsī 67:1 → 67:2 */
  const st = { vorn: 0.12, hinten: 1.03, dauer: 10.73 };
  const folge = { vorn: 0.12, hinten: 0.89, dauer: 13.85 };
  const t = A.audioUebergangZeit(st, folge, L, P_AFASY);
  ok(t !== null && t < st.dauer - 0.5, 'al-ʿAfāsī 67:1 → nächster Vers startet bei ' + (t && t.toFixed(3)) + ' s statt am Ende (10,73 s)');
  const start = A.audioStartPos(folge, st, L, P_AFASY);
  const pause = (t - (st.dauer - st.hinten)) + L + (folge.vorn - start);
  ok(nah(pause, P_AFASY, 0.002), 'Pause zwischen den Stimmen = ' + pause.toFixed(3) + ' s = seine Pause am Stück');
  const vorher = st.hinten + L + folge.vorn;
  ok(vorher > 3 * P_AFASY, 'vorher: ' + vorher.toFixed(2) + ' s — dreimal so lang wie am Stück (das war seine Meldung)');
  /* ʿAbd al-Bāsiṭ, dieselben Dateiwerte wie bisher: seit dem 02.10.2026 wie
     al-ʿAfāsī (Elias' Wahl), nicht mehr seine vier Sekunden. */
  const b1 = { vorn: 2.04, hinten: 1.78, dauer: 20.64 }, b2 = { vorn: 2.86, hinten: 1.75, dauer: 12.83 };
  const bt = A.audioUebergangZeit(b1, b2, L, P_BASIT);
  ok(bt !== null && bt < b1.dauer - 0.5, 'ʿAbd al-Bāsiṭ: nächster Vers startet bei ' + (bt && bt.toFixed(3)) + ' s statt am Ende (20,64 s)');
  const bStart = A.audioStartPos(b2, b1, L, P_BASIT);
  const bPause = (bt - (b1.dauer - b1.hinten)) + L + (b2.vorn - bStart);
  ok(nah(bPause, 0.42, 0.002), 'ʿAbd al-Bāsiṭ: Pause zwischen den Stimmen ' + bPause.toFixed(3) + ' s = knapp eine halbe Sekunde, nicht mehr vier');
  ok(bt >= b1.dauer - b1.hinten, 'ʿAbd al-Bāsiṭ: trotzdem nie vor seiner letzten Silbe');
  /* ash-Shāṭirī 67:5: passt schon fast. */
  const s1 = { vorn: 0.10, hinten: 0.40, dauer: 17.74 }, s2 = { vorn: 0.10, hinten: 0.2, dauer: 9 };
  ok(A.audioUebergangZeit(s1, s2, L, P_SHATRI) === null && A.audioStartPos(s2, s1, L, P_SHATRI) === 0,
     'ash-Shāṭirī: Pause ist schon wie am Stück → nichts geändert');
  ok(A.audioUebergangZeit(st, null, L, P_AFASY) === null, 'nächste Datei nicht gemessen → null');
  ok(A.audioUebergangZeit(null, folge, L, P_AFASY) === null, 'laufende Datei nicht gemessen → null');
  ok(A.audioUebergangZeit(st, folge, L, null) === null, 'keine Ziel-Pause für den Rezitator → null');
  /* ⛔ Die Schutzzeile: selbst mit absurder Anlaufzeit nie vor der letzten Silbe. */
  const t2 = A.audioUebergangZeit(st, folge, 2.0, P_AFASY);
  ok(nah(t2, st.dauer - st.hinten, 0.001), 'nie vor der letzten Silbe, egal was die Anlaufzeit sagt (' + (t2 && t2.toFixed(3)) + ')');
}

/* ---------- 3. Die Anlaufzeit ---------- */
console.log('\nAnlaufzeit (audioLatenz):');
{
  const B = rein();
  ok(B.audioLatenz() === 0, 'ohne Messung 0 — die Pause wird eher länger als zu kurz');
  [0.1, 0.5, 0.12].forEach(B.audioLatenzMerken);
  ok(nah(B.audioLatenz(), 0.12, 1e-9), 'Median, nicht Mittelwert: ein Ausreißer zieht nicht');
  const C = rein();
  [0.9, 0.8, 0.7, 5].forEach(C.audioLatenzMerken);
  ok(nah(C.audioLatenz(), 0.3, 1e-9), 'höchstens 0,3 s; ein Wert über 2 s wird verworfen');
}

/* ---------- 4. Zwei Elemente: ausklingen statt anhalten ---------- */
console.log('\nZwei Elemente beim vorgezogenen Übergang (audioSpiele … { frueh: true }):');
const TEILE = [
  schneide('audioBaue'), schneide('audioElement'), schneide('audioAnderes'),
  schneide('audioVorladen'), schneide('audioSpiele', true), schneide('audioAus'),
  schneide('audioNaechster'), schneide('audioAdresse'), schneide('audioVersZahl'),
  schneide('schleifeGilt'), schneide('audioFolgeVers'), schneide('audioStartPos'),
  schneide('audioVornBehalten'), schneide('audioLatenz'), schneide('audioPauseZiel'),
  schneide('audioUebergangWeg')
].join('\n');
const KONST2 = src.match(/\nconst QAUDIO = \{[^\n]*\n/)[0] + src.match(/\nconst QSCHLEIFE = \{[^\n]*\n/)[0]
  + konst('QAUDIO_SCHNELL') + konst('QAUDIO_LANGE') + konst('QAUDIO_VORLAUF') + konst('QLATENZ')
  + "\nconst QURAN_AUDIO_BASIS = 'https://verses.quran.com/';\n";

function umgebung(teile = TEILE, stille = {}){
  const geladen = [];
  let nr = 0;
  class Audio {
    constructor(){ this.nr = ++nr; this._src = ''; this.paused = true; this.ended = false; this.currentTime = 0; this.duration = 10; this.error = null; this._h = {}; }
    get src(){ return this._src; }
    set src(v){ if (v !== this._src){ this._src = v; geladen.push([this.nr, v.slice(-10)]);
      if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } } }
    addEventListener(n, f, o){ (this._h[n] = this._h[n] || []).push({ f, once: !!(o && o.once) }); }
    dispatchEvent(ev){ const l = this._h[ev.type] || []; this._h[ev.type] = l.filter(x => !x.once); l.forEach(x => x.f(ev)); return true; }
    play(){ this.paused = false; this.ended = false; this.dispatchEvent({ type: 'play' }); return Promise.resolve(); }
    pause(){ if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } }
    load(){ this.error = null; if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } }
    removeAttribute(a){ if (a === 'src') this._src = ''; }
  }
  const ctx = {
    Audio, console, Math, Number, setTimeout, clearTimeout, Promise,
    audioWacheAn(){}, audioWacheAus(){},
    rezitatorVon: id => ({ id, pfad: 'Alafasy/mp3/', pause: P_AFASY }), quranRezitator: () => 7,
    VERSE_CACHE: { 67: new Array(30).fill(0) }, OFFENE_SURE: 67, GEH: { an: false },
    markiereLaufendenVers(){}, wortModusVorbereiten(){}, quranStilleAn(){}, quranStilleAus(){},
    quranMedienKnoepfe(){}, quranMedienInfo(){}, quranMedienPosition(){}, zeigeSpieler(){},
    wortUhrStop(){}, markeWeg(){}, cancelAnimationFrame(){}, QW_LETZTES: -1, QW_UHR: null,
    document: { visibilityState: 'visible' },
    /* Die Messung selbst braucht fetch und Web Audio — hier vorgegeben. */
    audioStilleBekannt: url => stille[url.slice(-10)] || null
  };
  vm.createContext(ctx);
  vm.runInContext(KONST2 + teile + '\nthis.API = { audioSpiele, audioAus, QAUDIO };', ctx);
  return { api: ctx.API, geladen };
}
const warte = () => new Promise(r => setTimeout(r, 0));
{
  const u = umgebung(TEILE, { '067001.mp3': { vorn: 0.1, hinten: 1.0, dauer: 10 },
                              '067002.mp3': { vorn: 1.69, hinten: 0.6, dauer: 12 } });
  await u.api.audioSpiele(67, 1);
  const alt = u.api.QAUDIO.el;
  ok(u.geladen.some(([, d]) => d === '067002.mp3'), 'Vers 2 liegt vorgeladen im anderen Element');
  await u.api.audioSpiele(67, 2, { frueh: true });
  const neu = u.api.QAUDIO.el;
  ok(neu !== alt, 'Vers 2 spielt aus dem anderen Element');
  ok(!alt.paused, 'Vers 1 wird NICHT angehalten — sein Nachhall klingt aus');
  ok(u.api.QAUDIO.auslauf === alt, 'als ausklingend vermerkt');
  ok(nah(neu.currentTime, 1.64, 0.001), 'Vers 2 beginnt an seiner ersten Silbe (1,69 s − 50 ms), nicht bei 0');
  const vorher = u.geladen.length;
  await warte();
  ok(u.geladen.length === vorher, 'das ausklingende Element wird NICHT sofort neu beladen');
  alt.paused = true; alt.ended = true;
  alt.dispatchEvent({ type: 'pause' }); alt.dispatchEvent({ type: 'ended' });
  await warte();
  ok(u.geladen.length === vorher + 1 && u.geladen[u.geladen.length - 1][1] === '067003.mp3',
     'erst nach seinem Ende lädt es Vers 3 vor');
  ok(u.api.QAUDIO.el === neu && u.api.QAUDIO.vers === 2, 'das `ended` des alten Verses schaltet NICHT weiter');
  u.api.audioAus();
}
{
  const u = umgebung();
  await u.api.audioSpiele(67, 1);
  const alt = u.api.QAUDIO.el;
  await u.api.audioSpiele(67, 2);
  ok(alt.paused, 'ohne `frueh` (Weiterblättern, `ended`) wird der alte Vers angehalten wie bisher');
  ok(u.geladen[u.geladen.length - 1][1] === '067003.mp3', 'und Vers 3 sofort vorgeladen');
  ok(u.api.QAUDIO.auslauf === null, 'kein ausklingendes Element vermerkt');
  u.api.audioAus();
}

/* ---------- 5. Störtests ---------- */
console.log('\nStörtests:');
{
  const ohneSchutz = REIN.replace('return Math.max(t, letzteSilbe);', 'return t;');
  ok(ohneSchutz !== REIN, 'Schutzzeile „nie vor der letzten Silbe" ließ sich herausnehmen');
  const S = rein(ohneSchutz);
  const t = S.audioUebergangZeit({ vorn: 0.1, hinten: 0.98, dauer: 10.73 }, { vorn: 0.1 }, 2.0, P_AFASY);
  ok(!nah(t, 9.75, 0.001), 'ohne sie startete der nächste Vers MITTEN in der Stimme (' + (t && t.toFixed(2)) + ' s) — der Test sieht das');
}
{
  /* Elias' Wahl zurückgenommen: mit den alten 4,07 s bei ʿAbd al-Bāsiṭ muss
     dieser Test rot werden — sonst bewacht er seinen Satz nicht. */
  const alt = src.replace("pfad: 'AbdulBaset/Mujawwad/mp3/', pause: 0.42", "pfad: 'AbdulBaset/Mujawwad/mp3/', pause: 4.07");
  ok(alt !== src, 'ʿAbd al-Bāsiṭ ließ sich auf die alten 4,07 s zurückstellen');
  const m = alt.match(/pfad: 'AbdulBaset\/Mujawwad\/mp3\/', pause: ([\d.]+)/);
  const p = m ? Number(m[1]) : NaN;
  const b1 = { vorn: 2.04, hinten: 1.78, dauer: 20.64 }, b2 = { vorn: 2.86, hinten: 1.75, dauer: 12.83 };
  ok(p !== 0.42 && A.audioUebergangZeit(b1, b2, 0.139, p) === null,
     'mit 4,07 s zöge bei ihm nichts vor (' + p + ') — die Proben oben sähen das');
}
{
  const ohneAuslauf = TEILE.replace('if (frueh && !alt.paused) QAUDIO.auslauf = alt;\n      else { try { alt.pause(); }', 'if (false) QAUDIO.auslauf = alt;\n      else { try { alt.pause(); }');
  ok(ohneAuslauf !== TEILE, 'Ausklingen ließ sich herausnehmen');
  const u = umgebung(ohneAuslauf);
  await u.api.audioSpiele(67, 1);
  const alt = u.api.QAUDIO.el;
  await u.api.audioSpiele(67, 2, { frueh: true });
  ok(alt.paused, 'ohne es würde der Nachhall wieder abgeschnitten — der Test sieht das');
  u.api.audioAus();
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Fehler.' : '✅ Übergang zwischen zwei Ayat stimmt.');
process.exit(fehler ? 1 : 0);
