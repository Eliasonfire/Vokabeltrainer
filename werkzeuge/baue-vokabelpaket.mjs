/* baue-vokabelpaket.mjs -- schnuert die acht Buchdateien zu EINER Datei
   zusammen, die Elias auf ein Geraet uebertraegt und dort einmal einliest.

   Warum es das gibt: data/vokabeln-*.js liegt per .gitignore NICHT im
   oeffentlichen Repo - es ist arabicroots' Datenbankarbeit (deutsche
   Uebersetzungen, Wurzeln, Verbformen), nicht der Buchtext. Ohne die Dateien
   zeigt die Live-App nur Madina 1, Kapitel 1-9. Mit diesem Paket bekommt Elias
   alle acht Buecher auf jedes Geraet, ohne dass die Daten im Netz stehen.

   Eine Datei statt acht, weil die Uebertragung aufs Handy von Hand passiert -
   acht Dateien einzeln auszuwaehlen waere achtmal Gelegenheit, eine zu
   vergessen.

   Aufruf:
     node werkzeuge/baue-vokabelpaket.mjs
   Ergebnis:
     vokabelpaket.json im Repo-Wurzelverzeichnis (per .gitignore ausgeschlossen)
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEN  = path.join(WURZEL, 'data');
const ZIEL   = path.join(WURZEL, 'vokabelpaket.json');
const STAND  = path.join(WURZEL, '.vokabelpaket-stand.json');

/* Die Buchdateien sind ausfuehrbares JS (sie haengen sich in window.VOKABELN
   ein), damit der Service Worker sie ohne Sonderbehandlung cachen kann. Hier
   brauchen wir aber nur die Daten - also den Zuweisungsteil abschneiden und
   den Rest als JSON lesen, statt eine JS-Laufzeit nachzubauen.

   Falle, die mich beim ersten Versuch erwischt hat: "die erste eckige Klammer
   suchen" geht schief. Die Kopfzeile lautet
       (window.VOKABELN = window.VOKABELN || {})["madina-1"] = [
   - die erste Klammer gehoert also zum Schluessel, nicht zur Liste. Deshalb
   das letzte "= [" bis zum Dateiende nehmen. Auf data/buecher.js
   ("const BUECHER = [") passt dasselbe Muster. */
function lies(datei){
  const roh = fs.readFileSync(datei, 'utf8');
  const treffer = roh.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!treffer) throw new Error(`${path.basename(datei)}: keine Liste gefunden.`);
  return JSON.parse(treffer[1]);
}

if (!fs.existsSync(DATEN)){
  console.error(`Ordner ${DATEN} fehlt. Erst "node werkzeuge/hole-vokabeln.mjs" laufen lassen.`);
  process.exit(1);
}

const verzeichnisDatei = path.join(DATEN, 'buecher.js');
if (!fs.existsSync(verzeichnisDatei)){
  console.error('data/buecher.js fehlt - der Abzug ist unvollstaendig.');
  process.exit(1);
}
const verzeichnis = lies(verzeichnisDatei);

const buecher = {};
let gesamt = 0;
for (const b of verzeichnis){
  const datei = path.join(WURZEL, b.datei);
  if (!fs.existsSync(datei)){
    console.error(`FEHLT: ${b.datei} - Paket waere unvollstaendig, Abbruch.`);
    process.exit(1);
  }
  const liste = lies(datei);
  /* Gegen die Sollzahl aus dem Verzeichnis pruefen. Ein stillschweigend zu
     kleines Paket waere schlimmer als gar keins: die App zeigte dann Kapitel
     an, hinter denen nichts liegt. */
  if (liste.length !== b.vokabeln){
    console.error(`${b.slug}: ${liste.length} Vokabeln, erwartet ${b.vokabeln}. Abbruch.`);
    process.exit(1);
  }
  buecher[b.slug] = liste;
  gesamt += liste.length;
  console.log(`  ${b.slug.padEnd(16)} ${String(liste.length).padStart(5)} Vokabeln`);
}

