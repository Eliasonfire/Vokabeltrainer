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
/* ⛔ tonFehlertext() nie allein ausschneiden. Seit v570 (`3568a2a`, Nacht auf
   den 23.09.2026) ruft sie für „voice-unavailable" stimmeFehltText() auf — und
   dieser Prüfer starb daran mit „stimmeFehltText is not defined", über zwei
   Auslieferungen (v570, v571), ohne dass es auffiel: der Sammellauf zeigt als
   letzte Zeile nur „Node.js v24.18.0". Gemessen an den drei Commits danach:
   die Funktion steht in js/sprachausgabe.js, im Prüfer stand sie nie.
   Wer tonFehlertext() eine neue Hilfsfunktion gibt, trägt sie HIER ein. */
const fehlertexte = () => schneide('stimmeFehltText') + '\n' + schneide('tonFehlertext');
/* ⭐ v575: speakArabic() liest seit „Arabisch testen" die Bestätigung dieses
   Geräts (ARABISCH_OHNE_LISTE, arabischOhneListe). Alles, was speakArabic
   braucht, kommt aus EINER Stelle — sonst stirbt die nächste Probe an einer
   fehlenden Hilfsfunktion, wie es oben bei stimmeFehltText passiert ist. */
const kopf = () => {
  const k = S.match(/const ARABISCH_OHNE_LISTE = '[^']+';/);
  if (!k) { console.log('⛔ ARABISCH_OHNE_LISTE nicht auffindbar — hat js/sprachausgabe.js einen neuen Aufbau?'); process.exit(1); }
  return 'let ARABIC_VOICES = [];\n' + k[0] + '\n'
    + schneide('arabischOhneListe') + '\n' + schneide('arabischOhneListeMerken') + '\n'
    + schneide('arabischeStimmen') + '\n' + fehlertexte();
};

/* ---------- 1. Die Fehlertexte ---------- */
console.log('=== Sagt sie beim Fehler, was zu TUN ist? ===\n');
const tonFehlertext = new Function(fehlertexte() + '\nreturn tonFehlertext;')();

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

/* ⭐ Seine zwei Geräte, Elias am 23.09.2026: „ich habe ein pixel 10 pro xl und
   samsung galaxy tablet S9 ultra". Chrome verrät das Modell nicht, also muss
   der Android-Satz auf BEIDEN stimmen: der Weg über die Suche, und kein Menü,
   das es nur bei einem Hersteller gibt. Bis v572 stand dort nur der
   Samsung-Weg — geprüft wurde er nie, weil `navigator` hier Node ist und der
   Android-Zweig nie lief. Darum wird der userAgent hier hineingereicht. */
