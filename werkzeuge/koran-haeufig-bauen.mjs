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

/** Der Text der Datendatei. Je Karte eine Zeile, damit ein Diff lesbar bleibt. */
export function baueDatei(karten){
  /* ⛔ Nur, was die App LIEST. Die Häufigkeit (`n`) und der Zusatz `dort` bleiben in der Liste:
     die Zeile „N-mal im Koran", die beide gezeigt hätte, hat Elias am 11.10.2026 abgesagt („das
     sollst du nicht bauen, ist glaube unnötig"). In der App wirkt die Häufigkeit über `rang`. */
  const zeile = k => {
    const e = { id: k.id, rang: k.rang, kap: k.kap, ar: k.ar, de: k.de, type: k.type };
    if (k.gleich.length) e.gleich = k.gleich;
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
  const text = baueDatei(karten);
  if (process.argv.includes('--pruefen')){
    const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8').replace(/\r\n/g, '\n') : null;
    if (da !== text){ console.log('koran-haeufig-data.js passt nicht zur Liste — den Erzeuger ohne --pruefen laufen lassen.'); process.exit(1); }
    console.log('Liste in Ordnung: ' + karten.length + ' Karten, Datendatei passt.');
  } else {
    fs.writeFileSync(ZIEL + '.neu', text, 'utf8');
    fs.renameSync(ZIEL + '.neu', ZIEL);
    console.log('geschrieben: koran-haeufig-data.js — ' + karten.length + ' Karten in ' + Math.ceil(karten.length / JE_KAPITEL) + ' Kapiteln, '
      + karten.filter(k => k.gleich.length).length + ' mit einer gleichen Buchkarte, ' + Buffer.byteLength(text) + ' Byte.');
  }
}
