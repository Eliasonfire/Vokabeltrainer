/* neue-kapitel.mjs — Hakt Elias in seiner App neue Kapitel an und bleibt das
 * länger als eine Stunde so, bekommen genau diese Kapitel das volle Programm.
 * =====================================================================
 *
 * WARUM ES DIESES WERKZEUG GIBT
 *
 * Elias am 22.09.2026, als Kommentar auf der Seite „Was auf dich wartet":
 *
 *   „hatten wir nicht gesagt das wnen ich bis zu drei neue kapitel anhacke das
 *    dann sobald du es weißt und es länger als 1h auch so bleibt (also nicht nur
 *    testweiße oder zum gucken mal freigeschcaltet und wieder weg gemacht) das
 *    du dann das volle programm machst und damit einhergehend beispielsätze und
 *    so weiter?"
 *
 * und danach: „das bild welches ich dir geschickt habe, falls das der wahrheit
 * entspricht, dass wir dafür kein system haben sollst du das system einführen
 * welches ich dir dort beschrieben habe".
 *
 * Bis dahin gab es nur die Wartung am Mittwoch und Sonntag (Schritt 1c): ein
 * neues Kapitel bekam das volle Programm frühestens am nächsten dieser Tage, und
 * ein kurz zum Anschauen angehaktes Kapitel wurde mitgenommen, wenn es gerade
 * beim Lauf angehakt war. Seine drei Bedingungen, einzeln:
 *
 *   „bis zu drei neue kapitel"   HOECHSTENS = 3 je Buch. Mehr auf einmal ist
 *                                Anschauen, kein Lernschritt — seine Worte vom
 *                                19.08.2026: „es könnte sein das ich zb aus
 *                                interesse alle kapitel oder alle bücher auswähle
 *                                (dann soll es natürlich nicht ausschlagen) aber
 *                                1-3 kapitel sind realistisch."
 *   „sobald du es weißt"          die Aufgabe „Vokabeltrainer neue Kapitel
 *                                (stuendlich)" ruft --tor jede Stunde auf
 *   „länger als 1h auch so bleibt" HALTEZEIT_MS. Ein Kapitel, das zwischendurch
 *                                wieder abgewählt ist, fängt von vorn an.
 *
 * Und das „volle Programm" ist keine Improvisation: es steht in
 * VOLLES-PROGRAMM.md, und die Routine arbeitet es mit
 * `vorrat.mjs --nur-kapitel` für genau die gemeldeten Kapitel ab.
 *
 * WAS „NEU" HEISST
 *
 * Neu ist ein Kapitel, das in seiner App-Auswahl (vt_settings.buecher, aus dem
 * Geräteabgleich) steht, aber von keiner Bearbeitung erfasst ist:
 *   - nicht im Fenster der Wartung (FREIGESCHALTET in js/kern.js UND höchstens
 *     drei Kapitel über seiner Angabe in data/lernstand.json — genau das, was
 *     vorrat.mjs am Mittwoch und Sonntag misst), und
 *   - nicht schon von diesem Werkzeug abgeschlossen (`bekannt`, wächst nur: Ab-
 *     und wieder Anwählen löst keine zweite Bearbeitung aus).
 * ⭐ Gemessen am 22.09.2026, beim Bau: Bayna Yadayk 1 Kapitel 3 stand in seiner
 * Auswahl und in seiner Angabe (3), in js/kern.js aber noch [1,2] — die Wartung
 * hat es deshalb nie gemessen, und `vorrat.mjs --nur-kapitel bayna-yadayk-1:3`
 * fand 11 von 11 Wörtern unvollständig. Die Angabe allein beweist also keine
 * Bearbeitung; das Fenster schon.
 *
 * AUFRUFE
 *
 *   node werkzeuge/neue-kapitel.mjs --tor        stündlich, als Vorprüfung in
 *        run-routine.ps1. Exit 0 = Auftrag erteilt, die Routine startet.
 *        Exit 3 = nichts zu tun. Exit 1 = die Prüfung selbst ging nicht.
 *   node werkzeuge/neue-kapitel.mjs --auftrag    zeigt den erteilten Auftrag
 *        (Exit 0) oder sagt, dass keiner da ist (Exit 3)
 *   node werkzeuge/neue-kapitel.mjs --erledigt [--notiz "..."]
 *        schließt den Auftrag ab — erst NACH dem Ausliefern
 *   node werkzeuge/neue-kapitel.mjs              Stand anzeigen
 *
 *   Für Tests: --kv <datei> statt des Abrufs, --zustand <datei>, --jetzt <ms|ISO>,
 *              --kern <datei> (statt js/kern.js), --lernstand <datei>,
 *              --marke <datei> (statt .arbeit.json)
 *
 * ⛔ Der Zustand liegt in Automation/.state/ (nicht im Repo): er hält fest, wann
 * Elias etwas angehakt hat, und das Repo ist öffentlich.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mitWiederholung } from './kv-abruf.mjs';

const HIER   = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');

export const ZUSTAND_STANDARD = path.resolve(WURZEL, '..', 'Automation', '.state', 'neue-kapitel.json');
/* „länger als 1h" — also echt größer, nicht größer-gleich. */
export const HALTEZEIT_MS = 60 * 60 * 1000;
/* „bis zu drei neue kapitel" — je Buch, wie der Lernschritt in vorrat.mjs. */
export const HOECHSTENS = 3;
/* Das Fenster der Wartung: Angabe + 3, wie FENSTER in vorrat.mjs. */
export const FENSTER = 3;
/* Ein erteilter Auftrag ohne Abschluss: die Routine darf bis zu zwei Stunden
   laufen (TimeLimit PT2H), danach ist sie gestorben. Nach vier Stunden gibt es
   EINEN zweiten Versuch — mehr nicht, sonst kostet ein Fehler im Prompt jede
   Stunde einen ganzen Lauf. */
