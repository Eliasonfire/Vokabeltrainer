/* budget.mjs -- Nutzungsbudget mitschreiben und in Elias' Waehrung umrechnen
 *
 *   node werkzeuge/budget.mjs                       Stand anzeigen
 *   node werkzeuge/budget.mjs --buche 368432 "3 Pruef-Agenten"
 *   node werkzeuge/budget.mjs --schaetze 3 pruefer  Was wuerde das kosten?
 *   node werkzeuge/budget.mjs --stand 63            Elias hat 63 % abgelesen
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
 *
 * --stand SCHLIESST GENAU DIESE LUECKE (nachgetragen 29.07.2026)
 * -------------------------------------------------------------
 * Nennt Elias von sich aus einen Prozentstand ("du hast jetzt 63% erreicht"),
 * war das bisher eine Zahl ohne Ablage - sie stand im Chat und war nach dem
 * naechsten Komprimieren weg. Dabei ist sie die einzige echte Messung, die es
 * ueberhaupt gibt: sie umfasst auch den eigenen Gespraechsverbrauch, den das
 * Buch strukturell nicht kennt.
 *
 * Aus zwei Ablesungen faellt deshalb der Wert heraus, der vorher nirgends stand:
 *
 *   eigenes Arbeiten = (Ablesung - Startstand) x 42.000 - gebuchte Posten
 *
 * Am 29.07. ergab das 597.568 Token in 2,23 h, also rund 267.500 je Stunde.
 * Damit laesst sich zum ersten Mal ausrechnen, ob eine Schicht ihr Budget
 * ueberhaupt erreicht - und was ein Agent im Vergleich zur eigenen Arbeitszeit
 * kostet (ein Pruefer ~28 min, drei ~1,4 h).
 *
 * ⚠️ UND GENAU HIER HAT DAS SKRIPT SEINEN ERSTEN FEHLER GEFANGEN - meinen.
 * Ich hatte den Zeitraum von Hand als "4,24 h" gerechnet, weil ich den
 * gespeicherten Zeitstempel 03:10:49Z als Ortszeit gelesen habe. Er ist aber
 * UTC; Elias' Uhr steht auf UTC+2, die Schicht begann also um 05:10 Ortszeit.
 * Die Haelfte des Zeitraums war frei erfunden - und der Stundensatz damit halb
 * so hoch, wie er ist. Das Skript rechnet die Differenz aus dem Zeitstempel
 * selbst und kann diesen Fehler nicht machen. Merksatz: Zeitspannen nie im Kopf
 * aus ISO-Stempeln bilden, wenn die Anzeige daneben sie schon ausrechnet.
 *
 * ⚠️ Das Ergebnis ist ein STUNDENSATZ, kein Preis je Loop-Ausloesung. In der
 * gemessenen Zeit steckten Ausloesungen UND lange eigene Strecken, ungetrennt.
 * Wer daraus einen Ausloesungspreis teilt, erfindet eine Zahl. */

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
  /* Die Grenze steht seit dem 11.08.2026 im Buch statt fest im Code: Elias hat
     die Schicht an diesem Abend ausdruecklich auf die Laenge SEINES laufenden
     5-h-Fensters begrenzt ("laenger als das sollst du auch nicht arbeiten").
     Eine fest verdrahtete 10 haette das nie gemeldet - und ein Ausloeser ohne
     Gespraechsverlauf haette munter weitergearbeitet. */
  const GRENZE_H = Number.isFinite(b.grenzeStunden) ? b.grenzeStunden : 10;
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
    console.log(`  ⏹  AUFNAHMESTOPP — ${stunden.toFixed(1)} h sind mehr als die vereinbarten ${GRENZE_H}.`);
    console.log('     KEIN Abbruch: keinen NEUEN Punkt mehr anfangen, den laufenden bis zum');
    console.log('     naechsten sicheren Haltepunkt bringen (keine halbe Mehrdatei-Aenderung,');
    console.log('     validate.js gruen, committet und gepusht, Marke geschlossen oder mit Stand).');
    console.log('     Ist der Haltepunkt weit weg: erreichten Teil sichern und pausieren.');
    console.log('     Reissleine 30 min. Dann: Gedaechtnis FINAL vollstaendig, Abschlusszeile,');
    console.log('     Loops mit CronDelete beenden. Elias nicht schreiben - er meldet sich selbst.');
    console.log('');
  }
  if (rest <= 0)                console.log('  ❌ Budget aufgebraucht. Nichts Teures mehr starten, Stand sichern.');
  else if (rest < 200_000)      console.log('  ⚠️  Unter 200k frei: keine Agenten mehr, nur noch selbst arbeiten.');
  else if (rest < AGENT.pruefer * 3) console.log(`  ⚠️  Reicht nicht mehr fuer drei Pruefer (${(3*AGENT.pruefer).toLocaleString('de-DE')}).`);
  else console.log(`  ✅ Reicht noch fuer ~${Math.floor(rest / AGENT.pruefer)} Pruef-Agenten.`);
  console.log('');
  ablesungenZeigen(b, gebucht);
  return rest <= 0 ? 1 : 0;
}

