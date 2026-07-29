/* budget.mjs -- Nutzungsbudget mitschreiben und in Elias' Waehrung umrechnen
 *
 *   node werkzeuge/budget.mjs                       Stand anzeigen
 *   node werkzeuge/budget.mjs --buche 368432 "3 Pruef-Agenten"
 *   node werkzeuge/budget.mjs --schaetze 3 pruefer  Was wuerde das kosten?
 *
 * WARUM ES DAS GIBT (29.07.2026)
 * ------------------------------
 * Elias hat den entscheidenden Umrechnungsfaktor genannt: 1 % seines
 * Nutzungslimits entspricht rund 42.000 Token. Damit laesst sich zum ersten Mal
 * in SEINER Waehrung rechnen. Gegenprobe, die den Faktor bestaetigt: der
 * 65-Agenten-Lauf vom 27.07. kostete 4.156.721 Token = 99,0 % - und ist
 * unabhaengig davon als "hat fast das gesamte Limit aufgebraucht" dokumentiert.
 *
 * WAS DIESES SKRIPT NICHT KANN, und das ist wichtig:
 * Es liest den Zaehlerstand NICHT. Dafuer gibt es kein Werkzeug - die Prozentzahl
 * sieht nur Elias auf seinem Schirm. Dieses Skript fuehrt ein HAUSHALTSBUCH:
 * was hier gebucht wird, ist bekannt; was niemand bucht, fehlt. Es ist also
 * eine Untergrenze des Verbrauchs, keine Messung.
 *
 * Genau fuer den teuersten Posten ist das aber exakt: Agentenlaeufe melden ihre
 * `subagent_tokens` am Ende selbst. Die gehoeren gebucht, sobald sie dastehen.
 * Der eigene Gespraechsverbrauch bleibt Schaetzung. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const BUCH = path.join(HIER, '..', '.budget.json');   // gitignored, rein lokal

const PRO_PROZENT = 42_000;
const GESAMT = 100 * PRO_PROZENT;

/* Kosten je Agentenart, aus der Messtabelle in agenten_sparsam_nutzen.md */
const AGENT = { einfach: 62_000, pruefer: 123_000, sockel: 50_000, werkzeug: 2_100 };

function laden(){
  if (!fs.existsSync(BUCH)) return null;
  return JSON.parse(fs.readFileSync(BUCH, 'utf8'));
}
function sichern(b){ fs.writeFileSync(BUCH, JSON.stringify(b, null, 2) + '\n', 'utf8'); }

const pz = t => (100 * t / GESAMT).toFixed(1) + ' %';

