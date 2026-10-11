#!/usr/bin/env node
/* koran-haeufig-bauen.mjs — baut `koran-haeufig-data.js` aus `werkzeuge/koran-haeufig-liste.txt`.
 *
 * Aufruf:
 *   node werkzeuge/koran-haeufig-bauen.mjs            Liste prüfen und die Datendatei schreiben
 *   node werkzeuge/koran-haeufig-bauen.mjs --pruefen  nur prüfen: Exit 1, wenn die Liste einen Fehler hat
 *                                                     oder die Datendatei nicht zur Liste passt
 *
 * WARUM ES DAS GIBT (11.10.2026): Elias will die häufigsten Wörter des Korans lernen — „du kannst koran
 * häufigste die häufigsten 270 wörter darein machen damit ich so 70% verstehen kann". Die Liste ist von
 * Hand geprüft (Kopf der Liste: Auftrag, Quelle, Spalten, Schreibregeln). Die App soll aber keine
 * Textdatei zerlegen, und eine von Hand gepflegte Datendatei liefe mit der Liste auseinander. Also wird
 * die Datendatei ERZEUGT, und `werkzeuge/test-koran-haeufig.mjs` hält beide gegeneinander.
 *
 * Die Kennung einer Karte ist `kh-` plus die erste Zeile der Tabelle, auf der das Wort steht — nicht der
 * Rang. MEINE Bauart: der Rang verschiebt sich, sobald die Liste wächst; an der Kennung hängt aber sein
 * Lernstand, und der darf dabei nicht auf ein anderes Wort rutschen.
 *
 * Berührt keine Daten aus Elias' arabicroots-Zugang: die Spalte `gleich` trägt nur Kennungen. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LISTE = path.join(REPO, 'werkzeuge', 'koran-haeufig-liste.txt');
export const ZIEL = path.join(REPO, 'koran-haeufig-data.js');
/** So viele Zeilen seiner Tabelle deckt die Liste ab — sein Satz: „die häufigsten 270 wörter". */
export const ZEILEN_DER_TABELLE = 270;
/** Vorkommen dieser 270 Zeilen zusammen (Spalte B der Tabelle, am 11.10.2026 summiert): 70,07 % von 74 122. */
export const SUMME = 51934;
/** So viele Plätze bilden ein Kapitel des Buchs „Koran häufigste" (MEINE Bauart: er kann so in Stücken anhaken). */
export const JE_KAPITEL = 30;
const TYPEN = new Set(['noun', 'verb', 'adjective', 'particle']);
const SPALTEN = 9;

/* ---------- Die Felder des vollen Programms (12.10.2026) ----------
 *
 * Elias, 20.08.2026: „es muss halt recht klar sein was ‚das volle programm‘ ist" — VOLLES-PROGRAMM.md, Teil A:
 * jedes Wort bekommt Wurzel, ein Nomen Geschlecht, Einzahl und Mehrzahl, ein Verb seine vier Stammformen.
 * Für die Karten der Gruppe stehen sie in einer ZWEITEN Quelldatei neben der Liste, je Zeile ein Feld mit
 * seinem Beleg. MEINE Bauart, nicht seine Vorgabe:
 *   - nicht als weitere Spalten der Liste: zehn Spalten mehr, bei den meisten Wörtern leer, und kein Platz
 *     für den Beleg je Feld;
 *   - nicht in FELD_ERGAENZUNGEN (data/feld-ausnahmen.js): das füllt antworten-uebernehmen.mjs aus dem,
 *     was ER beantwortet hat; hier steht, was ich aus Quellen belegt habe.
 * Ein Feld ohne Zeile bleibt an der Karte LEER. Leer ist richtig, wo keine Quelle es trägt. */
