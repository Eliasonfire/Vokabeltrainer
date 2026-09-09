#!/usr/bin/env node
/* pruefe-sprachausgabe.mjs — sagt die Sprachausgabe, WARUM sie schweigt?
 *
 * ⛔⛔ DER ANLASS steht im Kopf von js/sprachausgabe.js, und er ist Elias':
 *
 *   „ich habe eben auf dem tablet geübt und wollte bei einer kartekarte den
 *    sound des wortes abspielen lassen, ging aber nicht. ton war an und ich
 *    hab auf handy probiert, da ging es aber beim tablet funktioniert es
 *    irgendwie nicht." (16.08.2026)
 *
 * Die Datei hatte bis dahin KEINEN einzigen Fehlerpfad: schlug `speak()` fehl,
 * passierte nichts — kein Ton, keine Meldung, kein Konsoleneintrag. Seitdem
 * meldet sie drei verschiedene Arten von Schweigen. Geprueft hat das bis heute
 * niemand: `js/sprachausgabe.js` (139 Zeilen) wurde von keinem Pruefer genannt.
 *
 * ⛔ Die echten Funktionen werden ausgeschnitten und ausgefuehrt. Ein Nachbau
 * prueft den Nachbau. [[testvorlage_selbst_nachgebaut]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = fs.readFileSync(path.join(REPO, 'js', 'sprachausgabe.js'), 'utf8');

let fehler = 0;
const pruefe = (name, ist, soll) => {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  if (!ok) { fehler++; console.log('  ⛔  ' + name + '\n        ist:  ' + JSON.stringify(ist) + '\n        soll: ' + JSON.stringify(soll)); }
  else console.log('  ok  ' + name);
};
const schneide = (name) => {
  const m = S.match(new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
  if (!m) { console.log('⛔ ' + name + '() nicht auffindbar — hat js/sprachausgabe.js einen neuen Aufbau?'); process.exit(1); }
  return m[0];
};

/* ---------- 1. Die Fehlertexte ---------- */
console.log('=== Sagt sie beim Fehler, was zu TUN ist? ===\n');
const tonFehlertext = new Function(schneide('tonFehlertext') + '\nreturn tonFehlertext;')();

/* ⛔ Der wichtigste Fall zuerst, und er ist ein SCHWEIGEN: `cancel()` ruft die
   App selbst, bei jedem neuen Wort. Gaebe es dafuer eine Meldung, staende bei
   jedem zweiten Antippen ein Fehler auf dem Schirm. */
pruefe('eigenes cancel() meldet NICHTS (interrupted)', tonFehlertext('interrupted', 3), null);
pruefe('eigenes cancel() meldet NICHTS (canceled)', tonFehlertext('canceled', 3), null);

const hat = (code, wort, stimmen = 3) => {
  const t = tonFehlertext(code, stimmen);
  return typeof t === 'string' && t.includes(wort);
};
pruefe('not-allowed nennt die Handlung („antippen")', hat('not-allowed', 'antippen'), true);
pruefe('voice-unavailable nennt die fehlende Stimme', hat('voice-unavailable', 'Stimme'), true);
pruefe('audio-busy sagt „warten"', hat('audio-busy', 'warten'), true);
pruefe('synthesis-failed sagt „abgelehnt"', hat('synthesis-failed', 'abgelehnt'), true);

/* ⭐ Der Unterschied, auf den es bei Elias' Tablet ankam: OHNE arabische
   Stimme ist die Antwort eine ANDERE als mit. */
pruefe('unbekannter Code MIT Stimmen nennt den Code', hat('irgendwas', 'irgendwas', 3), true);
pruefe('unbekannter Code OHNE Stimmen nennt die fehlende Stimme',
  hat('irgendwas', 'keine arabische Stimme', 0), true);
pruefe('jeder bekannte Code liefert entweder null oder einen Satz',
  ['interrupted', 'canceled', 'not-allowed', 'language-unavailable', 'voice-unavailable',
   'audio-busy', 'synthesis-unavailable', 'synthesis-failed']
    .every(c => { const t = tonFehlertext(c, 2); return t === null || (typeof t === 'string' && t.length > 20); }), true);

/* ---------- 2. Die drei Arten von Schweigen ---------- */
console.log('\n=== Merkt sie die drei Arten von Schweigen? ===\n');

