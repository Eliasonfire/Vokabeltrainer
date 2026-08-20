/* pruefe-artefakt-inhalt.mjs — welche Artefaktseite traegt gesperrtes Material?
 * ==========================================================================
 *
 * ⛔⛔ DIE FRAGE, DIE VORHER NIEMAND GESTELLT HAT
 *
 * `transcripts/` und `data/vokabeln-*.js` sind per .gitignore gesperrt —
 * arabicroots AGB 3.7 und 9, unerlaubte Weitergabe von Kursmaterial. Die
 * Sperre gilt fuer das REPO. Aber die Artefaktseiten werden auf claude.ai
 * veroeffentlicht, und dort greift keine .gitignore.
 *
 * Am 21.08.2026 nachgemessen: `artefakte/freigabe.html` enthaelt den
 * WOERTLICHEN Wortlaut von 41 der 45 Regelkandidaten. Als Artefakt ist die
 * Seite privat, das ist in Ordnung — aber sie ist einen Klick vom Teilen
 * entfernt, und niemand sah ihr das an.
 *
 * ⭐ Alle zehn Seiten wurden gemessen, nicht nur die verdaechtige. Neun sind
 * sauber. Eine Sammelaussage ohne Einzelbeleg waere hier wertlos gewesen.
 * [[sammelaussage_einzeln_belegen]]
 *
 * ==========================================================================
 * Aufruf:  node werkzeuge/pruefe-artefakt-inhalt.mjs
 *
 * Exitcode 0 = jede Seite mit gesperrtem Material traegt ihren Hinweis
 * Exitcode 2 = eine Seite traegt Kursmaterial OHNE sichtbaren Vorbehalt
 *
 * ⚠️ Das Werkzeug verbietet nichts. Es sorgt dafuer, dass der Vorbehalt auf
 * der SEITE steht und nicht nur im Quelltext des Skripts, das sie erzeugt —
 * ein Hinweis, den der Leser nicht sieht, wirkt nicht.
 * [[regel_gilt_nur_mit_begruendung]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUS  = path.join(REPO, 'artefakte');
const KAND = path.join(REPO, 'transcripts', 'kandidaten');

if (!fs.existsSync(AUS)){ console.log('Kein artefakte/ — nichts zu pruefen.'); process.exit(0); }

/* ---------- Die Textproben, nach denen gesucht wird ---------- */
/* ⛔ Nicht nach Stichwoertern wie „Transkript" suchen — das faende Kommentare
   und keine Inhalte. Gesucht wird der WORTLAUT selbst, in Stuecken, die lang
   genug sind, um nicht zufaellig zu treffen.
   [[stichworttreffer_ist_kein_inhaltstreffer]] */
const proben = [];
if (fs.existsSync(KAND)){
  for (const d of fs.readdirSync(KAND).filter(f => /^folge-\d+\.json$/.test(f))){
    try {
      const j = JSON.parse(fs.readFileSync(path.join(KAND, d), 'utf8'));
      for (const k of (j.kandidaten || [])){
        const s = String(k.text || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        if (s.length >= 40) proben.push({ quelle: d, text: s });
      }
    } catch { /* kaputte Datei: dann eben ohne sie */ }
  }
}
if (!proben.length){
  console.log('Keine Transkript-Kandidaten gefunden (transcripts/ liegt nicht vor).');
  console.log('⚠️ Das ist KEIN gruener Befund — es wurde nichts geprueft.');
  process.exit(0);
}
console.log(proben.length + ' Textproben aus ' + new Set(proben.map(p => p.quelle)).size + ' Folgendatei(en).');
console.log('');

/* Woran erkennt man den sichtbaren Vorbehalt? An dem Satz, den
   freigabe-artefakt.mjs in den Seitenkopf schreibt. */
const HINWEIS = /nicht teilen/i;

let befunde = 0;
const seiten = fs.readdirSync(AUS).filter(f => f.endsWith('.html')).sort();
for (const f of seiten){
  const h = fs.readFileSync(path.join(AUS, f), 'utf8');
  const treffer = proben.filter(p => h.includes(p.text)).length;
  if (!treffer){ console.log('  ok   ' + f.padEnd(34) + '0 Treffer'); continue; }
  const hat = HINWEIS.test(h);
  if (hat){
    console.log('  ok   ' + f.padEnd(34) + treffer + ' Treffer — Hinweis „nicht teilen" steht auf der Seite');
  } else {
    befunde++;
    console.log('  ⛔   ' + f.padEnd(34) + treffer + ' Treffer — KEIN sichtbarer Vorbehalt');
  }
}

console.log('');
if (befunde){
  console.log('⛔ ' + befunde + ' Seite(n) tragen Kursmaterial ohne Hinweis.');
  console.log('   Abhilfe: den Vorbehalt in den KOPF der Seite schreiben, nicht nur');
  console.log('   in den Kommentar des erzeugenden Skripts.');
  process.exit(2);
}
console.log('✅ Jede Seite mit Kursmaterial traegt ihren Vorbehalt sichtbar.');