export const FELDER = path.join(REPO, 'werkzeuge', 'koran-haeufig-felder.txt');
/** Welche Felder eine Karte je Wortart tragen darf (VOLLES-PROGRAMM.md, A2 bis A5). Eine Partikel hat keine Wurzel. */
export const FELDER_JE_TYP = {
  noun: ['root', 'gender', 'sg', 'pl'],
  adjective: ['root', 'sg', 'pl', 'femSg', 'femPl'],
  verb: ['root', 'past', 'present', 'imperative', 'masdar'],
  particle: [],
};
/** In dieser Reihenfolge stehen die Felder in der Datendatei. */
export const FELD_FOLGE = ['root', 'gender', 'sg', 'pl', 'femSg', 'femPl', 'past', 'present', 'imperative', 'masdar'];
const FELD_SPALTEN = 4;
/* Arabische Zeichenklassen über Codepunkte gebaut — eine sichtbar getippte Klasse übersteht das Schreiben nicht sicher. */
const Z = n => String.fromCodePoint(n);
const AR_FREMD = new RegExp('[^' + Z(0x621) + '-' + Z(0x652) + Z(0x670) + ' ]');
const AR_VOKAL = new RegExp('[' + Z(0x64B) + '-' + Z(0x652) + ']');
const AR_WURZEL = new RegExp('^[' + Z(0x621) + '-' + Z(0x64A) + ']( [' + Z(0x621) + '-' + Z(0x64A) + ']){2,3}$');

/** Liest die Felder-Datei. `karten` sind die Karten der Liste. Gibt je Kennung die Felder, die Belege und alle Fehler zurück. */
export function leseFelder(text, karten){
  const fehler = [];
  const felder = new Map(), belege = new Map();
  const nachId = new Map(karten.map(k => [k.id, k]));
  let nr = 0, zeilen = 0;
  for (const roh of String(text).split(/\r?\n/)){
    nr++;
    if (!roh.trim() || roh.startsWith('#')) continue;
    zeilen++;
    const t = roh.split('|');
    const wo = `Felder Zeile ${nr}`;
    if (t.length !== FELD_SPALTEN){ fehler.push(`${wo}: ${t.length} Spalten statt ${FELD_SPALTEN}`); continue; }
    const [id, feld, wert, beleg] = t.map(x => x.trim());
    const k = nachId.get(id);
    if (!k){ fehler.push(`${wo}: die Kennung „${id}" steht nicht in der Liste`); continue; }
    if (!(FELDER_JE_TYP[k.type] || []).includes(feld)){ fehler.push(`${wo}: ${id} ist „${k.type}" und trägt kein Feld „${feld}"`); continue; }
    if (felder.has(id) && Object.prototype.hasOwnProperty.call(felder.get(id), feld)){ fehler.push(`${wo}: ${id} hat das Feld „${feld}" schon`); continue; }
    if (!wert){ fehler.push(`${wo}: ${id} ${feld} ohne Wert — ein leeres Feld bekommt keine Zeile`); continue; }
    if (!beleg) fehler.push(`${wo}: ${id} ${feld} ohne Beleg`);
    if (feld === 'gender'){
      if (wert !== 'masculine' && wert !== 'feminine') fehler.push(`${wo}: ${id} gender „${wert}" — die App kennt nur masculine und feminine`);
    } else if (feld === 'root'){
      if (!AR_WURZEL.test(wert)) fehler.push(`${wo}: ${id} Wurzel „${wert}" — erwartet sind drei oder vier Buchstaben mit je einem Leerzeichen`);
    } else {
      if (wert !== wert.normalize('NFC')) fehler.push(`${wo}: ${id} ${feld} ist nicht NFC`);
      for (const form of wert.split(' / ')){
        if (!form || AR_FREMD.test(form)) fehler.push(`${wo}: ${id} ${feld} enthält ein fremdes Zeichen (mehrere Formen trennt „ / ")`);
        else if (!AR_VOKAL.test(form)) fehler.push(`${wo}: ${id} ${feld} ohne Vokalzeichen`);
      }
      /* Die Vorderseite eines Verbs IST seine Vergangenheitsform — stünde hier etwas anderes, zeigte die Karte zwei Verben. */
      if (feld === 'past' && wert !== k.ar) fehler.push(`${wo}: ${id} past ist nicht die Schreibung der Karte`);
    }
    if (!felder.has(id)){ felder.set(id, {}); belege.set(id, {}); }
    felder.get(id)[feld] = wert; belege.get(id)[feld] = beleg;
  }
  return { felder, belege, fehler, zeilen };
}

