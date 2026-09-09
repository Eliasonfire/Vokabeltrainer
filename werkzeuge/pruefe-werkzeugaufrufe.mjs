/* pruefe-werkzeugaufrufe.mjs — laeuft das Werkzeug auf SEINEM Rechner ueberhaupt?
 * ==========================================================================
 *
 * ⛔⛔ DER ANLASS (09.09.2026)
 *
 * `werkzeuge/vorschlaege-holen.mjs` holt aus dem Cloudflare-KV, welche
 * Eselsbruecken Elias abgelehnt hat. Es lief auf seinem Rechner **nie**: es
 * rief `npx.cmd` direkt mit `execFileSync` auf, und seit Node 20 wirft das
 * unter Windows `EINVAL`. Jeder Aufruf endete mit einer Fehlermeldung und dem
 * Rat, es von Hand zu tun.
 *
 * ⭐ Der Schaden war nicht der Absturz, sondern was er verdeckt hat: das
 * Werkzeug sah aus wie eines OHNE AUFRUFER — „braucht wohl niemand" — und war
 * eines, das gar nicht laufen KONNTE. Am 09.09.2026 stellte sich beim ersten
 * geglueckten Lauf heraus, dass eine Ablehnung von Elias seit Stunden
 * unbearbeitet lag. [[werkzeug_ohne_aufrufer]] [[ein_weg_geht_der_andere_nicht]]
 *
 * ⚠️ Und die Loesung stand seit dem 20.08.2026 in `werkzeuge/vorrat.mjs`, mit
 * Begruendung — nur eben dort. Dieselbe Entscheidung, zwei Werkzeuge, und das
 * zweite blieb kaputt. [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ==========================================================================
 * DIE REGEL
 *
 *   execFileSync / spawnSync auf `npx` ODER `npx.cmd`
 *     -> unter Windows MUSS es ueber `cmd /c` laufen.
 *
 * `execSync` ist ausgenommen und zwar mit Grund: es startet ohnehin eine
 * Shell, und dort ist `npx.cmd` richtig. So macht es veroeffentlichen.mjs
 * seit Monaten, und es funktioniert. Eine Regel, die auch das meldet, waere
 * eine, die man nach dem dritten Fehlalarm abschaltet.
 * [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * Aufruf:  node werkzeuge/pruefe-werkzeugaufrufe.mjs
 * Exit 0 = jeder npx-Aufruf ueberlebt Windows · 1 = Stoertest greift nicht
 *       2 = ein Werkzeug kann auf seinem Rechner nicht laufen
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte, zeileVon } from './js-quelltext.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELBST = 'pruefe-werkzeugaufrufe.mjs';

/* ⚠️ Gesucht wird auf kommentarfreiem Quelltext MIT Zeichenketten: der
   Programmname steht in Anfuehrungszeichen, die Warnung davor im Kommentar.
   Ohne das Strippen faende der Pruefer seine eigene Beschreibung.
   [[stichworttreffer_im_kommentar]] */
