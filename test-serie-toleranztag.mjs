/* test-serie-toleranztag.mjs — bewacht den Toleranztag der Serie und die
 * 8-Uhr-Grenze in js/kern.js (14.09.2026).
 *
 * ⭐ Was hier bewacht wird, ist zuerst eine ENTSCHEIDUNG VON ELIAS, nicht eine
 * Rechnung. Am 14.09.2026 hat er die Sperrfrist aufgehoben, die den Gnadentag
 * auf einmal pro Woche begrenzte — vorgelegt bekam er „Sperre bleibt: 1x pro
 * Woche", „1x pro Monat" und „Sperre weg: gilt immer", samt der Folge, dass
 * dauerhaft jeder zweite Tag die Serie wachsen laesst. Er hat „Sperre weg"
 * gewaehlt.
 *
 * ⛔ Genau das ist die Stelle, die bei der naechsten Aufraeumrunde als
 * „unvernuenftig" wieder eingebaut wird — sie SIEHT ja aus wie ein fehlender
 * Schutz. Deshalb steht Fall 3 hier: er faellt um, sobald jemand eine
 * Sperrfrist zurueckbringt. [[wirkung_an_der_quelle_stilllegen]]
 *
 * ⭐ Und die Gegenrichtung zaehlt mit: eine Serie, die NIE abreisst, saehe
 * genauso „richtig" aus wie eine, die korrekt rechnet. Fall 2 prueft deshalb,
 * dass zwei ausgelassene Tage weiterhin hart auf 1 zurueckwerfen.
 * [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

/* Aus dem echten Quelltext schneiden, nicht nachbauen. */
function schneide(text, name){
  const anfang = text.indexOf('function ' + name + '(');
  if (anfang < 0) return null;
  let i = text.indexOf('{', anfang), tiefe = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') tiefe++;
    else if (text[i] === '}'){ tiefe--; if (!tiefe) return text.slice(anfang, i + 1); }
  }
  return null;
}

const teile = ['touchStreak', 'getStreak', 'getUebungstage', 'uebungstageAusSerieErgaenzen']
  .map(n => [n, schneide(quelle, n)]);
const fehlend = teile.filter(([, t]) => !t).map(([n]) => n);
if (fehlend.length) { console.log('⛔ nicht gefunden: ' + fehlend.join(', ')); process.exit(1); }

/* ⭐ Falls die entfernte `gnadeVerfuegbar()` je zurueckkehrt, wird sie MIT
   geladen — obwohl Fall 4 sie gleich darauf verbietet. Das ist Absicht: ohne
   sie stirbt der Lauf gegen eine solche Fassung an einem ReferenceError, und
   ein Absturz beweist nur, dass ein Name fehlt, nicht dass falsch gerechnet
   wird. So faellt stattdessen Fall 3 — mit der Zahl daneben, die es zeigt.
   Gemessen am 14.09.2026 gegen die Fassung von HEAD: Fall 3 meldete „1" statt
   „13". [[stoertest_muss_wirkung_nachweisen]] [[leere_liste_ist_keine_messung]] */
const alteSperre = schneide(quelle, 'gnadeVerfuegbar');

/* Die 8-Uhr-Grenze aus der Quelle lesen statt sie zu wiederholen: steht dort
   eines Tages eine andere Zahl, prueft dieser Test die andere Zahl — und die
   Faelle unten rechnen mit ihr. [[zahlen_ohne_beleg]] */
const mStunde = quelle.match(/const TAG_BEGINN_STUNDE\s*=\s*(\d+)/);
if (!mStunde) { console.log('⛔ TAG_BEGINN_STUNDE nicht gefunden'); process.exit(1); }
const STUNDE = Number(mStunde[1]);
const echtesTodayStr = schneide(quelle, 'todayStr');
if (!echtesTodayStr) { console.log('⛔ todayStr nicht gefunden'); process.exit(1); }

console.log('test-serie-toleranztag.mjs — Toleranztag und Tagesbeginn\n');
console.log('  (Tagesbeginn aus der Quelle gelesen: ' + STUNDE + ' Uhr)\n');

