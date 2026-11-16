/* test-taugt-nicht.mjs — bewacht: EIN Tippen auf „Taugt nicht — bitte ersetzen" genügt.
 *
 * Elias am 05.10.2026, wörtlich: „bei dem knopf taugt nicht bitte ersetzten da muss ich
 * immer zwei mal drauf drücken bis er wirklicih das macht, das soll nur einmal sein".
 *
 * Die Ursache stand in js/kern.js: die ANZEIGE des Knopfs fragte nach dem TEXT
 * (istVorschlagVerworfen), der SCHALTER schaltete nach der NUMMER
 * (schalteVorschlagWeg). Lag an der Nummer noch die Ablehnung eines alten, inzwischen
 * ersetzten Textes, löschte das erste Tippen nur diesen Eintrag — zu sehen war nichts.
 *
 * Geprüft wird am ECHTEN Quelltext: die zwei Funktionen und ihr Speicher aus js/kern.js,
 * der Klick-Handler des Knopfs aus js/lernen.js (per Klammerzählung geschnitten, nichts
 * nachgebaut). Zwei Störtests belegen, dass der Test rot werden kann:
 *   S1  die alte Fassung des Schalters (nach Nummer) — Fall A und der Handler fallen durch
 *   S2  Zurücknehmen nur an der eigenen Nummer — Fall D (wandernde Marke) fällt durch
 *
 *   node test-taugt-nicht.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const KERN = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');
const LERNEN = fs.readFileSync(path.join(WURZEL, 'js', 'lernen.js'), 'utf8');

/* Klammerbilanz ab der ersten `{` hinter `anfang` — gibt das Stück samt Klammern zurück. */
function block(text, anfang){
  let i = text.indexOf('{', anfang), tiefe = 0;
  const von = i;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(von, i + 1); }
  }
  return null;
}
function funktionAus(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) throw new Error(name + '() nicht gefunden');
  return text.slice(a, text.indexOf('{', a)) + block(text, a);
}

/* Der Handler des Knopfs aus js/lernen.js. */
const MARKE = "document.getElementById('btnVorschlagWeg').addEventListener('click'";
const hAnfang = LERNEN.indexOf(MARKE);
if (hAnfang < 0){ console.log('✘ Der Klick-Handler von btnVorschlagWeg steht nicht mehr in js/lernen.js.'); process.exit(1); }
const HANDLER = block(LERNEN, hAnfang);

const ALTE_FASSUNG = `function schalteVorschlagWeg(id, nr, text){
  const schl = String(nr);
  const e = VORSCHLAG_WEG[id] || {};
  if (e[schl]) { delete e[schl]; }
  else { e[schl] = { text: String(text || '').slice(0, 400), zeit: Date.now() }; }
  if (Object.keys(e).length) VORSCHLAG_WEG[id] = e; else delete VORSCHLAG_WEG[id];
  LS.set(VORSCHLAG_WEG_SCHLUESSEL, VORSCHLAG_WEG);
  return !!(VORSCHLAG_WEG[id] && VORSCHLAG_WEG[id][schl]);
}`;

/* Die Fassung des Handlers bis zum 16.11.2026 (Umschalten, Marke, Blättern) — Störtest S3. */
const ALTER_HANDLER = `{
  const w = SESSION.words[SESSION.idx];
  if (!w || !VORSCHLAEGE.length) return;
  const jetztWeg = schalteVorschlagWeg(w.id, VORSCHLAG_NR, VORSCHLAEGE[VORSCHLAG_NR]);
  if (jetztWeg && VORSCHLAEGE.length > 1) blaettereVorschlag(1);
  else zeigeVorschlag();
}`;
const SICHTBAR = funktionAus(LERNEN, 'sichtbareVorschlaege') + '\n' + funktionAus(LERNEN, 'sichtbarerVorschlagPos');

