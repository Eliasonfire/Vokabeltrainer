/* Prüfstand für den Geräteabgleich (js/sync.js).
 *
 * Warum das hier steht: Der Abgleich ist der einzige Teil der App, der Elias'
 * Lernstand ZERSTOEREN kann. Alles andere zeigt im schlimmsten Fall etwas
 * Falsches an; ein falsch zusammengefuehrter Fortschritt ist weg. Deshalb wird
 * die Logik gegen erfundene Konfliktfaelle geprueft, nicht an seiner App
 * ausprobiert.
 *
 * ⚠️ In einem vm sind `const`/`let`/`function` lexikalisch und NICHT am Kontext
 * sichtbar - herangeholt wird ueber vm.runInContext('NAME', ctx).
 *
 * Aufruf:  node test-sync.mjs
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));

/* ---------- Umgebung nachbauen ---------- */
function baueUmgebung(){
  const speicher = {};
  const ctx = {
    localStorage: {
      getItem: k => (k in speicher ? speicher[k] : null),
      setItem: (k, v) => { speicher[k] = String(v); },
      removeItem: k => { delete speicher[k]; }
    },
    document: { addEventListener(){}, visibilityState: 'visible' },
    fetch: async () => { throw new Error('Netz im Pruefstand nicht erlaubt'); },
    setTimeout: () => 0,
    clearTimeout: () => {},
    console
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(WURZEL, 'js/sync.js'), 'utf8'), ctx);
  return { ctx, speicher };
}

let bestanden = 0, gescheitert = 0;
function pruefe(name, bedingung, zusatz){
  if (bedingung){ bestanden++; console.log('  ok   ' + name); }
  else { gescheitert++; console.log('  FEHL ' + name + (zusatz ? '  -> ' + zusatz : '')); }
}

console.log('=== Zusammenfuehren des Fortschritts ===');
{
  const { ctx } = baueUmgebung();
  const fuehre = vm.runInContext('fuehreFortschrittZusammen', ctx);

  /* 1. Beide Seiten haben eigene Woerter - keins darf verschwinden. */
  let r = fuehre({ a: { box:2, ts:100 } }, { b: { box:3, ts:200 } });
  pruefe('Wörter beider Geräte bleiben erhalten',
    r.a && r.b, JSON.stringify(r));

  /* 2. Derselbe Eintrag, verschiedene Stempel - der juengere gewinnt. */
  r = fuehre({ x: { box:1, ts:100 } }, { x: { box:4, ts:900 } });
  pruefe('jüngerer Zeitstempel gewinnt', r.x.box === 4, 'box=' + r.x.box);

  r = fuehre({ x: { box:5, ts:900 } }, { x: { box:1, ts:100 } });
  pruefe('älterer Zeitstempel verliert (auch andersherum)', r.x.box === 5, 'box=' + r.x.box);

  /* 3. DER FALL, DER ELIAS' ARBEIT KOSTEN WUERDE:
        Handy hat morgens gelernt (neuer Stempel), PC hat den Stand von gestern.
        Der PC darf den Vormittag NICHT ueberschreiben. */
  const handy = { w1: { box:4, correct:3, ts: 2000 }, w2: { box:2, ts: 2000 } };
  const pc    = { w1: { box:1, correct:0, ts: 1000 }, w2: { box:1, ts: 1000 } };
  r = fuehre(pc, handy);
  pruefe('PC mit altem Stand überschreibt den Handy-Vormittag NICHT',
    r.w1.box === 4 && r.w2.box === 2, JSON.stringify(r));

  /* 4. Altbestand ohne Stempel: mehr Antworten gewinnt. */
  r = fuehre({ y: { box:1, correct:0, wrong:1 } }, { y: { box:3, correct:2, wrong:1 } });
  pruefe('ohne Stempel gewinnt der weiter fortgeschrittene Eintrag',
    r.y.box === 3, 'box=' + r.y.box);

  /* 5. Ein Stempel auf nur einer Seite schlaegt die Ersatzregel. */
  r = fuehre({ z: { box:5, correct:9, wrong:0 } }, { z: { box:1, correct:0, wrong:0, ts: 5000 } });
  pruefe('ein vorhandener Stempel schlägt die Ersatzregel',
    r.z.box === 1, 'box=' + r.z.box);

  /* 6. Leere Gegenseite darf nichts loeschen. */
  r = fuehre({ a:{box:3,ts:1}, b:{box:2,ts:1} }, {});
  pruefe('leerer Server löscht nichts', Object.keys(r).length === 2, JSON.stringify(r));

  r = fuehre({}, { a:{box:3,ts:1} });
  pruefe('leeres Gerät übernimmt alles vom Server', !!r.a);
}