/** Liest die Liste. Gibt die Karten in der Reihenfolge der Datei und alle Fehler zurück. */
export function leseListe(text){
  const fehler = [];
  const karten = [];
  const zeilenGesehen = new Map();
  const arGesehen = new Map();
  const gleichGesehen = new Map();
  let nr = 0;
  for (const roh of String(text).split(/\r?\n/)){
    nr++;
    if (!roh.trim() || roh.startsWith('#')) continue;
    const t = roh.split('|');
    if (t.length !== SPALTEN){ fehler.push(`Zeile ${nr}: ${t.length} Spalten statt ${SPALTEN}`); continue; }
    const [rangT, nT, zeilenT, ar, de, typ, gleichT, dort, anm] = t.map(x => x.trim());
    const rang = Number(rangT), n = Number(nT);
    const wo = `Rang ${rangT}`;
    if (rang !== karten.length + 1) fehler.push(`${wo}: erwartet war Rang ${karten.length + 1} (Zeile ${nr})`);
    if (!Number.isInteger(n) || n < 1) fehler.push(`${wo}: Häufigkeit „${nT}" ist keine Zahl über 0`);
    if (karten.length && n > karten[karten.length - 1].n) fehler.push(`${wo}: häufiger als der Rang davor — die Liste ist nicht nach Häufigkeit sortiert`);
    const zeilen = zeilenT.split('+').map(Number);
    for (const z of zeilen){
      if (!Number.isInteger(z) || z < 1 || z > ZEILEN_DER_TABELLE) fehler.push(`${wo}: Tabellenzeile „${z}" liegt nicht zwischen 1 und ${ZEILEN_DER_TABELLE}`);
      else if (zeilenGesehen.has(z)) fehler.push(`${wo}: Tabellenzeile ${z} steht schon bei Rang ${zeilenGesehen.get(z)}`);
      else zeilenGesehen.set(z, rang);
    }
    if (!ar) fehler.push(`${wo}: kein Arabisch`);
    else {
      if (ar !== ar.normalize('NFC')) fehler.push(`${wo}: Arabisch ist nicht NFC`);
      if (/[^ء-ْٰ ]/.test(ar)) fehler.push(`${wo}: Arabisch enthält ein fremdes Zeichen`);
      if (!/[ً-ْ]/.test(ar)) fehler.push(`${wo}: Arabisch ohne Vokalzeichen`);
      if (arGesehen.has(ar)) fehler.push(`${wo}: dieselbe Schreibung steht schon bei Rang ${arGesehen.get(ar)} — zwei Karten mit derselben Vorderseite`);
      else arGesehen.set(ar, rang);
    }
    if (!de) fehler.push(`${wo}: kein Deutsch`);
    if (/[؀-ۿ]/.test(de + dort)) fehler.push(`${wo}: Arabisch im deutschen Text`);
    if (!TYPEN.has(typ)) fehler.push(`${wo}: Wortart „${typ}" kennt die App nicht`);
    const ids = gleichT ? gleichT.split(',').map(x => x.trim()).filter(Boolean) : [];
    const gleich = [], nicht = [];
    for (const id of ids){
      if (!/^!?[A-Za-z0-9-]+$/.test(id)){ fehler.push(`${wo}: Kennung „${id}" hat ein fremdes Zeichen`); continue; }
      if (id.startsWith('!')) nicht.push(id.slice(1));
      else {
        if (gleichGesehen.has(id)) fehler.push(`${wo}: Karte ${id} gilt schon bei Rang ${gleichGesehen.get(id)} als dasselbe Wort`);
        else gleichGesehen.set(id, rang);
        gleich.push(id);
      }
    }
    if (dort && !/^dort( auch)?: \S/.test(dort)) fehler.push(`${wo}: die Spalte dort muss mit „dort: " oder „dort auch: " beginnen`);
    const erste = Math.min(...zeilen.filter(Number.isInteger));
    karten.push({ id: 'kh-' + String(erste).padStart(3, '0'), rang, kap: Math.ceil(rang / JE_KAPITEL), n, zeilen, ar, de, type: typ, gleich, nicht, dort, anm });
  }
  for (let z = 1; z <= ZEILEN_DER_TABELLE; z++) if (!zeilenGesehen.has(z)) fehler.push(`Tabellenzeile ${z} steht auf keiner Karte`);
  const summe = karten.reduce((s, k) => s + (Number.isInteger(k.n) ? k.n : 0), 0);
  if (summe !== SUMME) fehler.push(`die Häufigkeiten ergeben zusammen ${summe}, erwartet sind ${SUMME}`);
  for (const k of karten) for (const id of k.gleich) if (k.nicht.includes(id)) fehler.push(`Rang ${k.rang}: Karte ${id} ist zugleich angenommen und verworfen`);
  return { karten, fehler };
}