/* `stumm: true` heisst: der Browser nimmt die Aeusserung an und ruft danach
   NICHTS auf — kein onstart, kein onend, kein onerror. Genau dafuer gibt es
   die 1400-ms-Uhr, und nur so laesst sie sich pruefen. */
function buehne({ stimmen = 1, dauerMs = 0, sprichtNachher = false, stumm = false, text = 'كِتَابٌ' } = {}) {
  const meldungen = [];
  const uhren = [];
  let jetzt = 1000;
  const utterances = [];
  class SpeechSynthesisUtterance { constructor(t){ this.text = t; utterances.push(this); } }
  const speechSynthesis = {
    paused: false,
    speaking: false,
    pending: false,
    cancel(){}, resume(){},
    getVoices: () => Array.from({ length: stimmen }, (_, i) => ({ lang: 'ar-SA', voiceURI: 'v' + i, name: 'Stimme ' + i })),
    speak(u){
      /* Der Browser nimmt die Aeusserung an, meldet onstart — und `dauerMs`
         spaeter onend. Genau so verhaelt sich ein Geraet ohne Stimme. */
      speechSynthesis.speaking = sprichtNachher;
      if (stumm) return;                  /* nimmt an und ruft nie zurueck */
      if (u.onstart) u.onstart();
      jetzt += dauerMs;
      if (u.onend) u.onend();
    },
  };
  const window = { speechSynthesis };
  const SETTINGS = { voiceURI: null };
  const toast = (t) => meldungen.push(t);
  const setTimeout = (fn, ms) => { uhren.push(fn); return uhren.length; };
  const clearTimeout = () => {};
  const Date_ = { now: () => jetzt };

  const quelle = 'let ARABIC_VOICES = [];\n'
    + schneide('arabischeStimmen') + '\n'
    + schneide('tonFehlertext') + '\n'
    + schneide('speakArabic') + '\n'
    + 'return { speakArabic };';
  const f = new Function('window', 'speechSynthesis', 'SpeechSynthesisUtterance', 'SETTINGS',
    'toast', 'setTimeout', 'clearTimeout', 'Date', quelle)(
    window, speechSynthesis, SpeechSynthesisUtterance, SETTINGS, toast, setTimeout, clearTimeout, Date_);
  return { ...f, meldungen, uhren, text };
}

{
  /* ⛔⛔ Der Fall von Elias' Tablet: onstart, acht Millisekunden spaeter onend.
     Kein Fehler, kein Ausbleiben — und trotzdem kein Ton. Gemessen am
     16.08.2026 im Pruefbrowser: 17301 ms -> 17309 ms. */
  const b = buehne({ stimmen: 0, dauerMs: 8 });
  b.speakArabic('كِتَابٌ');
  pruefe('onend nach 8 ms → Meldung („kein Ton")', b.meldungen.length > 0, true);
  pruefe('und sie nennt die fehlende Stimme', /keine arabische Stimme/i.test(b.meldungen.join(' ')), true);
}
{
  const b = buehne({ stimmen: 2, dauerMs: 800 });
  b.speakArabic('كِتَابٌ');
  pruefe('onend nach 800 ms → KEINE Meldung (das war Ton)', b.meldungen, []);
}
{
  /* ⚠️ Ein einzelner Buchstabe darf keine Meldung ausloesen — der ist in
     8 ms wirklich gesprochen. */
  const b = buehne({ stimmen: 2, dauerMs: 8 });
  b.speakArabic('ا');
  pruefe('sehr kurzer Text → KEINE Meldung', b.meldungen, []);
}
{
  /* ⛔ Die dritte Art, und sie war die letzte Luecke: die Aeusserung wird
     angenommen und es passiert NIE etwas — kein onstart, kein onend.
     ⚠️ Der erste Entwurf dieser Probe liess `onstart` feuern und erwartete
     trotzdem eine Meldung. Das war MEINE Erwartung, nicht die der App: nach
     einem onstart ist die Uhr zu Recht still, dann greift die onend-Wache.
     Die App hatte recht. [[testfehler_kann_echten_mangel_zeigen]] */
  const b = buehne({ stimmen: 2, stumm: true });
  b.speakArabic('كِتَابٌ');
  pruefe('nichts passiert: vor der Uhr noch keine Meldung', b.meldungen.length, 0);
  b.uhren.forEach(fn => fn());
  pruefe('Uhr laeuft ab, nichts spricht → Meldung', b.meldungen.length > 0, true);
}
{
  const b = buehne({ stimmen: 2, stumm: true, sprichtNachher: true });
  b.speakArabic('كِتَابٌ');
  b.uhren.forEach(fn => fn());
  pruefe('Uhr laeuft ab, es spricht noch → KEINE Meldung', b.meldungen, []);
}
{
  const b = buehne({ stimmen: 2, dauerMs: 800 });
  b.speakArabic('كِتَابٌ');
  const vorher = b.meldungen.length;
  b.uhren.forEach(fn => fn());
  pruefe('nach echtem Ton bleibt die Uhr still', b.meldungen.length, vorher);
}