console.log('');
console.log('=== Zusammenfuehren der uebrigen Schluessel ===');
{
  const { ctx, speicher } = baueUmgebung();
  const fuehreZusammen = vm.runInContext('fuehreZusammen', ctx);
  const STEMPEL = vm.runInContext('STEMPEL_SCHLUESSEL', ctx);

  /* Lokale Notiz ist neuer -> bleibt stehen. */
  speicher['vt_notes'] = '{"1":"meine"}';
  speicher[STEMPEL] = JSON.stringify({ vt_notes: 9000 });
  fuehreZusammen({ stempel: { vt_notes: 1000 }, daten: { vt_notes: '{"1":"alte"}' } });
  pruefe('neuere lokale Notiz bleibt', speicher['vt_notes'] === '{"1":"meine"}', speicher['vt_notes']);

  /* Server ist neuer -> wird uebernommen. */
  speicher[STEMPEL] = JSON.stringify({ vt_notes: 1000 });
  fuehreZusammen({ stempel: { vt_notes: 9000 }, daten: { vt_notes: '{"1":"vom Server"}' } });
  pruefe('neuere Server-Notiz wird übernommen', speicher['vt_notes'] === '{"1":"vom Server"}', speicher['vt_notes']);

  /* Gleichstand -> lokal behalten, nichts wegwerfen. */
  speicher['vt_hifz'] = '{"67":true}';
  speicher[STEMPEL] = JSON.stringify({ vt_hifz: 5000 });
  fuehreZusammen({ stempel: { vt_hifz: 5000 }, daten: { vt_hifz: '{"67":false}' } });
  pruefe('bei Gleichstand bleibt das Lokale', speicher['vt_hifz'] === '{"67":true}', speicher['vt_hifz']);

  /* Schluessel, den nur der Server kennt -> uebernehmen. */
  delete speicher['vt_lesestand'];
  fuehreZusammen({ stempel: { vt_lesestand: 1 }, daten: { vt_lesestand: '{"sure":67,"vers":1}' } });
  pruefe('unbekannter Schlüssel wird vom Server übernommen',
    speicher['vt_lesestand'] === '{"sure":67,"vers":1}', speicher['vt_lesestand']);

  /* Kaputtes JSON auf der Gegenseite darf den lokalen Stand nicht zerstoeren. */
  speicher['vt_progress'] = '{"a":{"box":3,"ts":1}}';
  fuehreZusammen({ stempel: { vt_progress: 9999 }, daten: { vt_progress: 'kein json {{{' } });
  pruefe('kaputtes JSON vom Server zerstört den lokalen Fortschritt nicht',
    speicher['vt_progress'] === '{"a":{"box":3,"ts":1}}', speicher['vt_progress']);
}

