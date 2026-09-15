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
  pruefe('der Favorit nimmt die Sure aus wdhFavorit()', /sure\s*:\s*fav\b/.test(daten));
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

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Faellen falsch'
                             : '✔ alle ' + ok + ' gruen'));
process.exit(schlecht ? 1 : 0);