const androidSatz = new Function('navigator', fehlertexte() + '\nreturn stimmeFehltText();')(
  { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' });
const androidTraegt = t => /suchen/.test(t) && !/Allgemeine Verwaltung/.test(t);
pruefe('Android-Satz: über die Suche, ohne Samsung-eigenes Menü', androidTraegt(androidSatz), true);
pruefe('Störtest: der alte Samsung-Satz (bis v572) fiele durch',
  androidTraegt('Einstellungen → Allgemeine Verwaltung → Text-zur-Sprache → Sprachdaten installieren → Arabisch'), false);

/* ---------- 2. Die drei Arten von Schweigen ---------- */
console.log('\n=== Merkt sie die drei Arten von Schweigen? ===\n');

/* `stumm: true` heisst: der Browser nimmt die Aeusserung an und ruft danach
   NICHTS auf — kein onstart, kein onend, kein onerror. Genau dafuer gibt es
   die 1400-ms-Uhr, und nur so laesst sie sich pruefen. */
/* `bestaetigt`: seine Antwort im Test auf DIESEM Gerät (undefined = nie
   getestet). `vokabeln`: die Daten, aus denen der Test seinen Satz nimmt.
   `speakQuelle`: für die Störtests eine verbogene Fassung von speakArabic. */
function buehne({ stimmen = 1, dauerMs = 0, sprichtNachher = false, stumm = false, text = 'كِتَابٌ',
                  bestaetigt, vokabeln = [], speakQuelle } = {}) {
  const meldungen = [];
  const uhren = [];
  let jetzt = 1000;
  const utterances = [];
  const speicher = new Map();
  if (bestaetigt !== undefined)
    speicher.set('vt_arabischOhneListe', JSON.stringify({ ja: bestaetigt, am: '2026-09-23T02:00:00.000Z' }));
  const LS = {
    get(k, f){ const v = speicher.get(k); return v ? JSON.parse(v) : f; },
    set(k, v){ speicher.set(k, JSON.stringify(v)); },
  };
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
  /* `new Date().toISOString()` braucht arabischOhneListeMerken(), `Date.now()`
     die Wachen in speakArabic — beides aus derselben gestellten Uhr. */
  class Date_ { constructor(){ this.t = jetzt; } toISOString(){ return new globalThis.Date(this.t).toISOString(); }
                static now(){ return jetzt; } }

  const quelle = kopf() + '\n'
    + (speakQuelle || schneide('speakArabic')) + '\n'
    + schneide('arabischProbeText') + '\n'
    + schneide('arabischProbeSprechen') + '\n'
    + 'return { speakArabic, arabischProbeSprechen, arabischOhneListe, arabischOhneListeMerken };';
  const f = new Function('window', 'speechSynthesis', 'SpeechSynthesisUtterance', 'SETTINGS',
    'toast', 'setTimeout', 'clearTimeout', 'Date', 'LS', 'VOCAB_DATA', quelle)(
    window, speechSynthesis, SpeechSynthesisUtterance, SETTINGS, toast, setTimeout, clearTimeout, Date_, LS, vokabeln);
  return { ...f, meldungen, uhren, text, utterances, speicher };
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

/* ---------- 2b. Arabisch ohne Stimmenliste (v575, 23.09.2026) ----------

   Auf seinen beiden Geräten ist Arabisch installiert, Chrome meldet es aber
   nicht (Begründung bei ARABISCH_OHNE_LISTE in js/sprachausgabe.js). Die App
   darf dann erst sprechen, wenn ER im Test gehört hat, dass es arabisch
   klingt — vorher bleibt seine v570-Regel: die Meldung statt einer
   nicht-arabischen Stimme. Beide Richtungen werden hier geprüft. */
console.log('\n=== Arabisch ohne Stimmenliste: spricht die App erst nach seinem Ja? ===\n');
{
  const b = buehne({ stimmen: 0, dauerMs: 800 });
  b.speakArabic('كِتَابٌ');
  pruefe('ohne Liste, nie getestet: spricht NICHT', b.utterances.length, 0);
  pruefe('… und die Meldung nennt den Test („Arabisch testen")', /Arabisch testen/.test(b.meldungen.join(' ')), true);
}
{
  const b = buehne({ stimmen: 0, dauerMs: 800, bestaetigt: false });
  b.speakArabic('كِتَابٌ');
  pruefe('ohne Liste, im Test verneint: spricht NICHT', b.utterances.length, 0);
}
{
  const b = buehne({ stimmen: 0, dauerMs: 800, bestaetigt: true });
  b.speakArabic('كِتَابٌ');
  pruefe('ohne Liste, per Test bestätigt: spricht', b.utterances.length, 1);
  pruefe('… mit lang ar-SA', b.utterances.length === 1 && b.utterances[0].lang, 'ar-SA');
  pruefe('… und OHNE Stimme (dann reicht Chrome nur lang ans Sprachmodul)',
    b.utterances.length === 1 && !('voice' in b.utterances[0]), true);
  pruefe('… und ohne Meldung', b.meldungen, []);
}
{
  const b = buehne({ stimmen: 0, dauerMs: 8, bestaetigt: true });
  b.speakArabic('كِتَابٌ');
  const m = b.meldungen.join(' ');
  pruefe('bestätigt, aber nach 8 ms zu Ende → „Kein Ton" mit dem Weg zum Test', /Kein Ton[\s\S]*Arabisch testen/.test(m), true);
  pruefe('… und NICHT der Installiersatz, der behauptet, es gebe keine Stimme', /meldet der App keine/.test(m), false);
}
{
  const b = buehne({ stimmen: 2, dauerMs: 800, bestaetigt: false });
  b.speakArabic('كِتَابٌ');
  pruefe('mit gemeldeter Stimme gilt die Liste — auch nach einem Nein im Test',
    b.utterances.length === 1 && b.utterances[0].voice && b.utterances[0].voice.voiceURI, 'v0');
}
{
  const b = buehne({ stimmen: 0, dauerMs: 800, vokabeln: [{ id: 'a', ar: 'كِتَابٌ' }, { id: 'b', sentAr: 'كِتَابٌ' }] });
  pruefe('der Test ohne Liste meldet den Weg „ohne" (dann erscheint die Frage)', b.arabischProbeSprechen(), 'ohne');
  pruefe('… spricht den ersten Beispielsatz aus den Daten, ohne Stimme',
    b.utterances.length === 1 && b.utterances[0].text === 'كِتَابٌ' && !('voice' in b.utterances[0]), true);
  pruefe('… und merkt sich dabei NICHTS — erst sein Ja zählt', b.speicher.has('vt_arabischOhneListe'), false);
}
{
  const b = buehne({ stimmen: 1, dauerMs: 800, vokabeln: [{ id: 'b', sentAr: 'كِتَابٌ' }] });
  pruefe('der Test mit gemeldeter Stimme meldet „liste" (keine Frage nötig)', b.arabischProbeSprechen(), 'liste');
}
{
  const b = buehne({ stimmen: 0 });
  b.arabischOhneListeMerken(true);
  pruefe('Ja wird gemerkt', b.arabischOhneListe(), true);
  b.arabischOhneListeMerken(false);
  pruefe('Nein nimmt es zurück', b.arabischOhneListe(), false);
  const e = JSON.parse(b.speicher.get('vt_arabischOhneListe') || 'null');
  pruefe('… und bleibt als ja:false mit Zeit stehen (die Diagnose sagt „Nein am …")',
    !!e && e.ja === false && typeof e.am === 'string', true);
}
{
  const ANDROID = { userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' };
  const [vorher, nachNein] = new Function('navigator', fehlertexte() + '\nreturn [stimmeFehltText(), stimmeFehltText(true)];')(ANDROID);
  pruefe('Android-Satz nennt den Test VOR dem Installieren',
    vorher.includes('Arabisch testen') && vorher.indexOf('Arabisch testen') < vorher.indexOf('Zahnrad'), true);
  pruefe('nach seinem Nein: kein „Ist Arabisch schon installiert", nur der Weg',
    !/Ist Arabisch schon installiert/.test(nachNein) && /suchen/.test(nachNein), true);
  const sonst = new Function('navigator', fehlertexte() + '\nreturn stimmeFehltText();')(
    { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
  pruefe('unbekanntes Gerät (etwa das Tablet mit Desktop-Seite): über die Suche und mit dem Test',
    /suchen/.test(sonst) && /Arabisch testen/.test(sonst) && !/Text-zur-Sprache/.test(sonst), true);
}
{
  const SYNC = fs.readFileSync(path.join(REPO, 'js', 'sync.js'), 'utf8');
  const E = fs.readFileSync(path.join(REPO, 'js', 'einstellungen.js'), 'utf8');
  const H = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  pruefe('der Schlüssel wird NICHT abgeglichen (er gehört dem Gerät)', /vt_arabischOhneListe/.test(SYNC), false);
  pruefe('Knopf, Stand und Frage stehen in index.html',
    ['btnArabischTesten', 'arabischTestStand', 'arabischTestFrage', 'btnArabischJa', 'btnArabischNein']
      .every(id => H.includes('id="' + id + '"')), true);
  pruefe('Ja merkt true, Nein merkt false',
    /'btnArabischJa'[\s\S]{0,160}arabischOhneListeMerken\(true\)/.test(E)
    && /'btnArabischNein'[\s\S]{0,160}arabischOhneListeMerken\(false\)/.test(E), true);
  pruefe('die Frage erscheint nur beim Weg „ohne"', E.includes("classList.toggle('hidden', weg !== 'ohne')"), true);
  pruefe('die Einstellungen zeigen den Stand beim Öffnen', /loadVoices\(\);\s*\n\s*zeigeArabischTest\(\);/.test(E), true);
  pruefe('die Diagnose nennt seine Antwort', E.includes('„Arabisch testen": '), true);
}

/* ⛔ Störtest: hängen die Proben oben am echten Code — in BEIDE Richtungen? */
{
  const echte = schneide('speakArabic');
  const STELLE = '(probe === true || arabischOhneListe())';
  const n = echte.split(STELLE).length - 1;
  pruefe('die Bestätigung wird in speakArabic genau einmal gelesen', n, 1);
  if (n === 1) {
    const a = buehne({ stimmen: 0, dauerMs: 800, bestaetigt: true,
                       speakQuelle: echte.replace(STELLE, '(probe === true)') });
    a.speakArabic('كِتَابٌ');
    pruefe('Störtest: liest speakArabic die Bestätigung nicht (Stand v570), bleibt es stumm — die Probe „per Test bestätigt: spricht" fiele also',
      a.utterances.length, 0);
    const c = buehne({ stimmen: 0, dauerMs: 800, speakQuelle: echte.replace(STELLE, 'true') });
    c.speakArabic('كِتَابٌ');
    pruefe('Störtest: fällt die Sperre weg, spricht es ohne sein Ja — die Probe „nie getestet: spricht NICHT" fiele also',
      c.utterances.length, 1);
  }
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
    const f = new Function('window','speechSynthesis','SpeechSynthesisUtterance','SETTINGS','toast','setTimeout','clearTimeout','Date','LS',
      kopf() + '\n' + verbogen
      + '\nreturn speakArabic;')(
      { speechSynthesis: ss }, ss, U, { voiceURI: null }, (t)=>meldungen.push(t), ()=>0, ()=>{}, { now: () => jetzt },
      { get: (k, f) => f, set(){} });
    f('كِتَابٌ');
    pruefe('mit verbogener Schwelle bleibt der 8-ms-Fall still — die Probe misst also den echten Code',
      meldungen.length, 0);
  }
}

console.log('');
console.log(fehler ? '⛔ ' + fehler + ' Befund(e).' : '✅ Die Sprachausgabe sagt, warum sie schweigt.');
process.exit(fehler ? 1 : 0);