console.log('');
console.log('=== „Kenne ich schon" (vt_bekannt) ===');
{
  /* Der Schluessel wird JE WORT zusammengefuehrt. Die drei Faelle unten sind
     genau die, an denen eine blosse Vereinigung der markierten Ids
     stillschweigend falsch waere. */
  const { ctx, speicher } = baueUmgebung();
  const fuehreZusammen = vm.runInContext('fuehreZusammen', ctx);

  /* 1. Jedes Geraet hat eigene Markierungen - keine darf verlorengehen. */
  speicher['vt_bekannt'] = JSON.stringify({ a: { an:true, zeit:100 } });
  fuehreZusammen({ stempel: {}, daten: { vt_bekannt: JSON.stringify({ b: { an:true, zeit:200 } }) } });
  let r = JSON.parse(speicher['vt_bekannt']);
  pruefe('Markierungen beider Geräte bleiben erhalten',
    r.a && r.a.an && r.b && r.b.an, speicher['vt_bekannt']);

  /* 2. Der eigentliche Grund fuer die Zeitstempel: eine RUECKNAHME muss
        ankommen. Bei einer Vereinigung der markierten Ids waere das Wort hier
        wieder markiert - ohne Fehlermeldung. */
  const { ctx: c2, speicher: s2 } = baueUmgebung();
  const fz2 = vm.runInContext('fuehreZusammen', c2);
  s2['vt_bekannt'] = JSON.stringify({ x: { an:true, zeit:100 } });
  fz2({ stempel: {}, daten: { vt_bekannt: JSON.stringify({ x: { an:false, zeit:900 } }) } });
  pruefe('spätere Rücknahme vom anderen Gerät gewinnt',
    JSON.parse(s2['vt_bekannt']).x.an === false, s2['vt_bekannt']);

  /* 3. Andersherum: die aeltere Ruecknahme darf die neuere Markierung nicht
        umwerfen. */
  const { ctx: c3, speicher: s3 } = baueUmgebung();
  const fz3 = vm.runInContext('fuehreZusammen', c3);
  s3['vt_bekannt'] = JSON.stringify({ x: { an:true, zeit:900 } });
  fz3({ stempel: {}, daten: { vt_bekannt: JSON.stringify({ x: { an:false, zeit:100 } }) } });
  pruefe('ältere Rücknahme verliert gegen neuere Markierung',
    JSON.parse(s3['vt_bekannt']).x.an === true, s3['vt_bekannt']);

  /* 4. Kaputtes JSON darf die eigene Auswahl nicht wegwerfen. */
  const { ctx: c4, speicher: s4 } = baueUmgebung();
  const fz4 = vm.runInContext('fuehreZusammen', c4);
  s4['vt_bekannt'] = JSON.stringify({ x: { an:true, zeit:1 } });
  fz4({ stempel: { vt_bekannt: 9999 }, daten: { vt_bekannt: 'kein json {{{' } });
  pruefe('kaputtes JSON zerstört die eigene Auswahl nicht',
    JSON.parse(s4['vt_bekannt']).x.an === true, s4['vt_bekannt']);

  /* 5. Der Schluessel steht ueberhaupt in SYNC_SCHLUESSEL - ohne das liefe
        alles oben ins Leere, und zwar unsichtbar. */
  const liste = vm.runInContext('SYNC_SCHLUESSEL', ctx);
  pruefe('vt_bekannt steht in SYNC_SCHLUESSEL', liste.indexOf('vt_bekannt') >= 0, liste.join(', '));
}