/* ---------- 3. Die Rueckfallprobe: alle drei Pfade sind noch da ---------- */
console.log('\n=== Sind alle drei Fehlerpfade noch verdrahtet? ===\n');
const speakQuelle = schneide('speakArabic');
pruefe('onerror ist verdrahtet', /u\.onerror\s*=/.test(speakQuelle), true);
pruefe('onend ist verdrahtet', /u\.onend\s*=/.test(speakQuelle), true);
pruefe('die 1400-ms-Uhr steht', /setTimeout\(/.test(speakQuelle) && /1400/.test(speakQuelle), true);
pruefe('resume() gegen das pausierte Android', /speechSynthesis\.paused/.test(speakQuelle), true);
/* ⭐ Die Stimme wird NUR gesetzt, wenn es sie auf DIESEM Geraet gibt — sonst
   zeigt eine vom Handy abgeglichene voiceURI ins Leere. */
pruefe('die gewaehlte Stimme wird gegen die Geraeteliste geprueft',
  /ARABIC_VOICES\.find\(/.test(speakQuelle), true);

/* ---------- ⛔ Stoertest: haengt die Probe wirklich am echten Code? ----------

   Am 09.09.2026 hat der Stoertest EINES Pruefers einen Fehler in vier anderen
   aufgedeckt — sie standen alle auf einem Werkzeug, das still ausfiel, und
   meldeten weiter gruen. Ein Pruefer ohne eigene Stoerprobe kann nicht
   zwischen „nichts gefunden" und „nichts gesehen" unterscheiden.
   [[stoertest_muss_wirkung_nachweisen]]

   Hier wird die 250-ms-Schwelle im AUSGESCHNITTENEN Quelltext auf 0 gesetzt.
   Danach darf der 8-ms-Fall KEINE Meldung mehr geben — tut er es doch, kommt
   die Meldung nicht aus dem geprueften Code, sondern von woanders. */
console.log('\n=== Stoertest: haengt die Probe am echten Code? ===\n');
{
  const echteQuelle = schneide('speakArabic');
  const treffer = (echteQuelle.match(/>= 250/g) || []).length;
  pruefe('die 250-ms-Schwelle steht genau einmal im Quelltext', treffer, 1);
  if (treffer === 1) {
    const verbogen = echteQuelle.replace('>= 250', '>= 0');
    /* Dieselbe Buehne, aber mit der verbogenen Fassung. */
    const meldungen = [];
    let jetzt = 1000;
    class U { constructor(t){ this.text = t; } }
    const ss = { paused:false, speaking:false, pending:false, cancel(){}, resume(){},
      getVoices: () => [{ lang:'ar-SA', voiceURI:'v0', name:'S' }],
      speak(u){ if(u.onstart) u.onstart(); jetzt += 8; if(u.onend) u.onend(); } };
    const f = new Function('window','speechSynthesis','SpeechSynthesisUtterance','SETTINGS','toast','setTimeout','clearTimeout','Date',
      'let ARABIC_VOICES = [];\n' + schneide('arabischeStimmen') + '\n' + schneide('tonFehlertext') + '\n' + verbogen
      + '\nreturn speakArabic;')(
      { speechSynthesis: ss }, ss, U, { voiceURI: null }, (t)=>meldungen.push(t), ()=>0, ()=>{}, { now: () => jetzt });
    f('كِتَابٌ');
    pruefe('mit verbogener Schwelle bleibt der 8-ms-Fall still — die Probe misst also den echten Code',
      meldungen.length, 0);
  }
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Die Sprachausgabe sagt, warum sie schweigt.');
process.exit(fehler ? 1 : 0);