/* Die von Elias abgelesenen Prozentstaende auswerten. Ohne Ablesung bleibt es
   beim alten Hinweis; mit Ablesung wird daraus die einzige echte Messung. */
function ablesungenZeigen(b, gebucht){
  const a = b.ablesungen || [];
  if (!a.length){
    console.log('  Was NICHT drinsteht: der eigene Gespraechsverbrauch. Das Buch ist');
    console.log('  eine Untergrenze, keine Messung - den echten Stand sieht nur Elias.');
    console.log('  Nennt er einen Stand, gehoert er hier hinein:  --stand <prozent>');
    return;
  }

  const letzte = a[a.length - 1];
  const stunden = (new Date(letzte.zeit).getTime() - new Date(b.start).getTime()) / 3600000;
  const punkte = letzte.prozent - b.startProzent;

  console.log(`  Letzte Ablesung von Elias:  ${letzte.prozent} %  (${letzte.zeit})`);
  console.log(`  gegen ${b.startProzent} % bei Anlage, ${stunden.toFixed(2)} h vorher`);

  /* ⛔ WIE ALT IST DIESE ZAHL EIGENTLICH?

     Am 21.08.2026 aufgefallen: das Buch hatte EINE Ablesung (61 % um 02:14),
     und um 07:55 stand hier immer noch „frei 36 %" — mit derselben
     Bestimmtheit wie in der ersten Minute. Dazwischen lag der Reset des
     5-Stunden-Fensters um 07:50, der die Zahl ungueltig macht.

     ⚠️ Der Reset laesst sich hier NICHT ausrechnen — seine Uhrzeit weiss nur
     Elias, und sie steht nirgends. Erfunden wird sie deshalb auch nicht.
     Was geht, ist die Ehrlichkeit: dazusagen, wie alt die Grundlage ist.

     ⭐ Eine Zahl, die dasteht, als wuerde sie fortgeschrieben, waehrend sie
     seit Stunden stillsteht, ist schlimmer als gar keine — man glaubt ihr.
     [[eingefrorenes_feld_ist_kein_zustand]] [[zahlen_ohne_beleg]] */
  const alterH = (Date.now() - new Date(letzte.zeit).getTime()) / 3600000;
  console.log('');
  console.log(`  ⚠️ Diese Ablesung ist ${alterH.toFixed(1)} h alt.`);
  if (alterH >= 5){
    console.log('     Aelter als das 5-Stunden-Fenster — sie ist damit SICHER ueberholt.');
  } else {
    console.log('     Juenger als das Fenster, aber das heisst NICHTS: liegt der Reset');
    console.log('     dazwischen, ist auch eine frische Ablesung ueberholt. Am 21.08.2026');
    console.log('     war sie 3,7 h alt und trotzdem ungueltig — der Reset lag um 07:50,');
    console.log('     die Ablesung um 04:14 Ortszeit.');
  }
  console.log('     Der Stundensatz unten bleibt brauchbar, der freie Rest nicht.');
  console.log('     Abhilfe: Elias nach dem Stand fragen, dann');
  console.log('     `node werkzeuge/budget.mjs --stand <prozent>`.');

  /* Ein Reset macht die Differenz sinnlos - er senkt den Stand, statt ihn zu
     heben. Dann lieber gar nichts rechnen als etwas Falsches ausgeben. */
  if (punkte <= 0){
    console.log('');
    console.log('  ⚠️  Die Ablesung liegt NICHT ueber dem Startstand. Dazwischen lag');
    console.log('     vermutlich ein Reset des Nutzungslimits. Aus solchen Werten');
    console.log('     laesst sich kein Verbrauch ableiten - neu anfangen mit --start.');
    return;
  }

  const echt   = punkte * PRO_PROZENT;
  const eigen  = echt - gebucht;
  console.log('');
  console.log(`  echter Verbrauch     ${String(echt).padStart(9)}  = ${punkte} Punkte`);
  console.log(`  davon gebucht        ${String(gebucht).padStart(9)}  (Agenten u. a.)`);
  console.log(`  => eigenes Arbeiten  ${String(eigen).padStart(9)}`);

  if (eigen <= 0){
    console.log('');
    console.log('  ⚠️  Gebucht ist mehr als abgelesen. Entweder ist ein Posten doppelt');
    console.log('     gebucht, oder die Ablesung ist aelter als der letzte Lauf.');
    return;
  }
  if (stunden < 0.25){
    console.log('');
    console.log('  (Zu kurz seit Anlage fuer einen belastbaren Stundensatz.)');
    return;
  }

  const proStunde = eigen / stunden;
  console.log(`     das sind          ${String(Math.round(proStunde)).padStart(9)}  je Stunde = ${(100*proStunde/GESAMT).toFixed(1)} Punkte/h`);
  console.log('');
  console.log(`  Hochrechnung: 10 h Schicht ≈ ${(10*proStunde/PRO_PROZENT).toFixed(0)} Punkte allein durchs Arbeiten.`);
  console.log(`  Ein Pruef-Agent (${AGENT.pruefer.toLocaleString('de-DE')}) entspricht ${(60*AGENT.pruefer/proStunde).toFixed(0)} Minuten davon.`);
  console.log('');
  console.log('  ⚠️  Das ist ein Stundensatz, KEIN Preis je Loop-Ausloesung - in der');
  console.log('     Zeit steckten Ausloesungen und lange eigene Strecken, ungetrennt.');
}