console.log('');
console.log('=== Gewaehlter Eselsbruecken-Vorschlag (vt_vorschlagNr) ===');
{
  /* Laeuft ueber DENSELBEN Zweig wie vt_bekannt (js/sync.js). Genau deshalb
     eigene Faelle: teilt sich zwei Schluessel einen Zweig, faellt es nicht auf,
     wenn die Bedingung dort spaeter einmal umgebaut wird und den zweiten
     Schluessel verliert. */
  const { ctx, speicher } = baueUmgebung();
  const fuehreZusammen = vm.runInContext('fuehreZusammen', ctx);

  /* 1. Zwei Geraete, zwei verschiedene Woerter - beide Wahlen bleiben. */
  speicher['vt_vorschlagNr'] = JSON.stringify({ a: { nr:2, zeit:100 } });
  fuehreZusammen({ stempel: {}, daten: { vt_vorschlagNr: JSON.stringify({ b: { nr:1, zeit:200 } }) } });
  const r = JSON.parse(speicher['vt_vorschlagNr']);
  pruefe('Vorschlagswahl beider Geräte bleibt erhalten',
    r.a && r.a.nr === 2 && r.b && r.b.nr === 1, speicher['vt_vorschlagNr']);

  /* 2. Dasselbe Wort auf beiden Geraeten: die SPAETERE Wahl gilt. */
  const { ctx: c2, speicher: s2 } = baueUmgebung();
  const fz2 = vm.runInContext('fuehreZusammen', c2);
  s2['vt_vorschlagNr'] = JSON.stringify({ x: { nr:1, zeit:100 } });
  fz2({ stempel: {}, daten: { vt_vorschlagNr: JSON.stringify({ x: { nr:2, zeit:900 } }) } });
  pruefe('spätere Vorschlagswahl gewinnt',
    JSON.parse(s2['vt_vorschlagNr']).x.nr === 2, s2['vt_vorschlagNr']);

  /* 3. Andersherum: die aeltere Wahl darf die neuere nicht umwerfen. Das ist
        der Fall, der Elias' Beschwerde wieder herstellen wuerde - die Karte
        zeigte dann nach dem Abgleich wieder den urspruenglichen Vorschlag. */
  const { ctx: c3, speicher: s3 } = baueUmgebung();
  const fz3 = vm.runInContext('fuehreZusammen', c3);
  s3['vt_vorschlagNr'] = JSON.stringify({ x: { nr:2, zeit:900 } });
  fz3({ stempel: {}, daten: { vt_vorschlagNr: JSON.stringify({ x: { nr:0, zeit:100 } }) } });
  pruefe('ältere Wahl wirft die neuere nicht um',
    JSON.parse(s3['vt_vorschlagNr']).x.nr === 2, s3['vt_vorschlagNr']);

  /* 4. Der Schluessel steht ueberhaupt in SYNC_SCHLUESSEL. */
  const liste = vm.runInContext('SYNC_SCHLUESSEL', ctx);
  pruefe('vt_vorschlagNr steht in SYNC_SCHLUESSEL',
    liste.indexOf('vt_vorschlagNr') >= 0, liste.join(', '));
}

console.log('');
console.log('=== Filter: was wird ueberhaupt abgeglichen ===');
{
  const { ctx, speicher } = baueUmgebung();
  const syncGeaendert = vm.runInContext('syncGeaendert', ctx);
  const STEMPEL = vm.runInContext('STEMPEL_SCHLUESSEL', ctx);

  syncGeaendert('vt_progress');
  pruefe('vt_progress wird vorgemerkt', !!JSON.parse(speicher[STEMPEL] || '{}').vt_progress);

  syncGeaendert('vt_irgendwas');
  pruefe('fremder Schlüssel wird ignoriert',
    !JSON.parse(speicher[STEMPEL] || '{}').vt_irgendwas);

  const vorher = speicher[STEMPEL];
  syncGeaendert(STEMPEL);
  pruefe('der Stempel-Schlüssel löst keine Endlosschleife aus', speicher[STEMPEL] === vorher);
}

console.log('');
console.log('=== Echte Sicherung vom 11.08. gegen einen leeren Server ===');
{
  const S = 'G:/1. Workspace/Vokabeltrainer-Sicherungen/vokabeltrainer-sicherung-2026-08-11.json';
  if (!fs.existsSync(S)){
    console.log('  (Sicherung nicht gefunden, uebersprungen)');
  } else {
    const sich = JSON.parse(fs.readFileSync(S, 'utf8'));
    const { ctx, speicher } = baueUmgebung();
    const fuehreZusammen = vm.runInContext('fuehreZusammen', ctx);
    fuehreZusammen({ stempel: {}, daten: sich.daten });
    const fort = JSON.parse(speicher['vt_progress'] || '{}');
    pruefe('alle 171 Wörter kommen an', Object.keys(fort).length === 171, Object.keys(fort).length + ' Wörter');
    pruefe('Lesestand kommt an', speicher['vt_lesestand'] === sich.daten.vt_lesestand);
    pruefe('Serie kommt an', speicher['vt_streak'] === sich.daten.vt_streak);
    pruefe('eigene Kategorie kommt an', speicher['vt_customCats'] === sich.daten.vt_customCats);
  }
}

console.log('');
console.log(bestanden + ' bestanden, ' + gescheitert + ' gescheitert');
process.exit(gescheitert ? 1 : 0);