/* ---------- Kontext: die App-Umgebung, die kern.js erwartet ---------- */
const tagPlus = (basis, n) => {
  const d = new Date(basis + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const c = {
  Date, Math, Number, JSON, String, Object, console, isNaN,
  speicher: {},
  HEUTE: '2026-09-14',
  toasts: [],
  REDUCED_MOTION: true,
  LS: {
    get(k, v){ return c.speicher[k] !== undefined ? c.speicher[k] : v; },
    set(k, v){ c.speicher[k] = v; }
  },
  toast(t){ c.toasts.push(t); },
  document: { getElementById(){ return null; } },
  todayStr(o){ return tagPlus(c.HEUTE, o || 0); }
};
vm.createContext(c);
/* ⭐ `const`/`function` im vm-Kontext sind von aussen unsichtbar — deshalb der
   Umweg ueber globalThis. [[const_ist_im_vm_kontext_unsichtbar]] */
vm.runInContext(teile.map(([, t]) => t).join('\n')
  + (alteSperre ? '\n' + alteSperre : '')
  + '\n;globalThis.__touch = touchStreak;'
  + '\n;globalThis.__kalender = uebungstageAusSerieErgaenzen;', c);
const touch = c.__touch, kalender = c.__kalender;

const setzeSerie = s => { c.speicher['vt_streak'] = s; c.toasts = []; };

/* ---------- 1. Ein ausgelassener Tag laesst die Serie stehen ---------- */
{
  c.HEUTE = '2026-09-14';
  setzeSerie({ count: 40, last: tagPlus(c.HEUTE, -2), gnadeAm: null });
  const s = touch();
  pruefe('ein Tag ausgelassen: Serie bleibt stehen', s.count === 41, s.count);
  pruefe('ein Tag ausgelassen: der Tag wird als Gnade vermerkt',
    s.gnadeAm === '2026-09-14', s.gnadeAm);
  pruefe('ein Tag ausgelassen: Elias wird es gesagt',
    c.toasts.some(t => t.includes('Serie zählt trotzdem weiter')), c.toasts.join(' | '));
}

/* ---------- 2. Zwei ausgelassene Tage reissen sie ab ---------- */
/* ⛔ Ohne diesen Fall waere eine Serie, die NIE abreisst, ein bestandener Test. */
{
  c.HEUTE = '2026-09-14';
  setzeSerie({ count: 40, last: tagPlus(c.HEUTE, -3), gnadeAm: null });
  const s = touch();
  pruefe('zwei Tage ausgelassen: Serie faellt auf 1', s.count === 1, s.count);
}

/* ---------- 3. ⭐ KEINE Sperrfrist — Elias' Entscheidung vom 14.09.2026 --- */
{
  c.HEUTE = '2026-09-14';
  /* Vorgestern ausgelassen, und schon vor zwei Tagen war eine Gnade: unter der
     alten Sieben-Tage-Sperre waere die Serie hier auf 1 gefallen. */
  setzeSerie({ count: 12, last: tagPlus(c.HEUTE, -2), gnadeAm: tagPlus(c.HEUTE, -2) });
  const s = touch();
  pruefe('zweiter Gnadentag binnen zwei Tagen: Serie bleibt stehen',
    s.count === 13, s.count);

  /* Und noch einmal am naechsten Tag — jeder zweite Tag lernen laesst die
     Serie wachsen. Genau die Folge, die ihm vorgelegt wurde. */
  c.HEUTE = '2026-09-16';
  c.toasts = [];
  const s2 = touch();
  pruefe('dritter Gnadentag binnen vier Tagen: Serie bleibt stehen',
    s2.count === 14, s2.count);
}

/* ---------- 4. Die entfernte Sperre darf nicht zurueckkommen ---------- */
{
  pruefe('gnadeVerfuegbar() ist aus dem Quelltext entfernt',
    !/function\s+gnadeVerfuegbar\s*\(/.test(quelle), 'Funktion wieder da');
  const zweig = schneide(quelle, 'touchStreak') || '';
  pruefe('touchStreak() prueft keine Sperrfrist mehr',
    !/gnadeVerfuegbar|>=\s*7|tage\s*>=/.test(zweig), 'Sperrfrist-Pruefung gefunden');
}

/* ---------- 5. ⭐ Der Tag beginnt um 8 Uhr — sein Nachtrag vom 14.09. ------ */
/* „und die frist soll dann ab 8 uhr laufen". Geprueft wird das ECHTE
   todayStr() gegen eine gestellte Uhrzeit, nicht der Stub von oben. */
{
  const zeitTest = (isoOrtszeit) => {
    const k = {
      Date: class extends Date {
        constructor(...a){ if (!a.length) super(isoOrtszeit); else super(...a); }
      },
      String, console
    };
    vm.createContext(k);
    vm.runInContext('const TAG_BEGINN_STUNDE = ' + STUNDE + ';\n' + echtesTodayStr
      + '\n;globalThis.__h = todayStr;', k);
    return k.__h(0);
  };
  pruefe('um 3:00 nachts zaehlt der Tag noch zum Vortag',
    zeitTest('2026-09-14T03:00:00') === '2026-09-13', zeitTest('2026-09-14T03:00:00'));
  pruefe('um 7:59 zaehlt der Tag noch zum Vortag',
    zeitTest('2026-09-14T07:59:00') === '2026-09-13', zeitTest('2026-09-14T07:59:00'));
  pruefe('um 8:00 beginnt der neue Tag',
    zeitTest('2026-09-14T08:00:00') === '2026-09-14', zeitTest('2026-09-14T08:00:00'));
  pruefe('um 23:30 gilt weiterhin derselbe Tag',
    zeitTest('2026-09-14T23:30:00') === '2026-09-14', zeitTest('2026-09-14T23:30:00'));
}

/* ---------- 6. ⛔ Der Kalender erfindet keine Uebungstage ---------- */
/* Die Rueckrechnung stuetzte sich auf die Sperrfrist. Ohne sie darf sie nur
   noch bis zum letzten bekannten Gnadentag laufen — alles davor ist unbekannt.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
{
  c.speicher['vt_uebungstage'] = {};
  setzeSerie({ count: 8, last: '2026-09-14', gnadeAm: '2026-09-12' });
  const tage = Object.keys(kalender()).sort();
  pruefe('Kalender bricht am ausgelassenen Tag ab (3 statt 8 Tage)',
    tage.length === 3, tage.length + ' Tage: ' + tage.join(', '));
  pruefe('Kalender traegt den ausgelassenen Tag nicht ein',
    !tage.includes('2026-09-11'), tage.join(', '));
  pruefe('Kalender traegt nichts hinter dem ausgelassenen Tag ein',
    !tage.includes('2026-09-10'), tage.join(', '));

  /* Ohne Gnadentag ist die Serie lueckenlos — dann bleibt es bei den acht. */
  c.speicher['vt_uebungstage'] = {};
  setzeSerie({ count: 5, last: '2026-09-14', gnadeAm: null });
  const tage2 = Object.keys(kalender()).sort();
  pruefe('ohne Gnadentag bleibt die Rueckrechnung vollstaendig (5 Tage)',
    tage2.length === 5, tage2.length + ' Tage: ' + tage2.join(', '));
}

/* ---------- 7. Der Erklaertext steht in der App ---------- */
/* ⛔ Der Anlass des ganzen Auftrags: beides war gebaut und fuer Elias
   unsichtbar. Faellt der Satz weg, ist die Funktion wieder nicht vorhanden. */
{
  const statistik = fs.readFileSync(path.join(WURZEL, 'js', 'statistik.js'), 'utf8');
  pruefe('der Uebungskalender erklaert den Toleranztag',
    /Lässt du einen Tag aus, läuft die Serie trotzdem weiter/.test(statistik),
    'Satz fehlt in js/statistik.js');
  pruefe('der Uebungskalender nennt den Tagesbeginn um 8 Uhr',
    /Ein Tag beginnt um 8 Uhr morgens/.test(statistik),
    'Satz fehlt in js/statistik.js');
}

/* ---------- 8. ⛔ Nur die Karteikarten schreiben die Serie fort ---------- */
/* Elias am 14.09.2026: „und die streak wird auch nur fortgesetzt wenn das
   tagesziel der karteikarten erreicht ist richtig?" — nein, eine Karte
   genuegt. Dabei kam heraus, dass Satz- und Hoermodus die Serie gar nicht
   anruehren, obwohl beide ein eigenes Tagesziel haben. Angeboten, das zu
   aendern; seine Antwort: **„nein ist gut so"**.

   ⛔ Genau so ein Befund wird spaeter als Bug gelesen und „behoben". Diese
   vier Faelle sind die Sperre davor. [[wirkung_an_der_quelle_stilllegen]]

   ⚠️ Kommentarfrei gezaehlt: seit dem 14.09. steht `touchStreak()` in
   lernen.js AUCH im Erklaerkommentar, und in uebung.js/hoeren.js steht es in
   den ⛔-Hinweisen. Ein rohes grep zaehlte diese mit und der Test waere
   sinnlos gruen — bzw. hier sogar rot.
   [[stichworttreffer_im_kommentar]] */
{
  const ohneKommentare = s => s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const zaehle = (datei, name) => {
    const t = ohneKommentare(fs.readFileSync(path.join(WURZEL, 'js', datei), 'utf8'));
    return (t.match(new RegExp(name + '\\s*\\(\\s*\\)', 'g')) || []).length;
  };
  const inLernen = zaehle('lernen.js', 'touchStreak');
  pruefe('die Serie wird genau einmal fortgeschrieben, in js/lernen.js',
    inLernen === 1, inLernen + ' Aufruf(e)');
  const inUebung = zaehle('uebung.js', 'touchStreak');
  pruefe('der Satzmodus rührt die Serie nicht an — „nein ist gut so"',
    inUebung === 0, inUebung + ' Aufruf(e) in uebung.js');
  const inHoeren = zaehle('hoeren.js', 'touchStreak');
  pruefe('der Hörmodus rührt die Serie nicht an — „nein ist gut so"',
    inHoeren === 0, inHoeren + ' Aufruf(e) in hoeren.js');
  /* ⭐ Und beide haengen an DERSELBEN Stelle: nur deshalb koennen Kalender und
     Serie nicht auseinanderlaufen. */
  const kalender = zaehle('lernen.js', 'tagZaehlen');
  pruefe('Kalender und Serie hängen an derselben Stelle',
    kalender === 1, kalender + ' tagZaehlen()-Aufruf(e) in lernen.js');
}

console.log('\n' + (schlecht ? '✘ ' : '✔ ') + ok + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht ? 1 : 0);