/** Der Text der Datendatei. Je Karte eine Zeile, damit ein Diff lesbar bleibt. `felder`: je Kennung die Felder aus leseFelder(). */
export function baueDatei(karten, felder = new Map()){
  /* ⛔ Nur, was die App LIEST. Die Häufigkeit (`n`) und der Zusatz `dort` bleiben in der Liste:
     die Zeile „N-mal im Koran", die beide gezeigt hätte, hat Elias am 11.10.2026 abgesagt („das
     sollst du nicht bauen, ist glaube unnötig"). In der App wirkt die Häufigkeit über `rang`.
     Die Belege der Felder bleiben ebenfalls in ihrer Quelldatei. */
  const zeile = k => {
    const e = { id: k.id, rang: k.rang, kap: k.kap, ar: k.ar, de: k.de, type: k.type };
    if (k.gleich.length) e.gleich = k.gleich;
    const f = felder.get(k.id);
    if (f) for (const name of FELD_FOLGE) if (f[name]) e[name] = f[name];
    return ' ' + JSON.stringify(e);
  };
  return [
    '/* Automatisch erzeugt von werkzeuge/koran-haeufig-bauen.mjs aus werkzeuge/koran-haeufig-liste.txt.',
    '   NICHT VON HAND ÄNDERN — die Liste ändern und den Erzeuger laufen lassen.',
    '',
    '   Die Wortgruppe „Koran häufigste" (Elias, 11.10.2026): die ' + ZEILEN_DER_TABELLE + ' häufigsten Wörter seiner Tabelle',
    '   auf ' + karten.length + ' Karten. `rang` = Platz nach Häufigkeit im Koran, 1 = am häufigsten (Zählung nach dem',
    '   Quranic Arabic Corpus, corpus.quran.com, über seine Tabelle; die Zahlen selbst stehen in der Liste).',
    '   `kap` = das Stück, in dem er die Gruppe anhaken kann. `gleich` = Kennungen der Karten in seinen',
    '   Büchern, die dasselbe Wort sind — kennt er eine davon, steht sie für das Wort und nicht diese Karte.',
    '   Wurzel, Geschlecht, Einzahl, Mehrzahl und die Verbformen (root, gender, sg, pl, past, present, imperative,',
    '   masdar) kommen aus werkzeuge/koran-haeufig-felder.txt; dort steht zu jedem Feld der Beleg.',
    '   Was die App damit tut, steht in js/buecher.js beim Abschnitt „Koran häufigste". */',
    'const KORAN_HAEUFIG = [',
    karten.map(zeile).join(',\n'),
    '];',
    ''
  ].join('\n');
}

const direkt = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direkt){
  const { karten, fehler } = leseListe(fs.readFileSync(LISTE, 'utf8'));
  for (const f of fehler) console.log('FEHLER  ' + f);
  if (fehler.length){ console.log(fehler.length + ' Fehler in der Liste — nichts geschrieben.'); process.exit(1); }
  const F = leseFelder(fs.existsSync(FELDER) ? fs.readFileSync(FELDER, 'utf8') : '', karten);
  for (const f of F.fehler) console.log('FEHLER  ' + f);
  if (F.fehler.length){ console.log(F.fehler.length + ' Fehler in der Felder-Datei — nichts geschrieben.'); process.exit(1); }
  const text = baueDatei(karten, F.felder);
  if (process.argv.includes('--pruefen')){
    const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') : null;
    if (da !== text){ console.log('koran-haeufig-data.js passt nicht zur Liste — den Erzeuger ohne --pruefen laufen lassen.'); process.exit(1); }
    console.log('Liste in Ordnung: ' + karten.length + ' Karten, ' + F.zeilen + ' Felder an ' + F.felder.size + ' Karten, Datendatei passt.');
  } else {
    fs.writeFileSync(ZIEL + '.neu', text, 'utf8');
    fs.renameSync(ZIEL + '.neu', ZIEL);
    console.log('geschrieben: koran-haeufig-data.js — ' + karten.length + ' Karten in ' + Math.ceil(karten.length / JE_KAPITEL) + ' Kapiteln, '
      + karten.filter(k => k.gleich.length).length + ' mit einer gleichen Buchkarte, ' + F.zeilen + ' Felder an ' + F.felder.size + ' Karten, ' + Buffer.byteLength(text) + ' Byte.');
  }
}