const AUFRUF = /\b(execFileSync|spawnSync)\s*\(\s*([^,]{0,120}?)\s*,/g;

function pruefeDatei(text){
  const maske = ohneKommentareUndTexte(text, { texte: false });
  const raus = [];
  let m; AUFRUF.lastIndex = 0;
  while ((m = AUFRUF.exec(maske))){
    const erstes = m[2];
    /* Nur Aufrufe, bei denen npx im Spiel ist. */
    if (!/npx/.test(erstes) && !/npx/.test(maske.slice(m.index, m.index + 260))) continue;
    /* Der heile Weg: das ausgefuehrte Programm ist `cmd` (oder eine Variable,
       die zwischen 'cmd' und 'npx' waehlt), und `/c` steht in den Argumenten.

       ⛔ Das Fenster reicht auch NACH VORN. In werkzeuge/vorrat.mjs steht die
       Wahl drei Zeilen vor dem Aufruf (`const befehl = win ? 'cmd' : 'npx';`),
       und ein Fenster, das erst beim Aufruf beginnt, meldete den heilen Fall
       als Befund. Aufgefallen ist es nur, weil die einzige Fundstelle eine
       war, von der ich WUSSTE, dass sie in Ordnung ist.
       [[mein_neues_werkzeug_ist_verdaechtig]] */
    const umfeld = maske.slice(Math.max(0, m.index - 400), m.index + 300);
    const ueberCmd = /['"]cmd['"]/.test(umfeld) && /['"]\/c['"]/.test(umfeld);
    if (ueberCmd) continue;
    raus.push({ pos: m.index, was: m[1], erstes: erstes.trim().slice(0, 60) });
  }
  return raus;
}

/* ---------- Lauf ---------- */
console.log('--- npx-Aufrufe, die Windows ueberleben muessen ---\n');
const dateien = fs.readdirSync(path.join(REPO, 'werkzeuge'))
  .filter(f => /\.(mjs|js)$/.test(f) && f !== SELBST)
  .map(f => ({ rel: 'werkzeuge/' + f, voll: path.join(REPO, 'werkzeuge', f) }))
  .concat(fs.readdirSync(REPO).filter(f => /\.(mjs|js)$/.test(f))
    .map(f => ({ rel: f, voll: path.join(REPO, f) })));

let befunde = 0, gesehen = 0;
for (const d of dateien){
  const text = fs.readFileSync(d.voll, 'utf8');
  if (!/npx/.test(text)) continue;
  gesehen++;
  for (const t of pruefeDatei(text)){
    befunde++;
    console.log('  ⛔ ' + d.rel + ':' + zeileVon(text, t.pos) + '  ' + t.was + '(' + t.erstes + ' …)');
    console.log('     Auf Windows wirft das EINVAL. Richtig ist:');
    console.log("       const win = process.platform === 'win32';");
    console.log("       execFileSync(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args, …)");
  }
}
console.log('  ' + gesehen + ' Datei(en) nennen npx, ' + befunde + ' Befund(e).');

/* ---------- ⛔ STOERTEST ----------
   Ein Pruefer, dessen Muster nichts mehr findet, meldet dasselbe wie einer,
   der nichts zu melden hat. [[stoertest_muss_wirkung_nachweisen]] */
console.log('');
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const kaputt = "const r = execFileSync('npx.cmd', ['wrangler', 'kv'], { cwd: X });";
  const heil   = "const win = process.platform === 'win32';\n"
    + "const r = execFileSync(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args, { cwd: X });";
  const shell  = "execSync('npx.cmd wrangler pages deploy', { stdio: 'inherit' });";
  const fremd  = "execFileSync('git', ['status'], { cwd: X });";
  /* ⭐ Die Form, die vorrat.mjs benutzt: die Wahl steht in einer VARIABLEN,
     Zeilen vor dem Aufruf. Genau daran ist die erste Fassung dieses Pruefers
     gescheitert. */
  const ueberVariable = "const win = process.platform === 'win32';\n"
    + "const befehl = win ? 'cmd' : 'npx';\n"
    + "const args = ['wrangler@4.124.0', 'kv', 'key', 'get'];\n"
    + "const t = execFileSync(befehl, win ? ['/c', 'npx', ...args] : args, { cwd: W });";
  sProbe('der direkte npx.cmd-Aufruf wird gemeldet', pruefeDatei(kaputt).length, 1);
  sProbe('die reparierte Fassung nicht',             pruefeDatei(heil).length, 0);
  sProbe('auch die Fassung mit Variable nicht',      pruefeDatei(ueberVariable).length, 0);
  sProbe('execSync bleibt aussen vor (Shell)',       pruefeDatei(shell).length, 0);
  sProbe('ein Aufruf ohne npx auch',                 pruefeDatei(fremd).length, 0);
  /* ⚠️ Und die Probe auf die Probe: findet der Lauf ueberhaupt Dateien? */
  sProbe('es wurden Dateien mit npx gefunden (>= 2)', gesehen >= 2, true);
}
if (stoer){
  console.log('');
  console.log('⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht.');
  process.exit(1);
}

console.log('');
if (befunde){
  console.log('⛔ ' + befunde + ' Werkzeug(e) koennen auf Elias’ Rechner nicht laufen.');
  process.exit(2);
}
console.log('✅ Jeder npx-Aufruf geht ueber cmd /c oder eine Shell — die Werkzeuge laufen bei ihm.');
