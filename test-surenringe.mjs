/* test-surenringe.mjs — bewacht, dass jeder Quran-Ring auf dem Startbildschirm
 * SEINE Sure oeffnet und nicht nur die Surenliste (15.09.2026).
 *
 * ⭐ DER ANLASS IST EIN SATZ VON ELIAS. Er schickte ein Bildschirmfoto des
 * Startbildschirms, auf dem die drei Quran-Ringe rot umrandet waren —
 * „Täglich Al-Mulk", „Wiederholen Az-Zalzalah", „Neu lernen Al-Qadr" — und
 * schrieb:
 *     „ich will das die jeweiligen koran suren mich direkt zu den jeweiligen
 *      suren bringt"
 *
 * Bis dahin trugen alle drei nur `nav: 'quranfull'`. Der Ring NANNTE also eine
 * Sure und fuehrte auf die Liste aller 114, wo Elias sie von Hand suchen
 * musste. Genau das bewacht diese Datei.
 *
 * ⛔ Warum ein eigener Pruefer und kein Auge: Der Fehler ist unsichtbar. Der
 * Knopf funktioniert weiterhin, er landet nur einen Bildschirm zu frueh. Faellt
 * `sure` bei einer spaeteren Aenderung weg, sieht alles normal aus — und der
 * Rueckfallweg `nav` sorgt dafuer, dass nichts bricht.
 * [[wirkung_an_der_quelle_stilllegen]] [[ausfall_ist_unsichtbar_gebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const quelle = fs.readFileSync(path.join(WURZEL, 'js', 'start.js'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + (gemessen === undefined ? 'nein' : gemessen)); }
};

/* ⚠️ Kommentarfrei suchen, wo es um WIRKUNG geht. Die Begruendungen oben in
   start.js nennen `data-surering` und `sure:` im Fliesstext — ein rohes grep
   zaehlte sie mit, und der Test bliebe gruen, auch wenn der Code es nicht mehr
   tut. [[stichworttreffer_im_kommentar]] */
const ohneKommentare = quelle
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

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

console.log('test-surenringe.mjs — ein Quran-Ring oeffnet seine Sure\n');

/* ---------- 1. quranRingDaten() gibt jedem Ring seine Sure ---------- */
console.log('quranRingDaten() — jeder Ring traegt seine Sure:');

const daten = schneide(ohneKommentare, 'quranRingDaten');
pruefe('die Funktion gibt es', !!daten);

if (daten){
  /* Jeder `ringe.push({...})` muss ein `sure:` tragen. Die Zahl der Pushes
     nicht fest verdrahten — kommt ein vierter Ring dazu, soll der Test ihn
     mitpruefen, nicht ueber die Zahl stolpern. [[allgemeine_regel_statt_listeneintrag]] */
  const pushes = daten.match(/ringe\.push\(\{[^}]*\}\)/g) || [];
  pruefe('es gibt ueberhaupt Ringe (ringe.push)', pushes.length > 0, pushes.length);
  const ohneSure = pushes.filter(p => !/\bsure\s*:/.test(p));
  pruefe('JEDER Ring traegt ein sure-Feld',
         pushes.length > 0 && ohneSure.length === 0,
         ohneSure.length + ' von ' + pushes.length + ' ohne sure');

  /* Al-Mulk ist der einzige mit fester Nummer — die anderen beiden holen sie
     aus wdhHeute() bzw. wdhFavorit(). Steht dort eine feste Zahl, zeigt der
     Ring auf etwas anderes als sein eigener Text. */
  pruefe('al-Mulk zeigt auf 67', /sure\s*:\s*67\b/.test(daten));
  pruefe('die Wiederholung nimmt die Sure aus wdhHeute()', /sure\s*:\s*wdh\.sure/.test(daten));
  pruefe('der Favorit nimmt die Sure aus wdhFavoriten()', /sure\s*:\s*fav\b/.test(daten));
  /* ⭐ Seit 17.09.2026 ein Ring JE Favorit — die Liste muss ganz durchlaufen
     werden, nicht nur ihr erstes Element. */
  pruefe('jeder Favorit bekommt einen Ring (wdhFavoriten().forEach)',
         /wdhFavoriten\(\)/.test(daten) && /favoriten\.forEach\(\s*fav\s*=>\s*ringe\.push/.test(daten));
}

/* ---------- 2. Der Knopf traegt das Attribut ---------- */
console.log('\nDer gezeichnete Knopf:');

const ringe = schneide(ohneKommentare, 'renderTagesringe');
pruefe('renderTagesringe() gibt es', !!ringe);