function stand(){
  const b = laden();
  if (!b){
    console.log('Noch kein Haushaltsbuch. Anlegen mit:');
    console.log('  node werkzeuge/budget.mjs --start 40 36   (Stand 40 %, heute 36 Punkte frei)');
    return 0;
  }
  const gebucht = b.posten.reduce((s, p) => s + p.token, 0);
  const budget = b.budgetProzent * PRO_PROZENT;
  const rest = budget - gebucht;

  /* Der Anlagezeitpunkt ist zugleich der Schichtbeginn. Elias hat am 29.07.26
     eine Obergrenze von 10 Stunden gesetzt - nicht weil die Uhr der Engpass
     waere (das Budget laeuft meist frueher aus), sondern damit der Loop nicht
     in den naechsten Tag hineinfeuert, waehrend er in der Uni ist. */
  const GRENZE_H = 10;
  const stunden = (Date.now() - new Date(b.start).getTime()) / 3600000;

  console.log(`Haushaltsbuch, angelegt ${b.start}`);
  console.log(`  Stand bei Anlage      ${b.startProzent} %`);
  console.log(`  Budget fuer den Lauf  ${b.budgetProzent} Punkte = ${budget.toLocaleString('de-DE')} Token`);
  console.log(`  Schicht laeuft seit   ${stunden.toFixed(1)} h  (Grenze ${GRENZE_H} h)`);
  console.log('');
  for (const p of b.posten)
    console.log(`  ${String(p.token).padStart(9)}  ${pz(p.token).padStart(7)}  ${p.was}`);
  console.log('');
  console.log(`  gebucht  ${String(gebucht).padStart(9)}  = ${(100*gebucht/budget).toFixed(0)} % des Budgets`);
  console.log(`  frei     ${String(rest).padStart(9)}  = ${pz(rest)} des Gesamtlimits`);
  console.log('');
  if (stunden > GRENZE_H){
    console.log(`  ⏹  SCHICHTENDE — ${stunden.toFixed(1)} h sind mehr als die vereinbarten ${GRENZE_H}.`);
    console.log('     Stand sichern, Abschlusszeile in die To-Do, Loops mit CronDelete beenden.');
    console.log('     Elias trotzdem nicht schreiben - er meldet sich selbst.');
    console.log('');
  }
  if (rest <= 0)                console.log('  ❌ Budget aufgebraucht. Nichts Teures mehr starten, Stand sichern.');
  else if (rest < 200_000)      console.log('  ⚠️  Unter 200k frei: keine Agenten mehr, nur noch selbst arbeiten.');
  else if (rest < AGENT.pruefer * 3) console.log(`  ⚠️  Reicht nicht mehr fuer drei Pruefer (${(3*AGENT.pruefer).toLocaleString('de-DE')}).`);
  else console.log(`  ✅ Reicht noch fuer ~${Math.floor(rest / AGENT.pruefer)} Pruef-Agenten.`);
  console.log('');
  console.log('  Was NICHT drinsteht: der eigene Gespraechsverbrauch. Das Buch ist');
  console.log('  eine Untergrenze, keine Messung - den echten Stand sieht nur Elias.');
  return rest <= 0 ? 1 : 0;
}

const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i === -1 ? undefined : args[i + 1]; };

if (args.includes('--start')){
  const i = args.indexOf('--start');
  const startProzent = Number(args[i + 1]), budgetProzent = Number(args[i + 2]);
  if (!Number.isFinite(startProzent) || !Number.isFinite(budgetProzent)){
    console.error('Aufruf: --start <Stand in %> <Budget in Punkten>'); process.exit(1);
  }
  sichern({ start: new Date().toISOString(), startProzent, budgetProzent, posten: [] });
  console.log(`Angelegt: Stand ${startProzent} %, Budget ${budgetProzent} Punkte = ${(budgetProzent*PRO_PROZENT).toLocaleString('de-DE')} Token.`);
  process.exit(0);
}

if (args.includes('--buche')){
  const b = laden();
  if (!b){ console.error('Kein Haushaltsbuch. Erst --start.'); process.exit(1); }
  const token = Number(wert('--buche'));
  const was = args[args.indexOf('--buche') + 2] || 'ohne Angabe';
  if (!Number.isFinite(token) || token <= 0){ console.error('--buche braucht eine Tokenzahl.'); process.exit(1); }
  b.posten.push({ token, was });
  sichern(b);
  console.log(`Gebucht: ${token.toLocaleString('de-DE')} (${pz(token)}) - ${was}\n`);
  process.exit(stand());
}

if (args.includes('--schaetze')){
  const n = Number(args[args.indexOf('--schaetze') + 1]) || 1;
  const art = (args[args.indexOf('--schaetze') + 2] || 'einfach').toLowerCase();
  const je = art.startsWith('pru') ? AGENT.pruefer : AGENT.einfach;
  const t = n * je;
  console.log(`${n} Agent(en), Art "${art}": rund ${t.toLocaleString('de-DE')} Token = ${pz(t)} des Limits.`);
  const b = laden();
  if (b){
    const frei = b.budgetProzent * PRO_PROZENT - b.posten.reduce((s, p) => s + p.token, 0);
    console.log(`Das sind ${(100*t/frei).toFixed(0)} % dessen, was heute noch frei ist.`);
    if (t > frei) console.log('❌ Passt nicht mehr ins Budget.');
  }
  console.log(`Wellen: ${Math.ceil(n/14)} × 10-15 min.`);
  process.exit(0);
}

process.exit(stand());