export const NEUVERSUCH_NACH_MS = 4 * 60 * 60 * 1000;
export const HOECHSTENS_VERSUCHE = 2;

const bis = n => (typeof n === 'number' && n > 0) ? Array.from({ length: n }, (_, i) => i + 1) : [];
const vereinige = (a, b) => [...new Set([...(a || []), ...(b || [])])].sort((x, y) => x - y);
export const uhr = ms => new Date(ms).toLocaleString('de-DE', {
  timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const kapitelText = (m) => Object.entries(m || {}).map(([b, ks]) => `${b} Kapitel ${ks.join(', ')}`).join(' | ');

/* ---------- Geräteabgleich lesen ---------- */

/* Die Auswahl steht in vt_settings.buecher, kapitelgenau und UNSORTIERT (am
   19.08.2026 gelesen: [1,2,3,5,4,…]) — deshalb hier sortiert und entdoppelt. */
export function auswahlLesen(text){
  const roh = JSON.parse(text);
  const s = JSON.parse((roh.daten && roh.daten.vt_settings) || '{}');
  const auswahl = {};
  for (const [b, liste] of Object.entries(s.buecher || {})){
    const ks = vereinige([], (Array.isArray(liste) ? liste : []).map(Number)
      .filter(n => Number.isInteger(n) && n > 0));
    if (ks.length) auswahl[b] = ks;
  }
  const st = Number(roh.stempel && roh.stempel.vt_settings);
  return { auswahl, stempel: Number.isFinite(st) && st > 0 ? st : null };
}

function kvHolen(){
  const NS = (fs.readFileSync(path.join(WURZEL, 'wrangler.toml'), 'utf8').match(/id\s*=\s*"([0-9a-f]{32})"/) || [])[1];
  if (!NS) throw new Error('KV-Namensraum nicht in wrangler.toml gefunden');
  const SCHLUESSEL = 'stand:' + (process.env.VT_MAIL || 'abdurahman.tunk@gmail.com');
  /* Derselbe Weg wie vorrat.mjs --app auto: unter Windows über cmd /c, sonst
     ENOENT (npx heißt npx.cmd) oder EINVAL (Node 20 startet .cmd nicht direkt). */
  const win = process.platform === 'win32';
  const args = ['wrangler@4.124.0', 'kv', 'key', 'get', '--namespace-id=' + NS, SCHLUESSEL, '--remote'];
  return mitWiederholung(win ? 'cmd' : 'npx', win ? ['/c', 'npx', ...args] : args,
    { cwd: WURZEL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 180000 }).text;
}

function angabeLesen(datei = path.join(WURZEL, 'data', 'lernstand.json')){
  try { return JSON.parse(fs.readFileSync(datei, 'utf8')).angabe || {}; }
  catch (e) { return {}; }
}

/* FREIGESCHALTET aus js/kern.js — dieselbe Lesart wie freischaltungLesen() in
   vorrat.mjs. ⛔ Fehlt der Block, wird das LAUT (Exit 1), nicht als „nichts
   freigeschaltet" gelesen: sonst wäre jedes angehakte Kapitel neu. */
export function freiLesen(datei = path.join(WURZEL, 'js', 'kern.js')){
  const block = fs.readFileSync(datei, 'utf8').match(/const FREIGESCHALTET = \{([\s\S]*?)\};/);
  if (!block) throw new Error('FREIGESCHALTET nicht gefunden in ' + datei);
  const frei = {};
  block[1].split(/\r?\n/).forEach(zeile => {
    const m = zeile.match(/'([^']+)'\s*:\s*\[([^\]]*)\]/);
    if (m) frei[m[1]] = vereinige([], m[2].split(',').map(x => Number(x.trim())).filter(n => Number.isInteger(n) && n > 0));
  });
  return frei;
}

/* Was die Wartung ohnehin bearbeitet: freigeschaltet UND im Fenster seiner Angabe. */
export function imFenster(frei, angabe, b){
  if (typeof angabe[b] !== 'number') return [];
  return (frei[b] || []).filter(k => k <= angabe[b] + FENSTER);
}

const hatDatenStandard = b => fs.existsSync(path.join(WURZEL, 'data', 'vokabeln-' + b + '.js'));

/* Die Arbeitsmarke (werkzeuge/arbeit.mjs, .arbeit.json): die Wartung setzt sie in
   Schritt 0 und nimmt sie am Ende weg. Eine Marke älter als drei Stunden gilt als
   liegengeblieben (die Wartung darf zwei Stunden laufen) und sperrt nicht mehr —
   sonst hielte ein abgestürzter Lauf dieses Werkzeug für immer an. */
export function sperreLesen(datei, jetzt){
  try {
    const m = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const seit = Date.parse(m.begonnen);
    if (Number.isFinite(seit) && jetzt - seit < 3 * 60 * 60 * 1000)
      return 'andere Arbeit laeuft im Repo (' + String(m.was || '?').normalize('NFKD').replace(/[^\x20-\x7e]/g, '')
        + ', seit ' + uhr(seit) + ')';
  } catch (e) { /* keine Marke: frei */ }
  return null;
}

/* ---------- Zustand ---------- */

export function zustandLesen(datei = ZUSTAND_STANDARD){
  try { return JSON.parse(fs.readFileSync(datei, 'utf8')); }
  catch (e) { return null; }
}

function zustandSchreiben(datei, z){
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  /* Erst daneben schreiben, dann umbenennen: bricht der Lauf mitten im Schreiben
     ab, bleibt der alte Zustand stehen statt einer leeren Datei. */
  fs.writeFileSync(datei + '.neu', JSON.stringify(z, null, 2) + '\n', 'utf8');
  fs.renameSync(datei + '.neu', datei);
}

/* ---------- Der eigentliche Schritt — ohne Ein- und Ausgabe, damit testbar ----------

   Gibt den neuen Zustand zurück, die Zeilen für die Ausgabe und — falls ein
   Auftrag zu erteilen ist — die Kapitel dafür. */
export function schritt(alt, { auswahl, stempel, jetzt, angabe = {}, frei = {}, hatDaten = () => true, gesperrt = null }){
  const z = JSON.parse(JSON.stringify(alt || {}));
  const zeilen = [];
  z.bekannt = z.bekannt || {};
  z.beobachtet = z.beobachtet || {};
  z.verlauf = z.verlauf || [];
  /* Nur zur Auskunft: seit wann dieses Werkzeug zusieht. Einen „Grundstand",
     der die damalige Auswahl als erledigt verbucht, gibt es bewusst NICHT —
     sonst wäre Bayna Yadayk 1 Kapitel 3 (siehe Kopf) nie bearbeitet worden. */
  z.grundstand = z.grundstand || jetzt;
  z.letzterBlick = jetzt;

  const imAuftrag = b => (z.auftrag && z.auftrag.kapitel && z.auftrag.kapitel[b]) || [];

  /* 1. Welche Kapitel sind neu? */
  const neuJeBuch = {};
  for (const [b, ks] of Object.entries(auswahl)){
    const basis = new Set([...(z.bekannt[b] || []), ...imFenster(frei, angabe, b), ...imAuftrag(b)]);
    const neu = ks.filter(k => !basis.has(k));
    if (!neu.length) continue;
    if (!hatDaten(b)){
      zeilen.push(`${b}: Kapitel ${neu.join(', ')} angehakt, aber keine Vokabeldatei data/vokabeln-${b}.js — uebersprungen`);
      continue;
    }
    neuJeBuch[b] = neu;
  }

  /* 2. Beobachtung nachführen. Wer zwischendurch abgewählt wurde, fällt heraus
     und fängt beim nächsten Anhaken von vorn an — „nicht nur testweiße oder zum
     gucken mal freigeschcaltet und wieder weg gemacht".

     ⭐ Beim ERSTEN Sehen zählt der Zeitstempel des Abgleichs, nicht die Uhr
     dieses Laufs: stand das Kapitel schon im zuletzt geschriebenen Stand, ist es
     mindestens seit diesem Stempel angehakt. Sonst käme zur Stunde Haltezeit
     noch bis zu eine Stunde Wartezeit auf den nächsten Blick dazu. */
  const beob = {};
  for (const [b, neu] of Object.entries(neuJeBuch)){
    beob[b] = {};
    for (const k of neu){
      const vorher = z.beobachtet[b] && z.beobachtet[b][k];
      beob[b][k] = vorher != null ? vorher : ((stempel && stempel <= jetzt) ? stempel : jetzt);
    }
  }
  for (const [b, m] of Object.entries(z.beobachtet))
    for (const k of Object.keys(m))
      if (!(beob[b] && beob[b][k] != null))
        zeilen.push(`${b} Kapitel ${k}: wieder abgewaehlt oder schon bekannt — zaehlt nicht mehr`);
  z.beobachtet = beob;

  /* 3. Was ist fällig? Ein Buch wird erst bearbeitet, wenn ALLE seine neuen
     Kapitel die Haltezeit hinter sich haben — sonst liefe die Routine für
     dasselbe Buch zweimal kurz hintereinander. */
  const faellig = {};
  let wartend = 0;
  for (const [b, m] of Object.entries(z.beobachtet)){
    const ks = Object.keys(m).map(Number).sort((x, y) => x - y);
    if (ks.length > HOECHSTENS){
      zeilen.push(`${b}: ${ks.length} neue Kapitel auf einmal (${ks.join(', ')}) — mehr als ${HOECHSTENS}, das ist Anschauen und kein Lernschritt. Kein volles Programm.`);
      continue;
    }
    const juengstes = Math.max(...ks.map(k => m[k]));
    const alter = jetzt - juengstes;
    if (alter > HALTEZEIT_MS) faellig[b] = ks;
    else {
      wartend += ks.length;
      zeilen.push(`${b}: Kapitel ${ks.join(', ')} angehakt seit ${uhr(juengstes)} — noch ${Math.ceil((HALTEZEIT_MS - alter) / 60000) || 1} min bis zur vollen Stunde`);
    }
  }

  /* 3b. Arbeitet gerade jemand im Repo (die Wartung, eine Sitzung mit
     Arbeitsmarke)? Dann wird beobachtet, aber nichts erteilt — zwei Läufe, die
     dieselben Eselsbrücken- und Satzdateien schreiben, überschreiben sich. */
  if (gesperrt){
    const was = Object.keys(faellig).length ? 'faellig waere ' + kapitelText(faellig) + ', aber ' : '';
    zeilen.push(was + gesperrt + ' — naechster Blick in einer Stunde');
    return { zustand: z, zeilen, auftrag: null, kurz: gesperrt };
  }

  /* 4. Ein Auftrag steht noch aus? Dann nichts Neues erteilen. */
  if (z.auftrag){
    const offenSeit = jetzt - z.auftrag.erteilt;
    if (offenSeit < NEUVERSUCH_NACH_MS){
      zeilen.push(`Auftrag vom ${uhr(z.auftrag.erteilt)} (${kapitelText(z.auftrag.kapitel)}) laeuft oder wartet auf --erledigt`);
      return { zustand: z, zeilen, auftrag: null, kurz: 'Auftrag vom ' + uhr(z.auftrag.erteilt) + ' noch offen' };
    }
    if ((z.auftrag.versuche || 1) < HOECHSTENS_VERSUCHE){
      z.auftrag.versuche = (z.auftrag.versuche || 1) + 1;
      z.auftrag.erteilt = jetzt;
      zeilen.push(`Auftrag (${kapitelText(z.auftrag.kapitel)}) blieb ohne Abschluss — Versuch ${z.auftrag.versuche} von ${HOECHSTENS_VERSUCHE}`);
      return { zustand: z, zeilen, auftrag: z.auftrag, kurz: 'AUFTRAG erneut (Versuch ' + z.auftrag.versuche + '): ' + kapitelText(z.auftrag.kapitel) };
    }
    /* Aufgeben, und zwar sichtbar: die Kapitel gelten als bekannt, damit nicht
       jede Stunde ein neuer Lauf entsteht. Die Wartung am Mittwoch und Sonntag
       misst sein Fenster ohnehin und fängt auf, was hier liegen blieb. */
    z.verlauf.push({ ...z.auftrag, aufgegeben: jetzt });
    for (const [b, ks] of Object.entries(z.auftrag.kapitel)) z.bekannt[b] = vereinige(z.bekannt[b], ks);
    zeilen.push(`⚠️ Auftrag (${kapitelText(z.auftrag.kapitel)}) ${HOECHSTENS_VERSUCHE}x ohne Abschluss — aufgegeben. Gehoert in den Bericht der naechsten Wartung.`);
    z.auftrag = null;
  }

  if (!Object.keys(faellig).length){
    const kurz = wartend ? `${wartend} neue(s) Kapitel wartet auf die volle Stunde` : 'keine neuen Kapitel';
    return { zustand: z, zeilen, auftrag: null, kurz };
  }

  /* 5. Auftrag erteilen. Die Kapitel wandern aus der Beobachtung in den
     Auftrag; bekannt werden sie erst mit --erledigt. */
  const seit = {};
  for (const [b, ks] of Object.entries(faellig)){
    seit[b] = {};
    for (const k of ks) seit[b][k] = z.beobachtet[b][k];
    delete z.beobachtet[b];
  }
  z.auftrag = { erteilt: jetzt, erstmals: jetzt, versuche: 1, kapitel: faellig, angehaktSeit: seit };
  zeilen.push('AUFTRAG: das volle Programm fuer ' + kapitelText(faellig));
  return { zustand: z, zeilen, auftrag: z.auftrag, kurz: 'AUFTRAG: ' + kapitelText(faellig) };
}

/* ---------- Für vorrat.mjs: dieselbe Stunde gilt auch für die Wartung ----------

   ⭐ Zwei Stellen, eine Regel. Die Wartung am Mittwoch und Sonntag übernimmt
   seine App-Auswahl ebenfalls (`vorrat.mjs --stand … --app auto`). Hat er zehn
   Minuten vor ihrem Lauf ein Kapitel zum Anschauen angehakt, bekäme es dort das
   volle Programm — genau das, was er ausgeschlossen hat.

   Gehalten wird nur, was NEU aus der App kommt: was schon freigeschaltet war,
   was arabicroots selbst freigibt oder was in seiner Angabe liegt, bleibt.
   Ein Kapitel gilt als eine Stunde alt, wenn (a) der ganze Auswahl-Stand seit
   über einer Stunde unverändert ist, oder (b) die stündliche Prüfung es seit
   über einer Stunde sieht oder schon übernommen hat. */
export function appKapitelHalten(vonApp, { alt = {}, vonRoots = {}, angabe = {}, stempel = null,
                                          jetzt = Date.now(), zustand = zustandLesen() } = {}){
  const behalten = {}, gehalten = [];
  const z = zustand || {};
  const standAlt = stempel && (jetzt - stempel) > HALTEZEIT_MS;
  for (const [b, ks] of Object.entries(vonApp || {})){
    const schonDa = new Set([...(alt[b] || []), ...(vonRoots[b] || []), ...bis(angabe[b]),
      ...((z.bekannt && z.bekannt[b]) || []), ...((z.auftrag && z.auftrag.kapitel && z.auftrag.kapitel[b]) || [])]);
    const bleiben = ks.filter(k => {
      if (schonDa.has(k) || standAlt) return true;
      const seit = z.beobachtet && z.beobachtet[b] && z.beobachtet[b][k];
      if (seit != null && (jetzt - seit) > HALTEZEIT_MS) return true;
      gehalten.push(`${b} Kapitel ${k}: in der App erst seit ${stempel ? uhr(stempel) : 'unbekannt'} angehakt`
        + ' — noch keine Stunde, deshalb NICHT uebernommen (Elias 22.09.2026: „es länger als 1h auch so bleibt").'
        + ' Die stuendliche Pruefung uebernimmt es, sobald die Stunde um ist.');
      return false;
    });
    if (bleiben.length) behalten[b] = bleiben;
  }
  return { behalten, gehalten };
}

/* ---------- Kommandozeile ---------- */

function zeitArg(a){
  if (a == null) return null;
  const n = Number(a);
  if (Number.isFinite(n) && n > 1e12) return n;
  const t = Date.parse(a);
  return Number.isFinite(t) ? t : null;
}

function hauptprogramm(){
  const ARG = process.argv.slice(2);
  const wert = (name) => { const i = ARG.indexOf(name); return i >= 0 ? ARG[i + 1] : null; };
  const datei = wert('--zustand') || ZUSTAND_STANDARD;
  const jetzt = zeitArg(wert('--jetzt')) || Date.now();
  const alt = zustandLesen(datei);

  if (ARG.includes('--tor')){
    let text;
    try {
      text = wert('--kv') ? fs.readFileSync(wert('--kv'), 'utf8') : kvHolen();
    } catch (e){
      console.log('Geraeteabgleich nicht erreichbar (' + String(e.message || e).split('\n')[0] + ') - kein Lauf');
      process.exit(1);
    }
    let gelesen, frei;
    try { gelesen = auswahlLesen(text); }
    catch (e){ console.log('Geraeteabgleich unlesbar (' + e.message + ') - kein Lauf'); process.exit(1); }
    try { frei = wert('--kern') ? freiLesen(wert('--kern')) : freiLesen(); }
    catch (e){ console.log(e.message.normalize('NFKD').replace(/[^\x20-\x7e]/g, '') + ' - kein Lauf'); process.exit(1); }
    const angabe = wert('--lernstand') ? angabeLesen(wert('--lernstand')) : angabeLesen();
    const r = schritt(alt, { ...gelesen, jetzt, angabe, frei, hatDaten: hatDatenStandard,
                             gesperrt: sperreLesen(wert('--marke') || path.join(WURZEL, '.arbeit.json'), jetzt) });
    zustandSchreiben(datei, r.zustand);
    r.zeilen.forEach(z => console.log('  ' + z));
    /* Die LETZTE Zeile landet in routines.log — PowerShell 5.1 liest die Ausgabe
       im OEM-Zeichensatz, deshalb hier nur ASCII. */
    console.log(r.kurz.normalize('NFKD').replace(/[^\x20-\x7e]/g, ''));
    process.exit(r.auftrag ? 0 : 3);
  }

  if (ARG.includes('--auftrag')){
    const a = alt && alt.auftrag;
    if (!a){ console.log('Kein offener Auftrag.'); process.exit(3); }
    console.log(`Auftrag vom ${uhr(a.erteilt)} (Versuch ${a.versuche || 1} von ${HOECHSTENS_VERSUCHE}):`);
    for (const [b, ks] of Object.entries(a.kapitel)){
      const seit = (a.angehaktSeit && a.angehaktSeit[b]) || {};
      console.log(`  ${b}: Kapitel ${ks.join(', ')}   (angehakt seit ${ks.map(k => seit[k] ? uhr(seit[k]) : '?').join(', ')})`);
    }
    console.log('');
    console.log('Arbeitsauftrag fuer genau diese Kapitel:');
    console.log('  node werkzeuge/vorrat.mjs ' + Object.entries(a.kapitel)
      .map(([b, ks]) => `--nur-kapitel ${b}:${ks.join(',')}`).join(' ') + ' --auftrag <datei>');
    process.exit(0);
  }

  if (ARG.includes('--erledigt')){
    if (!alt || !alt.auftrag){ console.log('Kein offener Auftrag — nichts abzuschliessen.'); process.exit(3); }
    const z = JSON.parse(JSON.stringify(alt));
    for (const [b, ks] of Object.entries(z.auftrag.kapitel)){
      z.bekannt[b] = vereinige(z.bekannt[b], ks);
      if (z.beobachtet && z.beobachtet[b]) for (const k of ks) delete z.beobachtet[b][k];
    }
    z.verlauf = [...(z.verlauf || []), { ...z.auftrag, fertig: jetzt, notiz: wert('--notiz') || null }].slice(-30);
    console.log('Abgeschlossen: ' + kapitelText(z.auftrag.kapitel) + ' — gilt ab jetzt als bekannt.');
    z.auftrag = null;
    zustandSchreiben(datei, z);
    process.exit(0);
  }

  /* Ohne Schalter: nur anzeigen. */
  if (!alt){ console.log('Noch kein Zustand (' + datei + ') — der erste --tor-Lauf setzt den Grundstand.'); process.exit(0); }
  console.log('Grundstand seit ' + uhr(alt.grundstand) + ', letzter Blick ' + (alt.letzterBlick ? uhr(alt.letzterBlick) : '—'));
  console.log('Bekannt:    ' + (kapitelText(alt.bekannt) || '—'));
  const beob = Object.entries(alt.beobachtet || {}).map(([b, m]) =>
    `${b} Kapitel ${Object.keys(m).join(', ')} (seit ${Object.values(m).map(uhr).join(', ')})`).join(' | ');
  console.log('Beobachtet: ' + (beob || '—'));
  console.log('Auftrag:    ' + (alt.auftrag ? kapitelText(alt.auftrag.kapitel) + ', erteilt ' + uhr(alt.auftrag.erteilt) : '—'));
  (alt.verlauf || []).slice(-5).forEach(v => console.log('  ' + (v.aufgegeben ? '⚠️ aufgegeben ' + uhr(v.aufgegeben) : 'erledigt ' + uhr(v.fertig))
    + ': ' + kapitelText(v.kapitel) + (v.notiz ? ' — ' + v.notiz : '')));
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) hauptprogramm();
