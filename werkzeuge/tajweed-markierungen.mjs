/* tajweed-markierungen.mjs — welche Buchstaben hat Elias im Koran markiert?
 *
 * ================== WOZU (22.09.2026) ======================================
 *
 * Elias auf die Frage, ob eine Markierung verschwinden soll, sobald die
 * Stelle sitzt: „nach einem monat kann sie automatisch verschwinden aber du
 * solltest trotzdem aufzeichnen welche ich markiert habe damit falls ich mal
 * nachfrage du weißt". Und zur Übersichtsseite: „brauchen wir nicht".
 *
 * Die App blendet eine Markierung nach 30 Tagen aus (js/quran-markierung.js,
 * TJ_SICHTBAR_MS), löscht sie aber nie. Dieses Werkzeug holt `vt_tajweed` aus
 * dem Geräteabgleich und führt ein ARCHIV, das nur wächst:
 * data/tajweed-archiv.json. Was einmal darin steht, bleibt — auch wenn er die
 * App zurücksetzt oder ein Gerät verliert. [[werkzeug_ohne_aufrufer]]
 *
 *   node werkzeuge/tajweed-markierungen.mjs            holen, archivieren, auflisten
 *   node werkzeuge/tajweed-markierungen.mjs --datei x  statt KV eine Stand-Datei lesen
 *   node werkzeuge/tajweed-markierungen.mjs --nur-liste  nichts holen, nur das Archiv zeigen
 *
 * Gerufen von der Wartung (Pflegeplan: „Tajweed-Markierungen"), damit das
 * Archiv auch dann wächst, wenn niemand nachfragt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mitWiederholung } from './kv-abruf.mjs';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (r) => path.join(WURZEL, r);
const ARCHIV = p('data/tajweed-archiv.json');
const TAG = 24 * 60 * 60 * 1000;
const SICHTBAR_TAGE = 30;
const ARG = process.argv.slice(2);

function kvText(){
  const iD = ARG.indexOf('--datei');
  if (iD >= 0 && ARG[iD + 1]) return fs.readFileSync(ARG[iD + 1], 'utf8');
  const NS = (fs.readFileSync(p('wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
  if (!NS) throw new Error('KV-Namensraum nicht in wrangler.toml gefunden');
  const SCHLUESSEL = 'stand:' + (process.env.VT_MAIL || 'abdurahman.tunk@gmail.com');
  const win = process.platform === 'win32';
  const args = ['wrangler@4.124.0', 'kv', 'key', 'get', '--namespace-id=' + NS, SCHLUESSEL, '--remote'];
  const r = mitWiederholung(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args,
    { cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 180000 });
  return r.text;
}

function archivLesen(){
  try { return JSON.parse(fs.readFileSync(ARCHIV, 'utf8')); }
  catch (e) { return { _hinweis: '', eintraege: {} }; }
}

/* Ein Archiveintrag je Buchstabe UND Markierungsbeginn: markiert er denselben
   Buchstaben nach Ablauf neu, entsteht ein zweiter Eintrag, statt den ersten
   zu überschreiben. */