/* Baut eine frische Umgebung. `schalter` = Quelltext der Schalter-Funktion (echt oder Störfassung). */
function umgebung(schalter, handler = HANDLER, sicht = SICHTBAR){
  const ctx = vm.createContext({
    LS: { _d: {}, get(k, f){ return k in this._d ? this._d[k] : f; }, set(k, v){ this._d[k] = JSON.parse(JSON.stringify(v)); } },
    Date, JSON, Object, String, Number, Array, console
  });
  const von = KERN.indexOf('const VORSCHLAG_WEG_SCHLUESSEL'), bis = KERN.indexOf('function istVorschlagVerworfen', von);
  if (von < 0 || bis < 0) throw new Error('Der Speicher der Ablehnungen steht nicht mehr an seiner Stelle in js/kern.js.');
  vm.runInContext(KERN.slice(von, bis).replace(/^const |^let /gm, 'globalThis.'), ctx);
  vm.runInContext(funktionAus(KERN, 'istVorschlagVerworfen'), ctx);
  vm.runInContext(schalter, ctx);
  vm.runInContext(`
    globalThis.SESSION = { words: [{ id: 'w1' }], idx: 0 };
    globalThis.VORSCHLAEGE = []; globalThis.VORSCHLAG_NRN = []; globalThis.VORSCHLAG_NR = 0;
    globalThis.geblaettert = []; globalThis.gezeigt = 0; globalThis.versteckt = false;
    globalThis.gewaehlt = null; globalThis.karteNeu = 0; globalThis.meldung = '';
    globalThis.VOLL = [];
    function blaettereVorschlag(n){ geblaettert.push(n); }
    function zeigeVorschlag(){ gezeigt++; }
    function setzeGewaehltenVorschlag(id, nr){ gewaehlt = nr; }
    function gewaehlterVorschlag(id, n){ return (gewaehlt > 0 && gewaehlt < n) ? gewaehlt : 0; }
    function vorschlagsListe(w){ return VOLL; }
    function renderNotiz(){ karteNeu++; }
    function toast(t){ meldung = t; }
    const document = { getElementById(){ return { classList: { add(k){ if (k === 'hidden') versteckt = true; } } }; } };
    ${sicht}
    function tippe() ${handler}
  `, ctx);
  const lauf = code => vm.runInContext(code, ctx);
  return {
    setze(stand){ lauf('VORSCHLAG_WEG = ' + JSON.stringify(stand)); },
    stand(){ return JSON.parse(lauf('JSON.stringify(VORSCHLAG_WEG)')); },
    gespeichert(){ return JSON.parse(JSON.stringify(ctx.LS._d.vt_vorschlagWeg || {})); },
    weg(nr, text){ return lauf(`istVorschlagVerworfen('w1', ${nr}, ${JSON.stringify(text)})`); },
    schalte(nr, text){ return lauf(`schalteVorschlagWeg('w1', ${nr}${text === undefined ? '' : ', ' + JSON.stringify(text)})`); },
    /* Öffnet das Fenster wie oeffneNotizEditor(): volle Liste → sichtbare Liste. */
    sichtbar(voll){ lauf(`VOLL = ${JSON.stringify(voll)}`); return JSON.parse(lauf("JSON.stringify(sichtbareVorschlaege({ id: 'w1' }))")); },
    tippe(voll, pos){
      lauf(`VOLL = ${JSON.stringify(voll)};
        VORSCHLAEGE = sichtbareVorschlaege({ id: 'w1' }).map(x => x.text);
        VORSCHLAG_NRN = sichtbareVorschlaege({ id: 'w1' }).map(x => x.nr); VORSCHLAG_NR = ${pos};
        geblaettert = []; gezeigt = 0; versteckt = false; gewaehlt = null; karteNeu = 0; meldung = '';`);
      lauf('tippe()');
      return JSON.parse(lauf(`JSON.stringify({ liste: VORSCHLAEGE, nrn: VORSCHLAG_NRN, pos: VORSCHLAG_NR, geblaettert,
        gezeigt, versteckt, gewaehlt, karteNeu, meldung, sichtbarDanach: sichtbareVorschlaege({ id: 'w1' }).map(x => x.text) })`));
    }
  };
}

const ALT = 'Alter Vorschlag, den er im September abgelehnt hat.';
const NEU = 'Neuer Vorschlag, der seit der Wartung an derselben Stelle steht.';
const ANDERER = 'Ein dritter Vorschlag an einer anderen Stelle.';

