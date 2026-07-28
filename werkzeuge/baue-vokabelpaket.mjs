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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATEN  = path.join(WURZEL, 'data');
const ZIEL   = path.join(WURZEL, 'vokabelpaket.json');

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
console.log('Diese Datei aufs Handy uebertragen und in den Einstellungen einlesen.');
