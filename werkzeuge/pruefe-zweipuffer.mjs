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
  schneide('schleifeGilt'), schneide('audioFolgeVers')
].join('\n');
const KONST = src.match(/\nconst QAUDIO = \{[^\n]*\n/)[0] + src.match(/\nconst QSCHLEIFE = \{[^\n]*\n/)[0]
            /* Die Geduld beim Neuversuch (19.09.2026) — echte Werte, nicht
               nachgeschrieben: sonst prüfte der Test seine eigene Zahl. */
            + src.match(/\nconst QAUDIO_SCHNELL = \d+;\n/)[0]
            + src.match(/\nconst QAUDIO_LANGE = \d+;\n/)[0]
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
function baueUmgebung(teile = TEILE){
  const geladen = [];         /* [element-nr, datei] je neuem src */
  const gespielt = [];        /* [element-nr, datei] je play()      */
  const stilleAus = [];       /* jedes Abschalten der stillen Schleife */
  let nr = 0;
  class Audio {
    /* `error` gehoert dazu: ein vorgeladenes Element kann die richtige Adresse
       tragen und trotzdem kaputt sein — genau der Fall vom 19.09.2026. `load()`
       raeumt ihn, wie im Browser. */
    constructor(){ this.nr = ++nr; this._src = ''; this.paused = true; this.currentTime = 0; this.preload = ''; this.error = null; this._h = {}; }
    get src(){ return this._src; }
    /* ⛔ Wie im Browser: eine neue Quelle HAELT DAS ELEMENT AN und feuert
       `pause`. Genau daran starb die stille Schleife bis zum 19.09.2026 — ein
       Doppel ohne dieses Ereignis haette den Fehler nie zeigen koennen.
       [[pruefung_fragt_einen_stellvertreter_ab]] */
    set src(v){ if (v !== this._src){ this._src = v; geladen.push([this.nr, v.slice(-10)]);
      if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } } }
    addEventListener(n, f){ (this._h[n] = this._h[n] || []).push(f); }
    dispatchEvent(ev){ (this._h[ev.type] || []).forEach(f => f(ev)); return true; }
    play(){ this.paused = false; this.ended = false; gespielt.push([this.nr, this._src.slice(-10)]); this.dispatchEvent({ type: 'play' }); return Promise.resolve(); }
    pause(){ if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } }
    load(){ this.error = null; if (!this.paused){ this.paused = true; this.dispatchEvent({ type: 'pause' }); } }
    removeAttribute(a){ if (a === 'src') this._src = ''; }
  }
  const ctx = {
    Audio, console,
    /* Die Stillstands-Wache haengt an Zeitgebern und ist hier nicht die Sache —
       sie hat ihren eigenen Abschnitt weiter unten. */
    audioWacheAn(){}, audioWacheAus(){},
    setTimeout, clearTimeout,
    /* alles, was audioSpiele ausserhalb der Sache beruehrt, als leere Huelle */
    rezitatorVon: id => ({ id, pfad: 'Alafasy/mp3/' }),
    quranRezitator: () => 7,
    VERSE_CACHE: { 67: new Array(30).fill(0) },
    OFFENE_SURE: 67,
    GEH: { an: false },
    markiereLaufendenVers(){}, wortModusVorbereiten(){}, quranStilleAn(){},
    /* ⛔ Mitzaehlen statt leer schlucken: ob die stille Schleife beim
       VERSWECHSEL ausgeht, ist seit dem 19.09.2026 genau die Frage. */
    quranStilleAus(){ stilleAus.push(1); },
    quranMedienKnoepfe(){}, quranMedienInfo(){}, quranMedienPosition(){}, zeigeSpieler(){},
    wortUhrStop(){}, markeWeg(){}, cancelAnimationFrame(){},
    QW_LETZTES: -1, QW_UHR: null,
    document: { visibilityState: 'visible' }
  };
  vm.createContext(ctx);
  vm.runInContext(KONST + teile + '\nthis.API = { audioSpiele, audioNaechster, audioAus, QAUDIO, QSCHLEIFE };', ctx);
  return { api: ctx.API, geladen, gespielt, stilleAus };
}

/* Versende ausloesen wie der Browser — und der feuert ERST `pause`, DANN
   `ended`. ⛔⛔ Bis zum 20.09.2026 kam hier nur `ended`. Elias' Handy hat es
   gezeigt (Ton-Protokoll, 03:04:19): „A* pause rs4 t10.7" und 29 ms später
   „A* ended". Die App hielt dieses `pause` für ein Anhalten und schaltete die
   stille Schleife ab — genau in der Lücke, die sie überbrücken soll. Dieses
   Doppel konnte das nie zeigen, weil es das Ereignis nicht kannte.
   [[pruefung_fragt_einen_stellvertreter_ab]] */