/* Die Fälle. Jeder gibt eine Liste [Name, Bedingung, gemessen] zurück. */
function faelle(U){
  const r = [];
  const p = (name, bed, gemessen) => r.push([name, !!bed, gemessen]);

  /* A — SEIN FALL: an Nr. 0 liegt die Ablehnung des ALTEN Textes, heute steht dort der NEUE. */
  U.setze({ w1: { 0: { text: ALT, zeit: 1 }, 2: { text: ANDERER, zeit: 2 } } });
  p('A0 Vorbedingung: der Knopf zeigt „Taugt nicht — bitte ersetzen" (neuer Text gilt nicht als abgelehnt)', U.weg(0, NEU) === false, U.weg(0, NEU));
  const a = U.schalte(0, NEU);
  p('A1 EIN Aufruf lehnt den neuen Text ab (Rückgabe true)', a === true, a);
  p('A2 danach gilt der neue Text als abgelehnt', U.weg(0, NEU) === true, U.weg(0, NEU));
  p('A3 an Nr. 0 steht jetzt der neue Text', (U.stand().w1 || {})[0] && U.stand().w1[0].text === NEU, JSON.stringify((U.stand().w1 || {})[0]));
  p('A4 die Ablehnung an Nr. 2 ist unberührt', (U.stand().w1 || {})[2] && U.stand().w1[2].text === ANDERER, JSON.stringify((U.stand().w1 || {})[2]));
  p('A5 gespeichert ist dasselbe wie im Arbeitsspeicher', JSON.stringify(U.gespeichert()) === JSON.stringify(U.stand()), JSON.stringify(U.gespeichert()));

  /* B — nichts abgelehnt: ein Aufruf lehnt ab. */
  U.setze({});
  p('B  ohne Eintrag: ein Aufruf lehnt ab', U.schalte(1, NEU) === true && U.weg(1, NEU) === true, JSON.stringify(U.stand()));

  /* C — derselbe Text an derselben Nummer: ein Aufruf nimmt zurück. */
  U.setze({ w1: { 1: { text: NEU, zeit: 3 } } });
  p('C  abgelehnt, gleicher Text: ein Aufruf nimmt zurück, das Wort hat keinen Eintrag mehr', U.schalte(1, NEU) === false && U.weg(1, NEU) === false && !U.stand().w1, JSON.stringify(U.stand()));

  /* D — die Marke ist mit dem Text gewandert: abgelehnt unter Nr. 2, heute steht der Text an Nr. 0. */
  U.setze({ w1: { 2: { text: NEU, zeit: 4 }, 1: { text: ANDERER, zeit: 5 } } });
  p('D0 Vorbedingung: der Knopf zeigt „gemerkt ✓" (die Marke wandert mit dem Text)', U.weg(0, NEU) === true, U.weg(0, NEU));
  const d = U.schalte(0, NEU);
  p('D1 EIN Aufruf nimmt die Ablehnung zurück (Rückgabe false)', d === false, d);
  p('D2 danach gilt der Text nirgends mehr als abgelehnt', U.weg(0, NEU) === false && U.weg(2, NEU) === false, JSON.stringify(U.stand()));
  p('D3 die andere Ablehnung (Nr. 1) ist unberührt', (U.stand().w1 || {})[1] && U.stand().w1[1].text === ANDERER, JSON.stringify(U.stand()));

  /* E — ganz alter Eintrag ohne Text an der Nummer: gilt als abgelehnt, ein Aufruf nimmt zurück. */
  U.setze({ w1: { 0: { zeit: 6 } } });
  p('E  alter Eintrag ohne Text: ein Aufruf nimmt zurück', U.weg(0, NEU) === true && U.schalte(0, NEU) === false && U.weg(0, NEU) === false, JSON.stringify(U.stand()));

  /* G — ohne Text gefragt: Umschalten nach Nummer, wie für alte Aufrufer. */
  U.setze({});
  const g1 = U.schalte(3), g2 = U.schalte(3);
  p('G  ohne Text: erst abgelehnt, dann zurückgenommen', g1 === true && g2 === false, g1 + ' / ' + g2);

  /* V — was angezeigt wird (17.11.2026, Elias: „die alte darf nicht wieder angezeigt werden"). */
  U.setze({ w1: { 0: { text: ALT, zeit: 1 }, 2: { text: ANDERER, zeit: 2 } } });
  const v = U.sichtbar([NEU, 'zweiter', ANDERER]);
  p('V1 ein abgelehnter Text steht nicht in der sichtbaren Liste, mit seiner Nummer der vollen Liste', JSON.stringify(v) === JSON.stringify([{ text: NEU, nr: 0 }, { text: 'zweiter', nr: 1 }]), JSON.stringify(v));
  U.setze({ w1: { 5: { text: 'zweiter', zeit: 3 } } });
  p('V2 die Marke wandert mit dem Text: auch unter anderer Nummer abgelehnt → nicht sichtbar', U.sichtbar([NEU, 'zweiter']).length === 1, JSON.stringify(U.sichtbar([NEU, 'zweiter'])));

  /* H — der ECHTE Klick-Handler: EIN Tippen nimmt den Vorschlag SOFORT weg. */
  U.setze({ w1: { 0: { text: ALT, zeit: 1 } } });
  const h = U.tippe([NEU, ANDERER, 'noch einer'], 0);
  p('H1 ein Tippen: der Vorschlag ist sofort aus dem Fenster, der nächste steht da', JSON.stringify(h.liste) === JSON.stringify([ANDERER, 'noch einer']) && h.pos === 0 && h.gezeigt === 1, JSON.stringify(h));
  p('H2 … dauerhaft abgelehnt (gespeichert) und nach dem Wiederöffnen nicht mehr sichtbar', U.weg(0, NEU) === true && U.gespeichert().w1 && U.gespeichert().w1[0].text === NEU && h.sichtbarDanach.indexOf(NEU) < 0, JSON.stringify({ g: U.gespeichert(), s: h.sichtbarDanach }));
  p('H3 … die Wahl zeigt auf den nächsten (Nummer der VOLLEN Liste), die Karte wird neu gezeichnet, Meldung kommt', h.gewaehlt === 1 && h.karteNeu === 1 && /entfernt/.test(h.meldung), JSON.stringify(h));
  U.setze({ w1: { 0: { text: NEU, zeit: 1 } } });
  const h2 = U.tippe([NEU, ANDERER, 'dritter'], 1);
  p('H4 letzter in der Reihe: Wahl springt rundherum auf den ersten sichtbaren', JSON.stringify(h2.liste) === JSON.stringify([ANDERER]) && h2.pos === 0 && h2.gewaehlt === 1 && U.weg(2, 'dritter') === true, JSON.stringify(h2));
  U.setze({});
  const h3 = U.tippe([NEU], 0);
  p('H5 einziger Vorschlag: abgelehnt, Kasten verschwindet, nichts mehr sichtbar', h3.liste.length === 0 && h3.versteckt && U.weg(0, NEU) === true && h3.sichtbarDanach.length === 0, JSON.stringify(h3));
  return r;
}