const args = process.argv.slice(2);
const wert = n => { const i = args.indexOf(n); return i === -1 ? undefined : args[i + 1]; };

if (args.includes('--start')){
  const i = args.indexOf('--start');
  const startProzent = Number(args[i + 1]), budgetProzent = Number(args[i + 2]);
  if (!Number.isFinite(startProzent) || !Number.isFinite(budgetProzent)){
    console.error('Aufruf: --start <Stand in %> <Budget in Punkten> [Grenze in Stunden]'); process.exit(1);
  }
  /* Dritter Wert optional: die Schichtlaenge. Ohne Angabe bleibt es bei den 10 h
     aus Elias' Vorgabe vom 29.07.2026. */
  const grenzeRoh = Number(args[i + 3]);
  const grenzeStunden = Number.isFinite(grenzeRoh) && grenzeRoh > 0 ? grenzeRoh : 10;
  sichern({ start: new Date().toISOString(), startProzent, budgetProzent, grenzeStunden, posten: [] });
  console.log(`Angelegt: Stand ${startProzent} %, Budget ${budgetProzent} Punkte = ${(budgetProzent*PRO_PROZENT).toLocaleString('de-DE')} Token.`);
  console.log(`Schichtgrenze: ${grenzeStunden} h.`);
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

if (args.includes('--stand')){
  const b = laden();
  if (!b){ console.error('Kein Haushaltsbuch. Erst --start.'); process.exit(1); }
  const prozent = Number(wert('--stand'));
  if (!Number.isFinite(prozent) || prozent < 0 || prozent > 100){
    console.error('--stand braucht einen Prozentwert zwischen 0 und 100, so wie Elias ihn abliest.');
    process.exit(1);
  }
  /* Ein Zeitstempel darf mitgegeben werden, falls die Ablesung schon eine Weile
     her ist - sonst zaehlt jetzt. Sonst verschiebt sich der Stundensatz. */
  const zeit = wert('--zeit') || new Date().toISOString();
  if (Number.isNaN(new Date(zeit).getTime())){
    console.error(`--zeit "${zeit}" ist kein lesbares Datum.`); process.exit(1);
  }
  (b.ablesungen ||= []).push({ zeit, prozent });
  sichern(b);
  console.log(`Notiert: Elias liest ${prozent} % ab (${zeit}).\n`);
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