if (ringe){
  const surenRing = ringe.slice(ringe.indexOf('surenRing'));
  pruefe('der Suren-Knopf setzt data-surering', /data-surering="/.test(surenRing));
  pruefe('die Sure-Nummer steht wirklich drin (r.sure)', /data-surering="'\s*\+\s*r\.sure/.test(surenRing));

  /* ⛔⛔ ENTWEDER-ODER, nicht beides. Traegt derselbe Knopf auch data-nav,
     feuert zusaetzlich der Handler in js/navigation.js und schiebt
     `quranfull` ein zweites Mal in die Historie — die Geraetetaste „zurueck"
     landete dann zweimal auf der Surenliste statt auf dem Startbildschirm.
     Gemessen am 15.09.2026 im Pane: Tiefe 2 → 1 → 0, Start → Liste → Sure.
     [[zwei_regeln_selber_selektor]] */
  /* Gesucht ist die Gestalt `bedingung ? ' data-surering=…' : ' data-nav=…'`:
     ein Fragezeichen davor, ein Ternaer-Doppelpunkt dazwischen. Ein blosses
     „beide kommen vor" wuerde hier immer anschlagen — sie MUESSEN beide
     dastehen, nur eben als Alternativen. */
  const knopfZeile = surenRing.replace(/\n/g, ' ');
  const ternaer = /\?\s*'\s*data-surering="[^]{0,60}'\s*:\s*'\s*data-nav="/.test(knopfZeile);
  pruefe('data-surering und data-nav stehen in einem ENTWEDER-ODER', ternaer);

  pruefe('der Knopf hat ein aria-label', /aria-label="/.test(surenRing));

  /* ⭐ Zwei Reihen ab fünf Ringen, oben die größere Hälfte; am Tablet eine
     (18.09.2026). Elias: „so 3 oben drei unten … am tablet sollten sie aber
     eig alle nebeneinander passen". Gemessen in der Vorschau: bei 375 px
     4 in einer Reihe, 5 → 3+2, 6 → 3+3, 7 → 4+3; bei 768 und 1280 px alle
     sechs in einer Reihe. */
  pruefe('ab fünf Ringen zwei Reihen, oben die größere Hälfte',
    /alleRinge\.length\s*>=\s*5/.test(ringe) && /Math\.ceil\(\s*alleRinge\.length\s*\/\s*2\s*\)/.test(ringe)
    && /tr-reihe zweizeilig/.test(ringe));
  const seite = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
  pruefe('am Tablet (ab 700 px) wieder eine Reihe',
    /@media \(min-width:700px\)\{\s*\.tr-reihe\.zweizeilig\{[^}]*\}\s*\.tr-reihe\.zweizeilig \.tr-zeile\{display:contents;\}/.test(seite));
  pruefe('sein Satz dazu steht in js/start.js', quelle.includes('so 3 oben drei unten machen'));
}

/* ---------- 3. Der Handler fuehrt wirklich in die Sure ---------- */
console.log('\nDer Handler:');

const handler = ohneKommentare.slice(ohneKommentare.indexOf("closest('[data-surering]')") - 400);
pruefe('es gibt einen Handler auf [data-surering]', ohneKommentare.includes("closest('[data-surering]')"));
pruefe('er zeigt zuerst den Quran-Bildschirm', /showScreen\(['"]quranfull['"]\)/.test(handler));
pruefe('er ruft openSurah() mit der Nummer', /openSurah\(\s*id\b/.test(handler));
/* ⭐ Seit 18.09.2026 gibt der Ring „Zufällig" den ersten Vers SEINER Seite mit —
   Elias: „wenn ich auf link drücke soll es mich direkt dahinbringen". */
pruefe('er gibt den Vers aus data-vers mit (Seite des Tages)',
  /knopf\.dataset\.vers/.test(handler) && /openSurah\(\s*id\s*,\s*vers\s*\?\s*\{\s*vers\s*\}/.test(handler));
pruefe('er wartet auf openSurah (await)', /await\s+openSurah/.test(handler));

/* ⚠️ openSurah() liegt in js/quran.js und wird ueber window erreicht. Fehlt
   die Funktion dort, laeuft der Handler still ins Leere — der typeof-Riegel
   faengt den Absturz ab, und niemand merkt etwas. */
const quran = fs.readFileSync(path.join(WURZEL, 'js', 'quran.js'), 'utf8');
pruefe('openSurah() gibt es in js/quran.js', /function openSurah\s*\(/.test(quran));
pruefe('openSurah() springt zu opt.vers', /Number\(opt\.vers\)\s*>\s*0\s*\?\s*Number\(opt\.vers\)/.test(quran));

/* ---------- 4. Elias' Satz steht als Begruendung im Quelltext ---------- */
/* ⭐ Zuerst einen SATZ VON ELIAS bewachen, nicht nur Technik. Ohne ihn liest
   die naechste Vereinfachung `sure` als ueberfluessiges Feld neben `nav` und
   nimmt es weg. [[regel_gilt_nur_mit_begruendung]] */
console.log('\nDie Begruendung:');
pruefe('sein Auftrag steht wortwoertlich in js/start.js',
       quelle.includes('direkt zu den jeweiligen suren'));
pruefe('seine Favoriten-Regel vom 17.09. steht wortwoertlich in js/quran.js',
       fs.readFileSync(path.join(WURZEL, 'js', 'quran.js'), 'utf8').includes('erst wenn ich sie von den favouriten löse dann kann sie tatsächlich weg'));

/* ---------- 5. Eine heute gelernte Sure verdrängt die Wiederholung nicht ----------
   ⭐ ELIAS' TAG, NACHGESPIELT (16.09.2026). Gelesen: al-Qadr (als „Neu lernen")
   und az-Zalzala (als „Wiederholen"). Um 18:47 hakte er al-Qadr als auswendig
   ab — danach hieß der Ring „Wiederholen Al-Qadr", und Zalzala war weg. Er:
   „zalzala als ring ist verschwunden und ich habs geselen, soll das so sein"
   und „nicht statt. es zeigt nur qadr. beides wurde gezeigt aber jetzt fehtl
   zalzala". Gemessen an seinem abgeglichenen Stand: vt_suraGelesen 97 und 99
   am 2026-09-16, vt_hifz[97] { an: true, zeit: 18:47:36 }.
   Diesmal wird die Funktion AUSGEFÜHRT, nicht nur gelesen — die Sperre ist
   eine Bedingung, und die sieht man einem Quelltext nicht an. */
console.log('\nWiederholen: eine heute gelernte Sure zählt heute nicht mit:');
{
  const vm = await import('node:vm');
  const kern = fs.readFileSync(path.join(WURZEL, 'js', 'kern.js'), 'utf8');
  const teileAus = (text, namen) => namen.map(n => schneide(text, n));
  const konstante = (text, name) => (text.match(new RegExp('const ' + name + '\\s*=[^;]+;')) || [''])[0];
  const baue = quranText => {
    const stuecke = [konstante(kern, 'TAG_BEGINN_STUNDE'), ...teileAus(kern, ['todayStr', 'lerntagVon']),
      konstante(quranText, 'WDH_AUSGENOMMEN'),
      ...teileAus(quranText, ['heuteAuswendigAbgehakt', 'wdhVorrat', 'wdhHeute', 'istFavorit', 'wdhFavoriten'])];
    if (stuecke.some(s => !s)) return null;
    return stuecke.join('\n') + '\n;globalThis.__heute = wdhHeute; globalThis.__tag = todayStr; globalThis.__fav = () => JSON.stringify(wdhFavoriten()); globalThis.__vorrat = () => JSON.stringify(wdhVorrat());';
  };
  const lauf = (code, stand) => {
    const c = { SURAH_DATA: [1, 67, 96, 97, 99, 102].map(id => ({ id })), QURAN_FAV: {}, ...stand };
    vm.createContext(c);
    vm.runInContext(code, c);
    return c;
  };
  const code = baue(quran);
  pruefe('wdhHeute(), wdhVorrat(), wdhFavoriten(), heuteAuswendigAbgehakt(), todayStr() und lerntagVon() sind zu finden', !!code);
  if (code){
    const probe = lauf(code, { HIFZ: {}, HIFZ_ZEIT: {}, WDH: {} });
    const heute = probe.__tag(0), gestern = probe.__tag(-1);
    const jetzt = Date.now(), vorEinerWoche = jetzt - 7 * 864e5;
    const auswendig = { 97: true, 99: true, 102: true };

    /* a) sein Tag */
    const a = lauf(code, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: jetzt } },
      WDH: { 97: heute, 99: heute } }).__heute();
    pruefe('sein Tag: der Ring zeigt Zalzala, erledigt', a && a.sure === 99 && a.erledigt === true, JSON.stringify(a));

    /* b) heute gelernt, noch nicht gelesen: sie ist heute auch nicht „dran" */
    const b = lauf(code, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: jetzt } },
      WDH: { 102: gestern } }).__heute();
    pruefe('heute gelernt und ungelesen: dran ist eine ältere, nicht die neue', b && b.sure === 99 && !b.erledigt, JSON.stringify(b));

    /* c) nur die neue gelesen: die Wiederholung ist noch offen */
    const c2 = lauf(code, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: jetzt } },
      WDH: { 97: heute } }).__heute();
    pruefe('nur die heute gelernte gelesen: Wiederholen bleibt offen', c2 && !c2.erledigt && c2.sure !== 97, JSON.stringify(c2));

    /* d) Normalfall bleibt: vor einer Woche gelernt, heute gelesen → zählt */
    const d = lauf(code, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: vorEinerWoche } },
      WDH: { 97: heute } }).__heute();
    pruefe('früher gelernt und heute gelesen: zählt wie immer', d && d.sure === 97 && d.erledigt === true, JSON.stringify(d));

    /* e) alte Haken tragen zeit 0 — sie dürfen nicht als „heute" gelten */
    const e = lauf(code, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: 0 } },
      WDH: { 97: heute } }).__heute();
    pruefe('Haken ohne Zeitpunkt (zeit 0): zählt wie immer', e && e.sure === 97 && e.erledigt === true, JSON.stringify(e));

    /* f) die 8-Uhr-Grenze: 07:59 gehört zum Vortag */
    const t = lauf(code, { HIFZ: {}, HIFZ_ZEIT: {}, WDH: {} });
    const lt = vm.runInContext('lerntagVon', t);
    pruefe('lerntagVon: 16.09. 07:59 zählt zum 15.09., 08:00 zum 16.09.',
      lt(new Date(2026, 8, 16, 7, 59).getTime()) === '2026-09-15' && lt(new Date(2026, 8, 16, 8, 0).getTime()) === '2026-09-16',
      lt(new Date(2026, 8, 16, 7, 59).getTime()) + ' / ' + lt(new Date(2026, 8, 16, 8, 0).getTime()));

    /* ⛔ Gegenprobe: ohne die Sperre muss sein Fehler wieder auftauchen —
       sonst prüfte Fall a) nichts. [[stoertest_muss_wirkung_nachweisen]] */
    const ohneSperre = baue(quran.replace('const vorrat = alle.filter(id => !heuteAuswendigAbgehakt(id));', 'const vorrat = alle;'));
    const g = ohneSperre && lauf(ohneSperre, { HIFZ: auswendig, HIFZ_ZEIT: { 97: { an: true, zeit: jetzt } },
      WDH: { 97: heute, 99: heute } }).__heute();
    pruefe('Gegenprobe: ohne die Sperre stünde wieder „Al-Qadr" da', !!g && g.sure === 97, JSON.stringify(g));

    /* ---------- 6. Der Ring „Neu lernen" verschwindet nicht am Tag des Abhakens ----------
       ⭐ Sein Tag, zweiter Teil. Nach v505 schrieb er um 20:20:25: „sura qadr ist
       jetzt als ring weg aber zalzala wieder da" — und vorher schon „beides wurde
       gezeigt". Gemessen an seinem Stand um 20:21:19: Favoriten 67 und 97,
       auswendig u. a. 97 (18:47:36) und 99, gelesen heute 96, 97, 99. */
    /* ⛔⛔ UMGESTELLT AM 17.09.2026. Hier stand bis dahin der Fall „vor einer
       Woche abgehakt: der Ring ist weg" — der Test bewachte also genau den
       Fehler, den Elias am 17.09. um 12:33 meldete: „sura qadr fehlt … erst
       wenn ich sie von den favouriten löse dann kann sie tatsächlich weg".
       Gemessen an seinem Stand (Abgleich 17.09. 12:31:44): Favoriten 67 und
       97, auswendig u. a. 97 (abgehakt 16.09. 18:47:36). Ein Test, der eine
       eigene Deutung festschreibt, macht sie nur schwerer zu korrigieren.
       [[regel_gilt_nur_mit_begruendung]] */
    console.log('\nNeu lernen: jeder Favorit ist ein Ring, bis der Stern weg ist:');
    const favoriten = { 67: true, 97: true };
    const auswendigMitQadr = { 1: true, 67: true, 97: true, 99: true, 102: true };

    const f1 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: { 97: { an: true, zeit: jetzt } },
      QURAN_FAV: favoriten, WDH: { 96: heute, 97: heute, 99: heute } }).__fav();
    pruefe('16.09.: heute abgehakt — „Neu lernen" zeigt al-Qadr', f1 === '[97]', f1);

    const f2 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: { 97: { an: true, zeit: new Date(2026, 8, 16, 18, 47, 36).getTime() } },
      QURAN_FAV: favoriten, WDH: {} }).__fav();
    pruefe('17.09., sein Stand: gestern abgehakt, noch Favorit — al-Qadr bleibt ein Ring', f2 === '[97]', f2);

    const f3 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: { 97: { an: true, zeit: vorEinerWoche } },
      QURAN_FAV: { 67: true, 96: true, 97: true }, WDH: {} }).__fav();
    pruefe('zwei Favoriten außer al-Mulk: zwei Ringe, der auswendige eingeschlossen', f3 === '[96,97]', f3);

    const f4 = lauf(code, { HIFZ: { 67: true }, HIFZ_ZEIT: {}, QURAN_FAV: { 67: true, 97: true }, WDH: {} }).__fav();
    pruefe('noch nicht auswendig: der Favorit ist ein Ring (wie immer)', f4 === '[97]', f4);

    const f5 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: { 67: true }, WDH: {} }).__fav();
    pruefe('Stern weg (nur al-Mulk übrig): kein Ring „Neu lernen"', f5 === '[]', f5);

    /* ---------- 7. Ein Favorit ist keine Wiederholung ----------
       Sonst zählte sein tägliches Lesen als „Wiederholen erledigt", und die
       Sure, die dran war, verschwände — sein Fehler vom 16.09., jeden Tag. */
    console.log('\nWiederholen: ein Favorit steht nicht in der Runde:');
    const w1 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: favoriten,
      WDH: { 97: heute, 99: gestern } }).__heute();
    pruefe('al-Qadr heute gelesen: Wiederholen bleibt offen und nennt eine andere Sure',
      !!w1 && w1.sure !== 97 && w1.erledigt === false, JSON.stringify(w1));

    const w2 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: favoriten, WDH: {} }).__vorrat();
    pruefe('die Runde enthält al-Qadr nicht, solange der Stern steht', w2 === '[99,102]', w2);

    const w3 = lauf(code, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: { 67: true }, WDH: {} }).__vorrat();
    pruefe('Stern weg: al-Qadr ist wieder in der Runde', w3 === '[97,99,102]', w3);

    /* ⛔ Gegenproben: ohne die beiden Regeln muss sein Fehler wieder da sein.
       Erst nachsehen, dass der ersetzte Text überhaupt im Quelltext steht —
       sonst bliebe die „alte Fassung" die neue, und die Gegenprobe prüfte
       nichts. [[stoertest_muss_wirkung_nachweisen]] */
    const favNeu = '.filter(s => istFavorit(s.id) && s.id !== 67)';
    const favAlt = '.filter(s => istFavorit(s.id) && s.id !== 67 && !HIFZ[s.id])';
    pruefe('Gegenprobe möglich: die Favoriten-Zeile steht so im Quelltext', quran.includes(favNeu));
    const ohneFavRegel = baue(quran.replace(favNeu, favAlt));
    const g1 = ohneFavRegel && lauf(ohneFavRegel, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: favoriten, WDH: {} }).__fav();
    pruefe('Gegenprobe: mit „nur solange nicht auswendig" fehlte al-Qadr wieder', g1 === '[]', g1);

    const vorratNeu = '.filter(s => HIFZ[s.id] && !WDH_AUSGENOMMEN.has(s.id) && !istFavorit(s.id))';
    const vorratAlt = '.filter(s => HIFZ[s.id] && !WDH_AUSGENOMMEN.has(s.id))';
    pruefe('Gegenprobe möglich: die Runden-Zeile steht so im Quelltext', quran.includes(vorratNeu));
    const ohneRundenRegel = baue(quran.replace(vorratNeu, vorratAlt));
    const g2 = ohneRundenRegel && lauf(ohneRundenRegel, { HIFZ: auswendigMitQadr, HIFZ_ZEIT: {}, QURAN_FAV: favoriten,
      WDH: { 97: heute, 99: gestern } }).__heute();
    pruefe('Gegenprobe: mit al-Qadr in der Runde hieße der Ring „Wiederholen Al-Qadr, erledigt"',
      !!g2 && g2.sure === 97 && g2.erledigt === true, JSON.stringify(g2));

    /* ---------- 8. Den Haken zurücknehmen (17.09.2026) ----------
       Elias: „ich will das bei den suren die ich ringe habe und mir angezeigt
       wird das ich sie gelesen habe, dass ich in die sure nach unten gehen kann
       und das heute gelesen antippen kann damit es nicht mehr als gelesen gilt
       und auch der ring dann wieder nicht voll ist"
       ⛔ Gemessen wird der RING, nicht der Speicher: sein Satz endet mit „und
       auch der ring dann wieder nicht voll ist". Deshalb läuft hier
       quranRingDaten() aus js/start.js mit, nicht nur die Funktion in
       js/quran.js. [[wirkung_an_der_quelle_stilllegen]] */
    console.log('\nZurücknehmen: der Ring wird wieder leer:');

    const SUREN = [{ id: 1, name: 'Al-Fatihah' }, { id: 67, name: 'Al-Mulk' }, { id: 96, name: 'Al-Alaq' },
                   { id: 97, name: 'Al-Qadr' }, { id: 99, name: 'Az-Zalzalah' }, { id: 102, name: 'At-Takathur' }];
    const baueHaken = (quranText) => {
      const stuecke = [konstante(kern, 'TAG_BEGINN_STUNDE'), ...teileAus(kern, ['todayStr', 'lerntagVon', 'escapeHtml']),
        konstante(quranText, 'WDH_AUSGENOMMEN'),
        ...teileAus(quranText, ['heuteAuswendigAbgehakt', 'wdhVorrat', 'wdhHeute', 'istFavorit', 'wdhFavoriten',
          'inWiederholungsrunde', 'merkeWiederholung', 'vergissWiederholung', 'gelesenKnopfHtml',
          'zufallsLos', 'heuteFavoritGesetzt', 'versZahl', 'seitenSchluessel', 'seitenBereich', 'zufallsSureErlaubt',
          'zufallsSeiteErlaubt', 'zufallsSeitenVorrat', 'zufallsSeiteHeute', 'seiteGelesenKnopfHtml', 'seitenWeiterHtml']),
        konstante(quranText, 'ZUFALL_AUSGENOMMEN'),
        schneide(ohneKommentare, 'quranRingDaten')];
      if (stuecke.some(s => !s)) return null;
      return stuecke.join('\n') + '\n;globalThis.__api = { merke: merkeWiederholung, vergiss: vergissWiederholung,'
        + ' ringe: quranRingDaten, knopf: gelesenKnopfHtml, tag: todayStr,'
        + ' zufall: zufallsSeiteHeute, vorrat: () => JSON.stringify(zufallsSeitenVorrat(false).map(b => b.seite)),'
        + ' bereich: seitenBereich, seitenknopf: seiteGelesenKnopfHtml, weiter: seitenWeiterHtml };';
    };
    const laufHaken = (code, stand) => {
      const gespeichert = {};
      const c = { SURAH_DATA: SUREN, QURAN_FAV: { 67: true, 97: true }, HIFZ: { 67: true, 97: true, 99: true },
        HIFZ_ZEIT: {}, WDH_ZEIT: {}, WDH_VORHER: {}, Date, icon: () => '<svg></svg>',
        LS: { get: () => ({}), set: (k, v) => { gespeichert[k] = JSON.parse(JSON.stringify(v)); } },
        ...stand };
      vm.createContext(c);
      vm.runInContext(code, c);
      c.__gespeichert = gespeichert;
      return c;
    };
    const ringVoll = (c, id) => {
      const r = c.__api.ringe().find(x => x.sure === id && /Neu lernen/.test(x.txt));
      return r ? r.voll : null;
    };

    const codeHaken = baueHaken(quran);
    pruefe('merkeWiederholung(), vergissWiederholung(), inWiederholungsrunde(), gelesenKnopfHtml() und quranRingDaten() sind zu finden', !!codeHaken);
    if (codeHaken){
      const c = laufHaken(codeHaken, { WDH: {} });
      pruefe('vorher: der Ring „Neu lernen Al-Qadr" ist nicht voll', ringVoll(c, 97) === false, ringVoll(c, 97));
      pruefe('der Knopf lädt zum Abhaken ein', /abhaken/.test(c.__api.knopf(97)), c.__api.knopf(97).replace(/\s+/g, ' '));

      c.__api.merke(97);
      pruefe('abgehakt: der Ring ist voll', ringVoll(c, 97) === true, ringVoll(c, 97));
      pruefe('abgehakt: gespeichert ist das heutige Datum', c.__gespeichert.vt_suraGelesen[97] === c.__api.tag(0),
        JSON.stringify(c.__gespeichert.vt_suraGelesen));
      pruefe('abgehakt: der Zeitpunkt steht in vt_suraGelesenZeit', Number(c.__gespeichert.vt_suraGelesenZeit[97]) > 0,
        JSON.stringify(c.__gespeichert.vt_suraGelesenZeit));
      const knopfAn = c.__api.knopf(97);
      pruefe('der Knopf sagt jetzt „zurücknehmen"', /zurücknehmen/.test(knopfAn), knopfAn.replace(/\s+/g, ' '));
      pruefe('⛔ und ist NICHT mehr gesperrt (disabled)', !/disabled/.test(knopfAn), knopfAn.replace(/\s+/g, ' '));
      const zeitVorher = Number(c.__gespeichert.vt_suraGelesenZeit[97]);

      c.__api.vergiss(97);
      pruefe('zurückgenommen: der Ring ist wieder nicht voll', ringVoll(c, 97) === false, ringVoll(c, 97));
      pruefe('zurückgenommen: der heutige Eintrag ist weg', c.__gespeichert.vt_suraGelesen[97] === undefined,
        JSON.stringify(c.__gespeichert.vt_suraGelesen));
      pruefe('zurückgenommen: der Zeitpunkt ist mitgewandert (sonst holt ihn der Abgleich zurück)',
        Number(c.__gespeichert.vt_suraGelesenZeit[97]) >= zeitVorher, JSON.stringify(c.__gespeichert.vt_suraGelesenZeit));
      pruefe('und der Knopf lädt wieder zum Abhaken ein', /abhaken/.test(c.__api.knopf(97)));

      /* ⚠️ Die letzte ECHTE Lesung darf die Rücknahme nicht mitnehmen. */
      const c2 = laufHaken(codeHaken, { WDH: { 97: '2026-09-12' } });
      c2.__api.merke(97); c2.__api.vergiss(97);
      pruefe('die Lesung von vorher bleibt stehen (12.09. wieder da)',
        c2.__gespeichert.vt_suraGelesen[97] === '2026-09-12', JSON.stringify(c2.__gespeichert.vt_suraGelesen));

      /* ⛔ Nur HEUTE. Ein älterer Haken ist Vergangenheit. */
      const c3 = laufHaken(codeHaken, { WDH: { 97: '2026-09-12' } });
      c3.__api.vergiss(97);
      pruefe('ein älterer Haken lässt sich nicht zurücknehmen',
        c3.__gespeichert.vt_suraGelesen === undefined, JSON.stringify(c3.__gespeichert));

      /* ⛔ Gegenprobe: ohne das Wegnehmen bliebe der Ring voll — dann prüfte
         der Fall oben nichts. [[stoertest_muss_wirkung_nachweisen]] */
      const wegNeu = 'if (vorher) WDH[sure] = vorher; else delete WDH[sure];';
      pruefe('Gegenprobe möglich: die Zeile steht so im Quelltext', quran.includes(wegNeu));
      const ohneWegnehmen = baueHaken(quran.replace(wegNeu, 'if (vorher) WDH[sure] = vorher;'));
      const g3 = ohneWegnehmen && laufHaken(ohneWegnehmen, { WDH: {} });
      if (g3){ g3.__api.merke(97); g3.__api.vergiss(97); }
      pruefe('Gegenprobe: ohne das Wegnehmen bliebe der Ring voll', !!g3 && ringVoll(g3, 97) === true,
        g3 && ringVoll(g3, 97));

      /* ---------- 9. Zufällig: jeden Tag eine SEITE (18.09.2026) ----------
         Elias, unterwegs in seine Google-Aufgaben: „Random sura die ich nicht
         auswendig kann als Ring machen Claude", im Chat: „als tagesziel so zu
         sagen, einfach auf dem startbildschirm". Danach, auf v529 und meine
         Frage nach 93, 94, 95, 96, 98, 100, 101 und 104: „mach mit ausnahme von
         denen, gib mir immer nur eine ganze seite zum lesen und du sollst die
         seite auch vor geben also einfach irgendeine seite aus dem koran. wenn
         ich auf link drücke soll es mich direkt dahinbringen". Auf meinen
         Vorschlag, die acht per Code abzuhaken: „nein mach das nicht". Auf 550
         Seiten: „warum so wenig? ich kenne doch nur ein paar und diese suren
         sind auch nciht viele".
         Gespielt mit SEINEM Stand (KV, zuletzt geschrieben 17.09. 22:48:55):
         auswendig 1, 67, 97, 99, 102, 103, 105–114, Favoriten 67 und 97 — mit
         allen 114 Suren und den 604 Seitengrenzen. */
      console.log('\nZufällig: jeden Tag eine Seite, die er nicht auswendig kann:');
      const sd = {};
      vm.createContext(sd);
      vm.runInContext(fs.readFileSync(path.join(WURZEL, 'surah-data.js'), 'utf8') + '\n;globalThis.__S = SURAH_DATA;', sd);
      vm.runInContext(fs.readFileSync(path.join(WURZEL, 'quran-seiten.js'), 'utf8') + '\n;globalThis.__P = QURAN_SEITEN;', sd);
      const ALLE = sd.__S.map(s => ({ id: s.id, name: s.name, verses: s.verses }));
      const SEITEN = sd.__P;
      const SEIN = [1, 67, 97, 99, 102, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
      const ACHT = [93, 94, 95, 96, 98, 100, 101, 104];
      const NICHT = [...SEIN, ...ACHT, 97];
      const hifzVon = (ids, zeit) => { const h = {}, z = {}; ids.forEach(id => { h[id] = true; z[id] = { an: true, zeit }; }); return { h, z }; };
      const zStand = extra => { const sein = hifzVon(SEIN, vorEinerWoche);
        return Object.assign({ SURAH_DATA: ALLE, QURAN_SEITEN: SEITEN, VERSE_CACHE: {}, HIFZ: sein.h, HIFZ_ZEIT: sein.z,
          QURAN_FAV: { 67: true, 97: true }, QURAN_FAV_ZEIT: {}, WDH: {} }, extra || {}); };
      const surenDer = b => { const s = []; for (let x = b.sure; x <= b.bisSure; x++) s.push(x); return s; };

      const z0 = laufHaken(codeHaken, zStand());
      const heuteZ = z0.__api.tag(0);
      const vorratZ = JSON.parse(z0.__api.vorrat());
      const quer = vorratZ.filter(p => { const b = z0.__api.bereich(p); return b.bisSure !== b.sure; });
      console.log('     (' + vorratZ.length + ' Seiten zur Wahl, ' + quer.length + ' davon über eine Surengrenze)');
      pruefe('die Auswahl: 591 Seiten — 604 ohne al-Fātiḥa, al-Mulk, seine Haken und die acht', vorratZ.length === 591, vorratZ.length);
      pruefe('41 davon gehen über eine Surengrenze (bis Fassung 529: keine)', quer.length === 41, quer.length);
      pruefe('Seite 1 = al-Fātiḥa 1–7, Seite 2 = al-Baqara 1–5 (Seitengrenzen richtig gelesen)',
        JSON.stringify(z0.__api.bereich(1)) === '{"seite":1,"sure":1,"von":1,"bisSure":1,"bis":7}'
        && JSON.stringify(z0.__api.bereich(2)) === '{"seite":2,"sure":2,"von":1,"bisSure":2,"bis":5}',
        JSON.stringify(z0.__api.bereich(1)) + ' ' + JSON.stringify(z0.__api.bereich(2)));
      pruefe('Seite 106 = 4:176 bis 5:2 — und sie ist jetzt in der Auswahl',
        JSON.stringify(z0.__api.bereich(106)) === '{"seite":106,"sure":4,"von":176,"bisSure":5,"bis":2}' && vorratZ.includes(106),
        JSON.stringify(z0.__api.bereich(106)));
      pruefe('Seite 604 = 112:1 bis 114:6 (die letzte Seite endet mit an-Nās)',
        JSON.stringify(z0.__api.bereich(604)) === '{"seite":604,"sure":112,"von":1,"bisSure":114,"bis":6}',
        JSON.stringify(z0.__api.bereich(604)));
      pruefe('„mach mit ausnahme von denen": Seite 596 (92:15–94:8) und 597 (95–96) sind NICHT dabei',
        !vorratZ.includes(596) && !vorratZ.includes(597));
      pruefe('keine Seite mit al-Fātiḥa, al-Mulk (562–564) oder seinen Haken (598–604)',
        [1, 562, 563, 564, 598, 599, 600, 601, 602, 603, 604].every(p => !vorratZ.includes(p)));
      pruefe('⛔ keine Seite der Auswahl hat IRGENDEINE Sure, die er kann oder ausgenommen hat',
        vorratZ.every(p => surenDer(z0.__api.bereich(p)).every(s => !NICHT.includes(s))));
      pruefe('⛔ kein Code hakt die acht für ihn ab („nein mach das nicht")',
        !quran.includes('achtAlsGelerntEintragen') && !quran.includes('ACHT_GELERNT'));

      /* „und bei wiederholen sollen suren sein ich bereits gelernt habe also
         wnen ich neue lerne dann sollen die auch dazu kommen da" — was ER
         abhakt, kommt in die Runde; die acht nicht, solange er sie nicht selbst
         abhakt. */
      const runde0 = JSON.parse(vm.runInContext('JSON.stringify(wdhVorrat())', laufHaken(codeHaken, zStand())));
      pruefe('„Wiederholen": seine Haken (ohne al-Fātiḥa, al-Mulk, Favoriten) — die acht nicht',
        runde0.includes(99) && runde0.includes(114) && !runde0.includes(97) && ACHT.every(id => !runde0.includes(id)),
        JSON.stringify(runde0));
      const w1 = laufHaken(codeHaken, zStand());
      w1.HIFZ[92] = true; w1.HIFZ_ZEIT[92] = { an: true, zeit: vorEinerWoche };
      pruefe('hakt er eine neue ab (hier 92), kommt sie dazu',
        JSON.parse(vm.runInContext('JSON.stringify(wdhVorrat())', w1)).includes(92));

      const dran = z0.__api.zufall();
      pruefe('es gibt eine Seite des Tages, und sie steht in der Auswahl', !!dran && vorratZ.includes(dran.seite), JSON.stringify(dran));

      const ringZ = c => c.__api.ringe().find(r => r.teil === 'zufall');
      const r0 = ringZ(z0);
      pruefe('der Ring: „Zufällig" + Seitenzahl, dazu Sure und erster Vers der Seite (dorthin springt er)',
        !!r0 && r0.txt === 'Zufällig<br>Seite ' + dran.seite && r0.sure === dran.sure && r0.vers === dran.von, JSON.stringify(r0));
      pruefe('ungelesen ist er leer', !!r0 && r0.voll === false);
      const kz = z0.__api.seitenknopf(dran.seite);
      pruefe('der Haken am Seitenende nennt die Seite', /data-seitegelesen="/.test(kz) && kz.includes('Seite ' + dran.seite + ' heute gelesen — abhaken'), kz.replace(/\s+/g, ' '));
      z0.__api.merke('seite:' + dran.seite);
      pruefe('gelesen: der Ring ist voll', ringZ(z0).voll === true);
      pruefe('… und der Haken sagt „zurücknehmen"', z0.__api.seitenknopf(dran.seite).includes('zurücknehmen'));
      z0.__api.vergiss('seite:' + dran.seite);
      pruefe('zurückgenommen: wieder leer', ringZ(z0).voll === false);

      /* Über die Surengrenze: am Ende der ersten Sure steht, wo es weitergeht. */
      const kw = z0.__api.weiter(106, 5);
      pruefe('am Ende von an-Nisāʾ: „Seite 106 geht weiter in 5. …", und der Knopf trägt Sure 5',
        /data-seiteweiter="5"/.test(kw) && kw.includes('Seite 106 geht weiter in 5.'), kw.replace(/\s+/g, ' '));

      pruefe('den ganzen Tag dieselbe (zehnmal gefragt)',
        Array.from({ length: 10 }, () => z0.__api.zufall().seite).every(x => x === dran.seite));
      const andere = ALLE.find(s => !surenDer(dran).includes(s.id) && !NICHT.includes(s.id)).id;
      const z1 = laufHaken(codeHaken, zStand());
      z1.HIFZ[andere] = true; z1.HIFZ_ZEIT[andere] = { an: true, zeit: Date.now() };
      pruefe('hakt er eine ANDERE Sure ab: die Seite bleibt', z1.__api.zufall().seite === dran.seite, z1.__api.zufall().seite);
      const z2 = laufHaken(codeHaken, zStand());
      z2.HIFZ[dran.sure] = true; z2.HIFZ_ZEIT[dran.sure] = { an: true, zeit: Date.now() }; z2.WDH['seite:' + dran.seite] = heuteZ;
      pruefe('ihre Sure abgehakt, Seite SCHON gelesen: sie bleibt heute, voll', z2.__api.zufall().seite === dran.seite && ringZ(z2).voll === true);
      const z3 = laufHaken(codeHaken, zStand());
      z3.HIFZ[dran.sure] = true; z3.HIFZ_ZEIT[dran.sure] = { an: true, zeit: Date.now() };
      const neuZ3 = z3.__api.zufall();
      pruefe('ihre Sure abgehakt, Seite NICHT gelesen: sofort eine andere Seite ohne diese Sure',
        neuZ3.seite !== dran.seite && !surenDer(neuZ3).includes(dran.sure), JSON.stringify(neuZ3));
      const z4 = laufHaken(codeHaken, zStand());
      z4.QURAN_FAV[dran.sure] = true; z4.QURAN_FAV_ZEIT[dran.sure] = { an: true, zeit: Date.now() };
      pruefe('ihre Sure ungelesen zum Favoriten gemacht: sofort eine andere', z4.__api.zufall().seite !== dran.seite);
      const z5 = laufHaken(codeHaken, zStand());
      z5.HIFZ[5] = true; z5.HIFZ_ZEIT[5] = { an: true, zeit: vorEinerWoche };
      const ohneMaida = JSON.parse(z5.__api.vorrat());
      pruefe('⛔ streng: al-Māʾida abgehakt → auch Seite 106 fällt weg, obwohl sie in an-Nisāʾ ANFÄNGT',
        !ohneMaida.includes(106) && ohneMaida.every(p => !surenDer(z5.__api.bereich(p)).includes(5)), ohneMaida.length);

      const tagText = n => new Date(Date.UTC(2026, 8, 18) + n * 864e5).toISOString().slice(0, 10);
      const verteilung = c => {
        const z = new Map();
        for (let n = 0; n < 400; n++){ const b = c.__api.zufall(tagText(n)); z.set(b.seite, (z.get(b.seite) || 0) + 1); }
        return { verschieden: z.size, max: Math.max(...z.values()), seiten: [...z.keys()] };
      };
      /* Was echter Zufall über 400 Tage ergäbe: n · (1 − (1 − 1/n)^400). */
      const erwartet = Math.round(vorratZ.length * (1 - Math.pow(1 - 1 / vorratZ.length, 400)));
      const v0 = verteilung(z0);
      console.log('     (400 Tage: ' + v0.verschieden + ' verschiedene Seiten, höchstens ' + v0.max + '-mal; echter Zufall: ' + erwartet + ')');
      pruefe('über 400 Tage mindestens 250 verschiedene Seiten (echter Zufall: ' + erwartet + ')', v0.verschieden >= 250, v0.verschieden);
      pruefe('… keine öfter als 6-mal', v0.max <= 6, v0.max);
      pruefe('an keinem der 400 Tage eine Seite mit einer Sure, die er kann oder ausgenommen hat',
        v0.seiten.every(p => surenDer(z0.__api.bereich(p)).every(s => !NICHT.includes(s))));

      /* ⛔ Gegenproben — jede muss den Fehler zurückbringen. Erst nachsehen, dass
         die ersetzte Zeile wirklich so im Quelltext steht. [[stoertest_muss_wirkung_nachweisen]] */
      const gegen = (was, alt, neu, probe, zeige) => {
        pruefe('Gegenprobe möglich: ' + was, quran.includes(alt));
        const code2 = quran.includes(alt) ? baueHaken(quran.replace(alt, neu)) : null;
        const r = code2 ? probe(code2) : undefined;
        pruefe('Gegenprobe: ' + was + ' → der Fehler ist wieder da', r === true, zeige ? zeige(code2) : r);
      };
      gegen('ohne die acht („mach mit ausnahme von denen")',
        'if (WDH_AUSGENOMMEN.has(id) || ZUFALL_AUSGENOMMEN.has(id)) return false;', 'if (WDH_AUSGENOMMEN.has(id)) return false;',
        code2 => { const v = JSON.parse(laufHaken(code2, zStand()).__api.vorrat()); return v.length === 593 && v.includes(597); });
      gegen('nur die ERSTE Sure der Seite geprüft', 'for (let s = b.sure; s <= b.bisSure; s++){', 'for (let s = b.sure; s <= b.sure; s++){',
        code2 => JSON.parse(laufHaken(code2, zStand()).__api.vorrat()).includes(596));
      gegen('wieder „nur Seiten in EINER Sure"', 'if (!bis) return null;', 'if (bisSure !== sure || !bis) return null;',
        code2 => { const v = JSON.parse(laufHaken(code2, zStand()).__api.vorrat()); return v.length === 550 && !v.includes(106); });
      gegen('ohne den Auswendig-Ausschluss', "if (HIFZ[id] && !(mitHeute && heuteAuswendigAbgehakt(id))) return false;", '',
        code2 => { const c = laufHaken(code2, zStand()); c.HIFZ[2] = true; c.HIFZ_ZEIT[2] = { an: true, zeit: vorEinerWoche };
                   return JSON.parse(c.__api.vorrat()).some(p => c.__api.bereich(p).sure === 2); });
      gegen('ohne „schon gelesen bleibt"', "if (breit && typeof WDH === 'object' && WDH[seitenSchluessel(breit.seite)] === todayStr(0)) return breit;", '',
        code2 => { const c = laufHaken(code2, zStand()); c.HIFZ[dran.sure] = true; c.HIFZ_ZEIT[dran.sure] = { an: true, zeit: Date.now() };
                   c.WDH['seite:' + dran.seite] = heuteZ; return c.__api.zufall().seite !== dran.seite; });
      const mischNeu = '  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);\n  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);\n  h ^= h >>> 16;\n';
      /* ⚠️ Bei SEITEN macht die Durchmischung weniger aus als bei Suren (dort: 82
         statt 97 von 98, al-Humaza 33-mal). Gemessen am 18.09. bei 591 Seiten:
         mit 293 verschiedene, höchstens 4-mal — ohne 271, höchstens 5-mal;
         echter Zufall ergäbe 291. Beides bestünde die Grenzen oben. Geprüft
         wird deshalb nur, was wirklich stimmt: mit Durchmischung liegt sie
         näher am echten Zufall. */
      pruefe('Durchmischung steht so im Quelltext', quran.includes(mischNeu));
      const ohneMisch = quran.includes(mischNeu) ? baueHaken(quran.replace(mischNeu, '')) : null;
      const vOhne = ohneMisch ? verteilung(laufHaken(ohneMisch, zStand())) : null;
      if (vOhne) console.log('     (ohne Durchmischung: ' + vOhne.verschieden + ' verschiedene, höchstens ' + vOhne.max + '-mal)');
      pruefe('mit Durchmischung näher an echtem Zufall (' + erwartet + ') als ohne',
        !!vOhne && Math.abs(v0.verschieden - erwartet) < Math.abs(vOhne.verschieden - erwartet),
        vOhne && ('mit ' + v0.verschieden + ', ohne ' + vOhne.verschieden));

      /* ⭐ Seine Sätze stehen als Begründung im Quelltext. */
      pruefe('seine Aufträge stehen wörtlich in js/quran.js',
        quran.includes('Random sura die ich nicht auswendig kann als Ring machen Claude')
        && quran.includes('gib mir immer nur eine ganze seite zum')
        && quran.includes('mach mit ausnahme von denen')
        && quran.includes('nein mach das nicht')
        && quran.includes('einfach eine ganze seite lesen darum geht es')
        && quran.includes('warum so wenig? ich kenne doch nur ein paar')
        && quran.includes('und bei wiederholen'));
    }
  }
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Faellen falsch'
                             : '✔ alle ' + ok + ' gruen'));
process.exit(schlecht ? 1 : 0);
