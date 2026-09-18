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
}

/* ---------- 3. Der Handler fuehrt wirklich in die Sure ---------- */
console.log('\nDer Handler:');

const handler = ohneKommentare.slice(ohneKommentare.indexOf("closest('[data-surering]')") - 400);
pruefe('es gibt einen Handler auf [data-surering]', ohneKommentare.includes("closest('[data-surering]')"));
pruefe('er zeigt zuerst den Quran-Bildschirm', /showScreen\(['"]quranfull['"]\)/.test(handler));
pruefe('er ruft openSurah() mit der Nummer', /openSurah\(\s*id\s*\)/.test(handler));
pruefe('er wartet auf openSurah (await)', /await\s+openSurah/.test(handler));

/* ⚠️ openSurah() liegt in js/quran.js und wird ueber window erreicht. Fehlt
   die Funktion dort, laeuft der Handler still ins Leere — der typeof-Riegel
   faengt den Absturz ab, und niemand merkt etwas. */
const quran = fs.readFileSync(path.join(WURZEL, 'js', 'quran.js'), 'utf8');
pruefe('openSurah() gibt es in js/quran.js', /function openSurah\s*\(/.test(quran));

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
      const stuecke = [konstante(kern, 'TAG_BEGINN_STUNDE'), ...teileAus(kern, ['todayStr', 'lerntagVon']),
        konstante(quranText, 'WDH_AUSGENOMMEN'),
        ...teileAus(quranText, ['heuteAuswendigAbgehakt', 'wdhVorrat', 'wdhHeute', 'istFavorit', 'wdhFavoriten',
          'inWiederholungsrunde', 'merkeWiederholung', 'vergissWiederholung', 'gelesenKnopfHtml',
          'zufallsLos', 'heuteFavoritGesetzt', 'zufallsVorrat', 'zufallsSureHeute']),
        schneide(ohneKommentare, 'quranRingDaten')];
      if (stuecke.some(s => !s)) return null;
      return stuecke.join('\n') + '\n;globalThis.__api = { merke: merkeWiederholung, vergiss: vergissWiederholung,'
        + ' ringe: quranRingDaten, knopf: gelesenKnopfHtml, tag: todayStr,'
        + ' zufall: zufallsSureHeute, vorrat: () => JSON.stringify(zufallsVorrat()) };';
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

      /* ---------- 9. Die zufällige Sure des Tages (18.09.2026) ----------
         Elias, unterwegs in seine Google-Aufgaben: „Random sura die ich nicht
         auswendig kann als Ring machen Claude", und im Chat: „als tagesziel so
         zu sagen, einfach auf dem startbildschirm".
         Gespielt wird mit SEINEM Stand (KV, zuletzt geschrieben 17.09. 22:48:55):
         auswendig 1, 67, 97, 99, 102, 103, 105–114, Favoriten 67 und 97 — und
         mit allen 114 Suren aus surah-data.js. Das ergibt 98 Suren zur Auswahl. */
      console.log('\nZufällig: jeden Tag eine Sure, die er nicht auswendig kann:');
      const sd = {};
      vm.createContext(sd);
      vm.runInContext(fs.readFileSync(path.join(WURZEL, 'surah-data.js'), 'utf8') + '\n;globalThis.__S = SURAH_DATA;', sd);
      const ALLE = sd.__S.map(s => ({ id: s.id, name: s.name }));
      const SEIN_HIFZ = {};
      [1, 67, 97, 99, 102, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114].forEach(id => { SEIN_HIFZ[id] = true; });
      const SEINE_FAV = { 67: true, 97: true };
      const zStand = extra => Object.assign({ SURAH_DATA: ALLE, HIFZ: { ...SEIN_HIFZ }, HIFZ_ZEIT: {},
        QURAN_FAV: { ...SEINE_FAV }, QURAN_FAV_ZEIT: {}, WDH: {} }, extra || {});
      const ringZ = c => c.__api.ringe().find(r => r.teil === 'zufall');

      const z0 = laufHaken(codeHaken, zStand());
      const heuteZ = z0.__api.tag(0);
      const dran = z0.__api.zufall();
      const vorratZ = JSON.parse(z0.__api.vorrat());
      pruefe('die Auswahl sind seine 98 Suren', vorratZ.length === 98, vorratZ.length);
      pruefe('es gibt eine Sure des Tages, und sie steht in der Auswahl', vorratZ.includes(dran), dran);
      pruefe('sie ist NICHT als auswendig abgehakt', !SEIN_HIFZ[dran], dran);
      pruefe('sie ist kein Favorit (die haben schon „Neu lernen")', !SEINE_FAV[dran], dran);

      const r0 = ringZ(z0);
      pruefe('der Ring steht da: „Zufällig", ihr Name, ihre Nummer',
        !!r0 && r0.sure === dran && r0.txt === 'Zufällig<br>' + ALLE.find(s => s.id === dran).name, JSON.stringify(r0));
      pruefe('er steht als LETZTER Ring, hinter „Neu lernen"',
        z0.__api.ringe().map(r => r.teil).join(',') === 'mulk,wiederholen,neulernen,zufall',
        z0.__api.ringe().map(r => r.teil).join(','));
      pruefe('ungelesen ist er leer', !!r0 && r0.voll === false, r0 && r0.voll);
      pruefe('in ihr steht der Knopf „Heute gelesen"', /data-suragelesen/.test(z0.__api.knopf(dran)));
      const andere = vorratZ.find(id => id !== dran);
      pruefe('… in einer anderen, nicht auswendigen Sure nicht', z0.__api.knopf(andere) === '', andere);

      z0.__api.merke(dran);
      pruefe('gelesen: der Ring ist voll', ringZ(z0).voll === true, ringZ(z0).voll);
      z0.__api.vergiss(dran);
      pruefe('zurückgenommen: wieder leer', ringZ(z0).voll === false, ringZ(z0).voll);

      /* ⛔⛔ Den ganzen Tag dieselbe — auch wenn er an ANDEREN Suren etwas ändert.
         Sein Fehler vom 16.09.: „zalzala als ring ist verschwunden". */
      pruefe('den ganzen Tag dieselbe (zehnmal gefragt)',
        Array.from({ length: 10 }, () => z0.__api.zufall()).every(x => x === dran));
      const z1 = laufHaken(codeHaken, zStand({ HIFZ: { ...SEIN_HIFZ, [andere]: true },
        HIFZ_ZEIT: { [andere]: { an: true, zeit: Date.now() } } }));
      pruefe('hakt er eine ANDERE Sure als auswendig ab: der Ring bleibt', z1.__api.zufall() === dran, z1.__api.zufall());
      const z1b = laufHaken(codeHaken, zStand({ HIFZ: { ...SEIN_HIFZ, [andere]: true },
        HIFZ_ZEIT: { [andere]: { an: true, zeit: vorEinerWoche } } }));
      pruefe('… auch wenn sie schon länger abgehakt ist (sie fehlt dann nur in der Auswahl)',
        z1b.__api.zufall() === dran, z1b.__api.zufall());
      const z2 = laufHaken(codeHaken, zStand({ QURAN_FAV: { ...SEINE_FAV, [andere]: true },
        QURAN_FAV_ZEIT: { [andere]: { an: true, zeit: Date.now() } } }));
      pruefe('setzt er bei einer ANDEREN einen Stern: der Ring bleibt', z2.__api.zufall() === dran, z2.__api.zufall());

      /* ⛔ GERADE DIESE heute abgehakt oder zum Favoriten gemacht — es kommt
         darauf an, ob er sie heute schon gelesen hat. Gelesen: sie bleibt heute
         der Ring (sonst stünde nach dem Lesen eine neue, ungelesene da).
         Ungelesen: sofort eine andere — die Wahl war falsch (18.09.: der Ring
         zog aḍ-Ḍuḥā, die er am 17.08. zu den auswendigen gezählt hatte). */
      const z3 = laufHaken(codeHaken, zStand({ HIFZ: { ...SEIN_HIFZ, [dran]: true },
        HIFZ_ZEIT: { [dran]: { an: true, zeit: Date.now() } }, WDH: { [dran]: heuteZ } }));
      pruefe('gerade DIESE gelesen und dann als auswendig abgehakt: sie bleibt heute, der Ring ist voll',
        z3.__api.zufall() === dran && ringZ(z3).voll === true, z3.__api.zufall() + ' / ' + (ringZ(z3) || {}).voll);
      const z3b = laufHaken(codeHaken, zStand({ HIFZ: { ...SEIN_HIFZ, [dran]: true },
        HIFZ_ZEIT: { [dran]: { an: true, zeit: Date.now() } } }));
      pruefe('gerade DIESE UNGELESEN als auswendig abgehakt: sofort eine andere, nicht auswendige',
        z3b.__api.zufall() !== dran && !SEIN_HIFZ[z3b.__api.zufall()], z3b.__api.zufall());
      const z4 = laufHaken(codeHaken, zStand({ QURAN_FAV: { ...SEINE_FAV, [dran]: true },
        QURAN_FAV_ZEIT: { [dran]: { an: true, zeit: Date.now() } }, WDH: { [dran]: heuteZ } }));
      pruefe('gerade DIESE gelesen und dann zum Favoriten gemacht: sie bleibt heute der Ring', z4.__api.zufall() === dran, z4.__api.zufall());
      const z4b = laufHaken(codeHaken, zStand({ QURAN_FAV: { ...SEINE_FAV, [dran]: true },
        QURAN_FAV_ZEIT: { [dran]: { an: true, zeit: Date.now() } } }));
      pruefe('gerade DIESE ungelesen zum Favoriten gemacht: sofort eine andere (sie hat jetzt „Neu lernen")',
        z4b.__api.zufall() !== dran, z4b.__api.zufall());
      const z5 = laufHaken(codeHaken, zStand({ HIFZ: { ...SEIN_HIFZ, [dran]: true },
        HIFZ_ZEIT: { [dran]: { an: true, zeit: vorEinerWoche } } }));
      pruefe('ab dem nächsten Lerntag ist eine abgehakte raus', z5.__api.zufall() !== dran && !SEIN_HIFZ[z5.__api.zufall()],
        z5.__api.zufall());

      /* ⭐ Zufall über 400 Tage, mit seiner Auswahl. Gemessen am 18.09.: 97
         verschiedene, keine öfter als 10-mal (echter Zufall: 96,4 erwartet). */
      const tagText = n => new Date(Date.UTC(2026, 8, 18) + n * 864e5).toISOString().slice(0, 10);
      const verteilung = c => {
        const z = new Map();
        for (let n = 0; n < 400; n++){ const id = c.__api.zufall(tagText(n)); z.set(id, (z.get(id) || 0) + 1); }
        return { verschieden: z.size, max: Math.max(...z.values()), ids: [...z.keys()] };
      };
      const v0 = verteilung(z0);
      pruefe('über 400 Tage kommen mindestens 90 der 98 Suren dran', v0.verschieden >= 90, v0.verschieden);
      pruefe('… und keine öfter als 15-mal (im Schnitt 4)', v0.max <= 15, v0.max);
      pruefe('an keinem der 400 Tage eine auswendige Sure, ein Favorit, al-Fātiḥa oder al-Mulk',
        v0.ids.every(id => !SEIN_HIFZ[id] && !SEINE_FAV[id] && id !== 1 && id !== 67),
        v0.ids.filter(id => SEIN_HIFZ[id] || SEINE_FAV[id]).join(','));

      /* ⛔ Gegenproben — jede muss seinen Fehler zurückbringen, sonst prüfte der
         Fall oben nichts. Erst nachsehen, dass die ersetzte Zeile wirklich im
         Quelltext steht. [[stoertest_muss_wirkung_nachweisen]] */
      const ausschlussNeu = '&& !(HIFZ[s.id] && !(heuteAuswendigAbgehakt(s.id) && bleibtHeute(s.id)))';
      pruefe('Gegenprobe möglich: die Auswendig-Zeile steht so im Quelltext', quran.includes(ausschlussNeu));
      const ohneAusschluss = baueHaken(quran.replace(ausschlussNeu, ''));
      const gz1 = ohneAusschluss && verteilung(laufHaken(ohneAusschluss, zStand()));
      pruefe('Gegenprobe: ohne den Ausschluss käme auch eine auswendige Sure dran',
        !!gz1 && gz1.ids.some(id => SEIN_HIFZ[id]), gz1 && gz1.ids.filter(id => SEIN_HIFZ[id]).join(','));

      const ohneSchutz = baueHaken(quran.replace(ausschlussNeu, '&& !HIFZ[s.id]'));
      const gz2 = ohneSchutz && laufHaken(ohneSchutz, zStand({ HIFZ: { ...SEIN_HIFZ, [dran]: true },
        HIFZ_ZEIT: { [dran]: { an: true, zeit: Date.now() } }, WDH: { [dran]: heuteZ } }));
      pruefe('Gegenprobe: ohne „gelesen und heute abgehakt bleibt" spränge der Ring nach dem Lesen um',
        !!gz2 && gz2.__api.zufall() !== dran, gz2 && gz2.__api.zufall());

      const ohneGelesen = baueHaken(quran.replace(ausschlussNeu, '&& !(HIFZ[s.id] && !heuteAuswendigAbgehakt(s.id))'));
      const gz2b = ohneGelesen && laufHaken(ohneGelesen, zStand({ HIFZ: { ...SEIN_HIFZ, [dran]: true },
        HIFZ_ZEIT: { [dran]: { an: true, zeit: Date.now() } } }));
      pruefe('Gegenprobe: ohne „nur wenn schon gelesen" bliebe eine ungelesene, abgehakte Sure stehen',
        !!gz2b && gz2b.__api.zufall() === dran, gz2b && gz2b.__api.zufall());

      const mischNeu = '  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);\n  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);\n  h ^= h >>> 16;\n';
      pruefe('Gegenprobe möglich: die Durchmischung steht so im Quelltext', quran.includes(mischNeu));
      const ohneMischung = baueHaken(quran.replace(mischNeu, ''));
      const gz3 = ohneMischung && verteilung(laufHaken(ohneMischung, zStand()));
      pruefe('Gegenprobe: ohne Durchmischung fiele die Verteilung durch (gemessen 82 verschiedene, eine 33-mal)',
        !!gz3 && (gz3.verschieden < 90 || gz3.max > 15), gz3 && (gz3.verschieden + ' verschiedene, höchstens ' + gz3.max + '-mal'));

      /* ⭐ Sein Satz steht als Begründung im Quelltext. */
      pruefe('sein Auftrag steht wörtlich in js/quran.js',
        quran.includes('Random sura die ich nicht auswendig kann als Ring machen Claude')
        && quran.includes('als tagesziel so zu sagen, einfach auf dem startbildschirm'));
    }
  }
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Faellen falsch'
                             : '✔ alle ' + ok + ' gruen'));
process.exit(schlecht ? 1 : 0);