function aufnehmen(archiv, id, e, jetzt){
  const reihe = [...(Array.isArray(e.frueher) ? e.frueher : []), { seit: e.seit, farbe: e.farbe, notiz: e.notiz, an: e.an }];
  let neu = 0;
  for (const m of reihe){
    const seit = Number(m.seit) || 0;
    if (!e.zeichen && !m.notiz) continue;
    /* Einträge aus der Zeit vor `seit` (vor dem 22.09.2026) laufen unter
       „@ohne". Bekommt derselbe Buchstabe später sein `seit` (die App trägt
       es beim ersten Laden nach), wird der alte Archiveintrag übernommen,
       statt als zweite Markierung stehen zu bleiben. */
    const schluessel = id + '@' + (seit || 'ohne');
    const ohne = archiv.eintraege[id + '@ohne'];
    const alt = archiv.eintraege[schluessel] || (seit && m === reihe[reihe.length - 1] ? ohne : undefined);
    if (seit && alt === ohne && ohne) delete archiv.eintraege[id + '@ohne'];
    const [sure, vers, wort, pos] = id.split(':').map(Number);
    const eintrag = {
      sure, vers, wort, pos,
      zeichen: e.zeichen || (alt && alt.zeichen) || '',
      farbe: m.farbe || (alt && alt.farbe) || '',
      notiz: m.notiz || (alt && alt.notiz) || '',
      /* Ohne `seit` ist die letzte Änderung der späteste mögliche Tag. */
      markiert: (alt && alt.markiert && !String(alt.markiert).startsWith('spätestens')) ? alt.markiert
        : seit ? new Date(seit).toISOString().slice(0, 10)
        : 'spätestens ' + new Date(e.zeit || jetzt).toISOString().slice(0, 10),
      /* „weggenommen" nur, wenn ER sie entfernt hat — Ablaufen ist kein Wegnehmen. */
      weggenommen: m === reihe[reihe.length - 1] && !e.an ? new Date(e.zeit || jetzt).toISOString().slice(0, 10) : (alt && alt.weggenommen) || '',
      zuletztGesehen: new Date(jetzt).toISOString().slice(0, 10)
    };
    if (!alt) neu++;
    archiv.eintraege[schluessel] = eintrag;
  }
  return neu;
}

const jetzt = Date.now();
const archiv = archivLesen();
archiv._hinweis = 'Tajweed-Markierungen von Elias, nur wachsend. Geführt von werkzeuge/tajweed-markierungen.mjs. '
  + 'Die App blendet eine Markierung nach ' + SICHTBAR_TAGE + ' Tagen aus; hier bleibt sie (sein Wunsch vom 22.09.2026).';
archiv.eintraege = archiv.eintraege || {};

if (!ARG.includes('--nur-liste')){
  let text;
  try { text = kvText(); }
  catch (e){ console.log('⚠️ Geräteabgleich nicht erreichbar (' + String(e.message).split('\n')[0] + ') — zeige nur das Archiv.'); }
  if (text){
    let roh = {};
    try {
      const stand = JSON.parse(text);
      roh = JSON.parse((stand.daten && stand.daten.vt_tajweed) || '{}');
    } catch (e){ console.log('⚠️ vt_tajweed nicht lesbar: ' + e.message); }
    let neu = 0, gesehen = 0;
    for (const [id, e] of Object.entries(roh)){
      if (!e || typeof e !== 'object' || id.split(':').length !== 4) continue;
      gesehen++;
      neu += aufnehmen(archiv, id, e, jetzt);
    }
    archiv.geholtAm = new Date(jetzt).toISOString();
    const tmp = ARCHIV + '.neu';
    fs.writeFileSync(tmp, JSON.stringify(archiv, null, 2) + '\n');
    fs.renameSync(tmp, ARCHIV);
    console.log('Geräteabgleich: ' + gesehen + ' Buchstaben-Einträge, ' + neu + ' neu im Archiv.');
  }
}

const liste = Object.values(archiv.eintraege)
  .sort((a, b) => a.sure - b.sure || a.vers - b.vers || a.wort - b.wort || a.pos - b.pos);
console.log('Archiv: ' + liste.length + ' Markierungen' + (archiv.geholtAm ? ' (zuletzt geholt ' + archiv.geholtAm.slice(0, 16).replace('T', ' ') + ' UTC)' : '') + '\n');
for (const m of liste){
  const tag = String(m.markiert || '').replace('spätestens ', '');
  const alter = tag ? Math.floor((jetzt - Date.parse(tag)) / TAG) : null;
  const zustand = m.weggenommen ? 'von ihm entfernt ' + m.weggenommen
    : (alter !== null && alter >= SICHTBAR_TAGE ? 'ausgeblendet (älter als ' + SICHTBAR_TAGE + ' Tage)' : 'sichtbar');
  console.log(`  ${m.sure}:${m.vers} Wort ${m.wort} · ${m.zeichen} · ${m.farbe} · markiert ${m.markiert || '?'} · ${zustand}`
    + (m.notiz ? '\n      „' + m.notiz + '"' : ''));
}