let schlecht = 0;
console.log('— Der echte Quelltext —');
for (const [name, ok, gemessen] of faelle(umgebung(funktionAus(KERN, 'schalteVorschlagWeg')))){
  if (ok) console.log('  ✔ ' + name);
  else { schlecht++; console.log('  ✘ ' + name + '   gemessen: ' + gemessen); }
}

/* ---------- Störtests: kann dieser Test rot werden? ---------- */
console.log('\n— Störtests —');
function stoertest(name, schalter, mussFallen, handler, sicht){
  const rot = faelle(umgebung(schalter, handler, sicht)).filter(([, ok]) => !ok).map(([n]) => n.slice(0, 2));
  const fehlt = mussFallen.filter(k => !rot.includes(k));
  if (!fehlt.length) console.log(`  ✔ ${name}: fällt durch bei ${rot.join(', ')}`);
  else { schlecht++; console.log(`  ✘ ${name}: sollte bei ${mussFallen.join(', ')} durchfallen, rot war nur: ${rot.join(', ') || 'nichts'}`); }
}
stoertest('S1 alte Fassung (Schalten nach Nummer)', ALTE_FASSUNG, ['A1', 'A2']);
stoertest('S3 alter Handler bis 16.11.2026 (Marke statt weg)', funktionAus(KERN, 'schalteVorschlagWeg'), ['H1', 'H3', 'H5'], ALTER_HANDLER);
{
  const ohneFilter = SICHTBAR.replace('istVorschlagVerworfen(w.id, nr, text)) return;', 'false) return;');
  if (ohneFilter === SICHTBAR){ schlecht++; console.log('  ✘ S4: Stelle nicht gefunden — Störtest wirkungslos.'); }
  else stoertest('S4 sichtbare Liste ohne Filter (abgelehnte bleiben stehen)', funktionAus(KERN, 'schalteVorschlagWeg'), ['V1', 'V2', 'H2', 'H5'], HANDLER, ohneFilter);
}
{
  const echt = funktionAus(KERN, 'schalteVorschlagWeg');
  const nurEigeneNummer = echt.replace("(mitText && String(x.text).slice(0, 400) === kurz) || (k === schl && !mitText)", "k === schl");
  if (nurEigeneNummer === echt){ schlecht++; console.log('  ✘ S2: die Stelle für den Störtest steht nicht mehr so im Quelltext — Störtest wirkungslos.'); }
  else stoertest('S2 Zurücknehmen nur an der eigenen Nummer', nurEigeneNummer, ['D1', 'D2']);
}

console.log(schlecht ? `\n✘ ${schlecht} Fehler.` : '\n✔ Ein Tippen genügt — alle Fälle und beide Störtests in Ordnung.');
process.exit(schlecht ? 1 : 0);
