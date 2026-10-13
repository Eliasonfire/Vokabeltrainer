/* koran-satz-einbauen.mjs — fügt den erzeugten Abschnitt (satz-block.txt) in data/beispielsaetze.js ein: zwischen
   zwei Marken, beim ersten Mal vor der schließenden Klammer der Liste. Ein zweiter Lauf ERSETZT den Abschnitt.
   Danach wird die Datei geladen und jeder Eintrag gegen satz.json gehalten.
   Aufruf:  node werkzeuge/koran-satz-einbauen.mjs [--pruefen] [--gleich] [<ordner mit satz-block.txt und satz.json>]
   --pruefen schreibt nichts. --gleich verlangt dazu, dass sich NICHTS ändern würde (Exit 1 sonst) — so hält
   werkzeuge/pruefe-koran-vorlagen.mjs die Vorlage gegen den ausgelieferten Abschnitt. Der Kopf des Abschnitts
   steht in werkzeuge/koran-vorlagen/saetze-kopf.txt. */
import fs from 'node:fs';
import path from 'node:path';
import { REPO, ARBEIT, VORLAGEN } from './koran-stellen-lib.mjs';
const ordner = process.argv.slice(2).find(a => !a.startsWith('--')) || ARBEIT;
const nurPruefen = process.argv.includes('--pruefen');
const GLEICH = process.argv.includes('--gleich');
const DATEI = path.join(REPO, 'data', 'beispielsaetze.js');
const block = fs.readFileSync(path.join(ordner, 'satz-block.txt'), 'utf8').replace(/\s+$/, '');
const soll = JSON.parse(fs.readFileSync(path.join(ordner, 'satz.json'), 'utf8'));
const kopf = fs.readFileSync(path.join(VORLAGEN, 'saetze-kopf.txt'), 'utf8').replace(/\s+$/, '');
const ANFANG = '  /* >>> KORAN-HAEUFIGSTE-ANFANG (erzeugt, nicht von Hand ändern — siehe den Kopf des Abschnitts) */';
const ENDE = '  /* <<< KORAN-HAEUFIGSTE-ENDE */';
const abschnitt = [ANFANG, kopf, '', block, '', ENDE].join('\n');

const alt = fs.readFileSync(DATEI, 'utf8');
const zeilenende = alt.includes('\r\n') ? '\r\n' : '\n';
let text = alt.replace(/\r\n/g, '\n');
const a = text.indexOf(ANFANG), e = text.indexOf(ENDE);
let neu;
if (a >= 0 && e > a) neu = text.slice(0, a) + abschnitt + text.slice(e + ENDE.length);
else if (a < 0 && e < 0) {
  const schluss = text.lastIndexOf('\n};');
  if (schluss < 0) { console.log('⛔ schließende Klammer der Liste nicht gefunden'); process.exit(1); }
  neu = text.slice(0, schluss) + '\n\n' + abschnitt + text.slice(schluss);
} else { console.log('⛔ nur EINE der beiden Marken gefunden — von Hand ansehen'); process.exit(1); }
neu = neu.replace(/\n/g, zeilenende);

/* laden und vergleichen, bevor geschrieben wird */
let liste;
try { liste = new Function(neu + '\nreturn BEISPIELSAETZE;')(); } catch (f) { console.log('⛔ die neue Fassung lädt nicht: ' + f.message); process.exit(1); }
const altListe = new Function(alt + '\nreturn BEISPIELSAETZE;')();
const fehler = [];
for (const [id, s] of Object.entries(soll)) if (!liste[id] || liste[id].sentAr !== s.sentAr || liste[id].sentDe !== s.sentDe) fehler.push(id + ': Eintrag weicht ab oder fehlt');
const khIst = Object.keys(liste).filter(k => k.startsWith('kh-'));
if (khIst.length !== Object.keys(soll).length) fehler.push('Einträge der Gruppe: ' + khIst.length + ' statt ' + Object.keys(soll).length);
for (const [id, s] of Object.entries(altListe)) if (!id.startsWith('kh-') && (!liste[id] || liste[id].sentAr !== s.sentAr || liste[id].sentDe !== s.sentDe)) fehler.push(id + ': ein VORHANDENER Eintrag hat sich geändert');
const andere = Object.keys(liste).filter(k => !k.startsWith('kh-')).length, andereAlt = Object.keys(altListe).filter(k => !k.startsWith('kh-')).length;
if (andere !== andereAlt) fehler.push('übrige Einträge: ' + andere + ' statt ' + andereAlt);
console.log('Einträge der Gruppe: ' + khIst.length + ' · übrige Einträge: ' + andere + ' (vorher ' + andereAlt + ') · Zeilenende: ' + (zeilenende === '\n' ? 'LF' : 'CRLF'));
if (fehler.length) { console.log('⛔ ' + fehler.join('\n⛔ ')); process.exit(1); }
if (GLEICH && neu !== alt) { console.log('⛔ --gleich: der Abschnitt in data/beispielsaetze.js ist NICHT, was Vorlage und Kopf heute ergeben.'); process.exit(1); }
if (GLEICH) console.log('✅ --gleich: der Abschnitt ist genau, was Vorlage und Kopf heute ergeben.');
if (nurPruefen || GLEICH) { console.log('--pruefen: nichts geschrieben.'); process.exit(0); }
fs.writeFileSync(DATEI + '.neu', neu, 'utf8');
fs.renameSync(DATEI + '.neu', DATEI);
console.log('✅ geschrieben: data/beispielsaetze.js');