async function versEnde(u){
  const el = u.api.QAUDIO.el;
  el.paused = true; el.ended = true;
  el.dispatchEvent({ type: 'pause' });
  el.dispatchEvent({ type: 'ended' });
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
      audioWacheAn(){}, audioWacheAus(){}, setTimeout, clearTimeout,
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

/* ==================== Der Verswechsel ist keine Pause ====================
   (19.09.2026) Elias: „wenn ich einen rezitator spielen lasse, dass er immer
   wieder aufhört und nicht durch spricht … Vorallem wenn ich meinen Bildschirm
   aus mache". `src` und `load()` feuern ein `pause`; der Handler schaltete
   daraufhin die stille Schleife ab — genau in der Luecke, die sie ueberbruecken
   soll. Ohne sie verliert die verborgene Seite ihre Mediensitzung. */
console.log('\nVerswechsel bei ausgeschaltetem Bildschirm:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 1);
  await versEnde(u);                       /* Vers 2 aus dem anderen Element */
  const vorher = u.stilleAus.length;
  await u.api.audioSpiele(67, 9);          /* Sprung: dasselbe Element, neues src */
  pruefe('die stille Schleife bleibt beim Wechsel an', vorher, u.stilleAus.length);
  /* Und die Gegenprobe: ein ECHTES Anhalten wird nicht verschluckt. */
  u.api.QAUDIO.el.pause();
  pruefe('ein echtes Anhalten schaltet sie sehr wohl ab', vorher + 1, u.stilleAus.length);
}

/* ---------- Das natuerliche Versende (20.09.2026, auf seinem Handy gemessen) ----------
   Elias: „es liefen so ca 3 verse bis es jetzt aufgehört hat bei geschlossenem
   display zu spielen" — „dann steht da nichts". Sein Ton-Protokoll: am Versende
   kommt `pause` VOR `ended`, die App schaltete darauf die stille Schleife ab,
   und fuer einen Augenblick spielte in der Seite nichts mehr. */
console.log('\nDas natuerliche Versende ist keine Pause:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 1);
  const vorher = u.stilleAus.length;
  await versEnde(u);                       /* `pause`, dann `ended` — wie der Browser */
  pruefe('die stille Schleife bleibt ueber das Versende hinweg an', vorher, u.stilleAus.length);
  pruefe('… und Vers 2 laeuft', '067002.mp3', u.gespielt[u.gespielt.length - 1][1]);
  u.api.QAUDIO.el.pause();
  pruefe('ein echtes Anhalten danach wird nicht verschluckt', vorher + 1, u.stilleAus.length);

  const ohneEnde = TEILE.replace(/\n\s*if \(el\.ended\) return;\n/, '\n');
  if (ohneEnde === TEILE){
    console.log('  X  „if (el.ended) return;" liess sich nicht herausschneiden — Stoertest wirkungslos.');
    fehler++;
  } else {
    const s = baueUmgebung(ohneEnde);
    await s.api.audioSpiele(67, 1);
    const davor = s.stilleAus.length;
    await versEnde(s);
    pruefe('Stoertest: ohne die Abfrage geht sie am Versende aus', true, s.stilleAus.length > davor);
  }
}

/* ---------- Stoertest: ohne die Marke stirbt die Schleife wieder ---------- */
{
  const ohneMarke = TEILE.replace(/\n\s*if \(QAUDIO\.wechsel\) return;\n/, '\n');
  if (ohneMarke === TEILE){
    console.log('  X  Die Marke liess sich nicht herausschneiden — Stoertest wirkungslos.');
    fehler++;
  } else {
    const u = baueUmgebung(ohneMarke);
    await u.api.audioSpiele(67, 1);
    await versEnde(u);
    const vorher = u.stilleAus.length;
    await u.api.audioSpiele(67, 9);
    pruefe('ohne die Marke geht sie mitten im Wechsel aus', true, u.stilleAus.length > vorher);
  }
}

/* ============== Ein kaputt vorgeladener Vers (19.09.2026) ================
   Das Vorladen laeuft ueber das Netz und scheitert unterwegs staendig. Dann
   trug das andere Element die richtige Adresse und eine kaputte Datei —
   verglichen wurde nur `src`, und jedes play() darauf wurde abgewiesen. */
console.log('\nDas vorgeladene Element ist kaputt:');
{
  const u = baueUmgebung();
  await u.api.audioSpiele(67, 1);
  const b = u.api.QAUDIO.paar.find(e => e !== u.api.QAUDIO.el);
  b.error = { code: 4 };                   /* Netzabriss beim Vorladen */
  await versEnde(u);
  pruefe('es wird NICHT das spielende Element', false, u.api.QAUDIO.el === b);
  pruefe('und Vers 2 laeuft trotzdem',        2, u.api.QAUDIO.vers);
}

/* ---------- Stoertest: ohne die Fehlerabfrage uebernimmt er es ---------- */
{
  const ohnePruefung = TEILE.replace('if (b.src === url && !b.error){', 'if (b.src === url){');
  if (ohnePruefung === TEILE){
    console.log('  X  Die Fehlerabfrage liess sich nicht herausschneiden — Stoertest wirkungslos.');
    fehler++;
  } else {
    const u = baueUmgebung(ohnePruefung);
    await u.api.audioSpiele(67, 1);
    const b = u.api.QAUDIO.paar.find(e => e !== u.api.QAUDIO.el);
    b.error = { code: 4 };
    await versEnde(u);
    pruefe('ohne sie wird das kaputte Element gestartet', true, u.api.QAUDIO.el === b);
  }
}

/* ============== Die Stillstands-Wache (19.09.2026) =======================
   Laeuft der Puffer mitten im Vers leer, kommt KEIN `ended`, KEIN `error`,
   KEIN `pause`. Die App haelt sich fuer laufend — und es kommt nichts mehr.
   Die Wache ist die einzige Stelle, an der das auffallen kann. */
console.log('\nDer Ton steht still, und nichts meldet es:');
function wacheLauf(quelle, schritte){
  const geholt = [];
  const el = { currentTime: 0, paused: false };
  const ctx = {
    QAUDIO: { el, sure: 67, vers: 1, laeuft: true, hinweis: '', wechsel: false },
    QAUDIO_STAND: { zeit: -1, seit: 0 },
    QAUDIO_WACHE_TAKT: 2000, QAUDIO_STILLSTAND: 6000,
    zeigeSpieler(){},
    audioNachladen(pos){ geholt.push(pos); }
  };
  vm.createContext(ctx);
  vm.runInContext(quelle + '\nthis.TICK = audioWacheTick;', ctx);
  for (const s of schritte){ el.currentTime = s; ctx.TICK(); }
  return { geholt, hinweis: ctx.QAUDIO.hinweis };
}
const TICK = schneide('audioWacheTick');
{
  const laeuft = wacheLauf(TICK, [1, 2, 3, 4, 5, 6]);
  pruefe('laeuft der Ton, passiert gar nichts', { geholt: [], hinweis: '' },
    { geholt: laeuft.geholt, hinweis: laeuft.hinweis });
  /* Erster Aufruf setzt den Stand, ab dem zweiten steht er: 2 s, 4 s … */
  const kurz = wacheLauf(TICK, [3, 3, 3]);
  pruefe('nach 2 Sekunden Stillstand: „Puffert …"', 'Puffert …', kurz.hinweis);
  pruefe('… aber noch nichts neu geholt',           [], kurz.geholt);
  const lang = wacheLauf(TICK, [3, 3, 3, 3]);
  pruefe('nach 6 Sekunden wird derselbe Vers neu geholt', [3], lang.geholt);
  const wieder = wacheLauf(TICK, [3, 3, 4, 5]);
  pruefe('kommt er von selbst wieder, bleibt es dabei', [], wieder.geholt);
  pruefe('und der Hinweis verschwindet',                 '', wieder.hinweis);
}
/* ---------- Stoertest: ohne das Nachholen bleibt es stehen ---------- */
{
  const ohne = TICK.replace(/\n\s*if \(QAUDIO_STAND\.seit >= QAUDIO_STILLSTAND\)\{[^\n]*\n/, '\n');
  if (ohne === TICK){
    console.log('  X  Das Nachholen liess sich nicht herausschneiden — Stoertest wirkungslos.');
    fehler++;
  } else {
    const l = wacheLauf(ohne, [3, 3, 3, 3, 3, 3]);
    pruefe('ohne sie steht der Ton bis in alle Ewigkeit', [], l.geholt);
  }
}

console.log('\n' + (fehler ? 'FEHLER: ' + fehler
  : 'Kein Vers braucht am Start einen neuen Ladevorgang — die Rezitation laeuft im Hintergrund durch.'));
process.exit(fehler ? 1 : 0);