const paket = {
  art: 'vokabelpaket',
  fassung: 1,
  erzeugt: new Date().toISOString(),
  verzeichnis,
  buecher
};

fs.writeFileSync(ZIEL, JSON.stringify(paket), 'utf8');
const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
console.log(`\n${ZIEL}\n${verzeichnis.length} Buecher, ${gesamt} Vokabeln, ${kb} KB.`);

/* ---------- Hat sich inhaltlich etwas geaendert? ----------
   Die Wartungsroutine laeuft zweimal die Woche. Wuerde sie jedes Mal melden
   "neues Paket, bitte einlesen", waere die Meldung nach dem dritten Mal wertlos
   und Elias liest sie nicht mehr - dann geht die eine Meldung unter, die
   wirklich zaehlt.

   Deshalb ein Fingerabdruck NUR ueber Verzeichnis und Vokabeln. Das Feld
   `erzeugt` darf ausdruecklich nicht hinein: es aendert sich bei jedem Lauf,
   und damit waere jedes Paket "neu" - genau der Fehler, den diese Pruefung
   verhindern soll. */
const abdruck = createHash('sha256')
  .update(JSON.stringify({ verzeichnis, buecher }))
  .digest('hex');

const vorher = fs.existsSync(STAND)
  ? JSON.parse(fs.readFileSync(STAND, 'utf8'))
  : null;
const geaendert = !vorher || vorher.abdruck !== abdruck;

if (!geaendert){
  console.log('\nUNVERAENDERT - dasselbe Paket wie beim letzten Lauf. Nichts zu tun.');
  process.exit(0);
}

/* Was genau ist anders? Ohne diese Zeilen stuende im Bericht nur "geaendert",
   und niemand wuesste, ob eine Vokabel dazukam oder ein ganzes Buch fehlt. */
if (vorher && vorher.buecher){
  const alle = new Set([...Object.keys(vorher.buecher), ...Object.keys(buecher)]);
  const zeilen = [];
  for (const slug of [...alle].sort()){
    const alt = vorher.buecher[slug] ?? 0;
    const neu = buecher[slug] ? buecher[slug].length : 0;
    if (alt !== neu) zeilen.push(`  ${slug.padEnd(16)} ${alt} -> ${neu} (${neu-alt >= 0 ? '+' : ''}${neu-alt})`);
  }
  console.log('\nGEAENDERT:');
  console.log(zeilen.length ? zeilen.join('\n')
    : '  Anzahl je Buch gleich - einzelne Eintraege wurden bearbeitet.');
} else {
  console.log('\nGEAENDERT: erstes Paket auf diesem Rechner.');
}

/* Eine Kopie dorthin legen, wo Elias sie ohne Suchen findet. Der Repo-Ordner
   taugt dafuer nicht - im Dateiwaehler von Telegram ist F:\Workspace\... drei
   Ebenen tief. Ueberschreibbar per Umgebungsvariable, damit der Pfad nicht im
   Code festgenagelt ist. */
const ablage = process.env.VOKABELPAKET_ABLAGE || path.join(os.homedir(), 'Downloads');
try {
  fs.mkdirSync(ablage, { recursive: true });
  const kopie = path.join(ablage, 'vokabelpaket.json');
  fs.copyFileSync(ZIEL, kopie);
  console.log(`\nKopie abgelegt: ${kopie}`);
} catch (e){
  console.log(`\nKopie nach ${ablage} nicht moeglich (${e.message}) - die Datei liegt aber in ${ZIEL}.`);
}

fs.writeFileSync(STAND, JSON.stringify({
  abdruck,
  erzeugt: paket.erzeugt,
  gesamt,
  buecher: Object.fromEntries(Object.entries(buecher).map(([k,v]) => [k, v.length]))
}, null, 1), 'utf8');

console.log('\nHANDLUNGSBEDARF: neues Vokabelpaket - auf die Geraete uebertragen');
console.log('und dort unter Einstellungen > "Vokabelpaket einlesen" auswaehlen.');
