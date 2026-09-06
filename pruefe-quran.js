/* Stimmen die 36 Quranbezüge in vocab-data.js?
 *
 * Jeder Bezug behauptet dreierlei:
 *   1. die Stelle (z.B. "2:125") gibt es
 *   2. der zitierte arabische Text steht dort wirklich
 *   3. das Vokabelwort kommt in diesem Ausschnitt vor
 *
 * Nummer 3 ist die eigentliche Frage — ein Vers, der das Wort gar nicht
 * enthält, lehrt etwas Falsches. Bisher hat das niemand nachgemessen; die
 * Bezüge tragen nur die Notiz „Geprüft gegen quran.com".
 *
 * ⛔ VERGLICHEN WIRD ÜBER DAS KONSONANTENGERÜST, aber die Treffer werden
 * einzeln ausgegeben. Ein Skelettvergleich wirft die Ḥarakāt weg: مِنْ und مَنْ
 * sehen darin gleich aus. Für „kommt das Wort vor?" reicht das Gerüst, für ein
 * Urteil nicht. [[skelettvergleich_wirft_information_weg]]
 *
 * ⭐ QURAN_TEXT: Sure 1-basiert, Vers 0-basiert — `[sure][vers-1][0]`.
 * Geeicht wird an 1:1, 112:1 und 89:1, bevor irgendetwas gezählt wird.
 * [[quran_text_schluessel_null_basiert]]
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht selbst aus der URL basteln: der Ordner heisst
   «G:\1. Workspace» mit einer LEERSTELLE, die in import.meta.url als %20 steht.
   [[befehle_fuer_elias_powershell]] */
const W = path.dirname(fileURLToPath(import.meta.url)) + path.sep;
const kiste = { window: {}, console };
vm.createContext(kiste);
vm.runInContext(fs.readFileSync(W + 'vocab-data.js', 'utf8'), kiste, { filename: 'v' });
const V = vm.runInContext('VOCAB_DATA', kiste);

/* quran-text.js ist 2,3 MB — nur einmal laden. */
const qPfad = W + 'quran-text.js';
if (!fs.existsSync(qPfad)){ console.error('  quran-text.js fehlt'); process.exit(1); }
vm.runInContext(fs.readFileSync(qPfad, 'utf8'), kiste, { filename: 'q' });
const QT = vm.runInContext('typeof QURAN_TEXT !== "undefined" ? QURAN_TEXT : null', kiste);
if (!QT){ console.error('  QURAN_TEXT nicht gefunden'); process.exit(1); }

const nfc = s => String(s).normalize('NFC');
/* \u26D4 ZWEI RECHTSCHREIBUNGEN, EIN TEXT.
   Die Zitate in vocab-data.js stehen in der iml\u0101\u02BE\u012B-Schreibung, quran-text.js
   liefert die \u02BFuthm\u0101n\u012B-Fassung. Der erste Lauf meldete 20 von 36 Bez\u00FCgen als
   \u201EZitat weicht ab" \u2014 fast alle waren nur Schreibungsunterschiede:
     \u0627\u0644\u0652\u0628\u064E\u064A\u0652\u062A\u064E  gegen  \u0671\u0644\u0652\u0628\u064E\u064A\u0652\u062A\u064E   (Wa\u1E63la-Alif)
     \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F gegen  \u0671\u0644\u0652\u0643\u0650\u062A\u064E\u0670\u0628\u064F  (Dolch-Alif STATT Alif)
     \u0623\u064E\u0645\u0652\u0646\u064B\u0627    gegen  \u0623\u064E\u0645\u0652\u0646\u064B \u0627   (Leerzeichen mitten im Quellentext)
   Ein Werkzeug, das diese drei nicht kennt, erzeugt eine Kandidatenliste, in
   der die echten Befunde untergehen. [[kandidatenliste_ist_keine_fehlerliste]]

   \u26A0\uFE0F Das Dolch-Alif wird zu einem ALIF, nicht gel\u00F6scht \u2014 sonst w\u00FCrde \u0643\u0650\u062A\u064E\u0670\u0628
   zu \u0643\u062A\u0628 und passte nicht mehr auf \u0643\u062A\u0627\u0628. */
/* ٓ ist die Maddah. In 68:1 steht sie ueber dem Nun (646 653 6da), im
   Zitat steht dort ein LEERZEICHEN (646 20 6da) -- wieder nur Schreibung. */
const geruest = s => nfc(s)
  .replace(/\u0670/g, '\u0627')
  .replace(/[\u064B-\u0653\u0640\u06D6-\u06ED\u06DD\u06DE\u06E9\u200F\u200E]/g, '')
  .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
  .replace(/\s+/g, '');
const vers = (s, v) => {
  const a = QT[s];
  if (!a || !a[v - 1]) return null;
  const z = a[v - 1];
  return Array.isArray(z) ? z[0] : z;
};

/* ---------- Eichung an drei bekannten Stellen ---------- */
const EICH = [
  [1, 1, '\u0628\u0633\u0645'],          /* bismi   */
  [112, 1, '\u0642\u0644'],              /* qul     */
  [89, 1, '\u0648\u0627\u0644\u0641\u062C\u0631']  /* wal-fadschr */
];
let eichFehler = 0;
for (const [s, v, mussEnthalten] of EICH){
  const t = vers(s, v);
  const ok = t && geruest(t).includes(mussEnthalten);
  if (!ok){ eichFehler++; console.log('  ⛔ Eichung ' + s + ':' + v + ' — ' + (t ? t.slice(0, 40) : 'kein Text')); }
}
if (eichFehler){ console.error('  Eichung fehlgeschlagen — nichts gemessen.'); process.exit(1); }
console.log('  Eichung an 1:1, 112:1 und 89:1 ✅');
console.log('');

/* ---------- Die 36 Bezüge ---------- */
const mit = V.filter(w => w.quran && w.quran.ayah);
/* ⛔ EIN benannter Fall, mit Begruendung -- nicht stumm ausgeblendet.
   طَائِرٌ verweist auf 67:19, und dort steht das Kollektivum ٱلطَّيْرِ (at-tair,
   "die Voegel"), nicht das Einzelwort طَائِر (ta'ir). Das ist kein Versehen: die
   Eselsbruecke sagt es ausdruecklich -- "im Koran steht طَيْر fuer die Voegel".
   Beide gehen auf ط ي ر zurueck. Wer den Fall stumm herausfiltert, macht die
   Pruefung blind fuer den naechsten echten. [[pruefwerkzeug_mit_eingebauter_antwort]] */
const BEKANNT = {
  '67:19': 'Der Vers hat das Kollektivum at-tair; die Eselsbruecke erklaert genau diesen Unterschied.'
};

let stelleFehlt = 0, zitatWeicht = 0, wortFehlt = 0, ok = 0, bekannt = 0;
for (const w of mit){
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(String(w.quran.ayah).trim());
  if (!m){ stelleFehlt++; console.log('  ⛔ ' + w.ar + ': Stelle unlesbar — ' + w.quran.ayah); continue; }
  const [, sn, vn] = m;
  const text = vers(Number(sn), Number(vn));
  if (!text){ stelleFehlt++; console.log('  ⛔ ' + w.ar + ': ' + w.quran.ayah + ' gibt es nicht'); continue; }

  const gVers = geruest(text);
  /* 1. Steht das ZITAT wirklich dort? */
  const gZitat = geruest(w.quran.ar || '');
  const zitatDa = !gZitat || gVers.includes(gZitat);
  /* 2. Kommt das WORT im Vers vor? */
  const gWort = geruest(w.ar).replace(/^\u0627\u0644/, '');
  const wortDa = gVers.includes(gWort);

  if (BEKANNT[w.quran.ayah]){ bekannt++; continue; }
  if (!zitatDa){
    zitatWeicht++;
    console.log('  ⚠️ ' + w.ar + ' (' + w.quran.ayah + '): das Zitat steht so nicht im Vers');
    console.log('     Zitat: ' + String(w.quran.ar).slice(0, 60));
    console.log('     Vers:  ' + String(text).slice(0, 60));
  } else if (!wortDa){
    wortFehlt++;
    console.log('  ⛔ ' + w.ar + ' (' + w.quran.ayah + '): das WORT kommt im Vers nicht vor');
    console.log('     Vers: ' + String(text).slice(0, 70));
  } else ok++;
}
/* ---------- Ist der Offline-Quran überhaupt vollständig? (06.09.2026) ----
 *
 * ⛔ Diese Frage war nie gestellt worden, obwohl Elias mit dem Reader Hifz
 * macht. Ein fehlender oder leerer Vers fiele beim Lesen erst auf, wenn man
 * ihn schon auswendig kann — also genau dann nicht, wenn man ihn lernt.
 *
 * Geprüft wird NICHT, ob der Text richtig ist (dafür bräuchte es eine zweite
 * Quelle), sondern ob so viele Verse da sind, wie die App selbst behauptet:
 * surah-data.js gegen quran-text.js. Beides liegt hier ohnehin schon geladen.
 *
 * ⚠️ Die Eichung oben (1:1, 112:1, 89:1) gilt auch hier — QURAN_TEXT ist
 * Sure 1-basiert und Vers 0-basiert. [[quran_text_schluessel_null_basiert]] */
let quranLuecken = 0;
{
  const sPfad = W + 'surah-data.js';
  if (!fs.existsSync(sPfad)) {
    console.log('  ⓘ surah-data.js fehlt — Vollständigkeit ungeprüft.');
  } else {
    vm.runInContext(fs.readFileSync(sPfad, 'utf8'), kiste, { filename: 's' });
    const SD = vm.runInContext('typeof SURAH_DATA !== "undefined" ? SURAH_DATA : null', kiste);
    if (!SD) console.log('  ⓘ SURAH_DATA nicht gefunden — Vollständigkeit ungeprüft.');
    else {
      let soll = 0, leer = 0, abweichend = 0;
      for (const su of SD) {
        const nr = su.number ?? su.nummer ?? su.id;
        const n = su.verses ?? su.ayahs ?? su.verse;
        if (!nr || !n) continue;
        soll += n;
        const ist = QT[nr] ? QT[nr].length : 0;
        if (ist !== n) {
          abweichend++; quranLuecken++;
          console.log('  ⛔ Sure ' + nr + ': ' + ist + ' Verse im Text, ' + n + ' laut surah-data.js');
        }
        for (let v = 1; v <= Math.min(n, ist); v++) {
          const e = QT[nr][v - 1];
          const t = Array.isArray(e) ? e[0] : e;
          if (!t || !String(t).trim()) { leer++; quranLuecken++; console.log('  ⛔ Sure ' + nr + ':' + v + ' ist leer'); }
        }
      }
      console.log('  Offline-Quran: ' + SD.length + ' Suren, ' + soll + ' Verse erwartet — '
        + (abweichend || leer ? abweichend + ' Sure(n) mit falscher Verszahl, ' + leer + ' leere Verse'
                              : 'vollständig, kein leerer Vers'));

      /* ⛔ „0 Lücken" ist erst dann eine Messung, wenn diese Prüfung auch
         anschlagen KANN. Also einmal an einer Kopie stören: ein Vers weniger
         und ein leerer Vers müssen beide gefunden werden.
         [[leere_liste_ist_keine_messung]] [[stoertest_muss_wirkung_nachweisen]] */
      const nr114 = 114, soll114 = (SD.find(s => (s.number ?? s.nummer ?? s.id) === nr114) || {});
      const n114 = soll114.verses ?? soll114.ayahs ?? soll114.verse;
      const kopie = QT[nr114].slice();
      const fehltErkannt = (kopie.length - 1) !== n114;
      const leerErkannt = (() => { const k = kopie.slice(); k[0] = ''; const e = k[0];
                                   return !(Array.isArray(e) ? e[0] : e); })();
      console.log('  Störtest: ein fehlender Vers ' + (fehltErkannt ? 'wird' : '⛔ wird NICHT')
        + ' erkannt, ein leerer ' + (leerErkannt ? 'wird' : '⛔ wird NICHT') + ' erkannt.');
      if (!fehltErkannt || !leerErkannt) quranLuecken++;

      /* ---------- Und die Seitengrenzen (06.09.2026) ----------
       *
       * quran-seiten.js trägt die 604 Seitenanfänge des Muṣḥaf. Der Kopf der
       * Datei sagt, sie sei „geprueft gegen surah-data.js" — das stimmt, aber
       * nur EINMAL, beim Erzeugen durch werkzeuge/seiten-holen.mjs, und das
       * braucht Netz. Wird die Datei später beschädigt, merkt es niemand:
       * eine falsche Seitenzahl unter dem Text sieht aus wie eine richtige.
       * [[erfundene_begruendung_schliesst_den_fall]] */
      /* Und die Juz-Angaben, aus demselben Grund: der Kopf von surah-data.js
         beschreibt eine gründliche Probe — aber sie lief einmal, in
         werkzeuge/juz-holen.mjs, gegen eine API. Hier steht nur noch, ob das
         Ergebnis in sich stimmt: alle 30 Teile kommen vor, keiner läuft
         rückwärts, keine Sure ohne Angabe. */
      {
        const ohne = SD.filter(s => s.juz === undefined).length;
        const alle = new Set();
        let rueck = 0, hoechster = 0;
        for (const s of SD) {
          if (s.juz === undefined) continue;
          const js = Array.isArray(s.juz) ? s.juz : [s.juz];
          js.forEach(j => alle.add(j));
          if (Math.min(...js) < hoechster) {
            rueck++;
            console.log('  ⛔ Sure ' + (s.number ?? s.id) + ': Juz ' + js.join(',') + ' steht nach Juz ' + hoechster);
          }
          hoechster = Math.max(hoechster, ...js);
        }
        const fehlend = []; for (let j = 1; j <= 30; j++) if (!alle.has(j)) fehlend.push(j);
        quranLuecken += ohne + rueck + fehlend.length;
        console.log('  Juz: ' + alle.size + ' von 30 vertreten' + (fehlend.length ? ' (es fehlen ' + fehlend.join(', ') + ')' : '')
          + ' · ' + ohne + ' Sure(n) ohne Angabe · ' + rueck + ' rückwärts');
      }

      const pPfad = W + 'quran-seiten.js';
      if (fs.existsSync(pPfad)) {
        vm.runInContext(fs.readFileSync(pPfad, 'utf8'), kiste, { filename: 'p' });
        const P = vm.runInContext('typeof QURAN_SEITEN !== "undefined" ? QURAN_SEITEN : null', kiste);
        if (!P) console.log('  ⓘ QURAN_SEITEN nicht gefunden — Seitengrenzen ungeprüft.');
        else {
          const verse = new Map(SD.map(s => [(s.number ?? s.nummer ?? s.id), (s.verses ?? s.ayahs ?? s.verse)]));
          let ungueltig = 0, rueckwaerts = 0, vor = [0, 0];
          for (let i = 0; i < P.length; i++) {
            const [su, ay] = P[i];
            if (!verse.has(su) || ay < 1 || ay > verse.get(su)) {
              ungueltig++; console.log('  ⛔ Seite ' + (i + 1) + ' beginnt bei ' + su + ':' + ay + ' — die Stelle gibt es nicht');
            } else {
              const e = QT[su] && QT[su][ay - 1];
              const t = Array.isArray(e) ? e[0] : e;
              if (!t || !String(t).trim()) { ungueltig++; console.log('  ⛔ Seite ' + (i + 1) + ': ' + su + ':' + ay + ' hat keinen Text'); }
            }
            /* ⛔ Streng aufsteigend, nicht nur „nicht kleiner": zwei Seiten,
               die an derselben Stelle beginnen, wären eine leere Seite. */
            if (su < vor[0] || (su === vor[0] && ay <= vor[1])) {
              rueckwaerts++; console.log('  ⛔ Seite ' + (i + 1) + ' (' + su + ':' + ay + ') läuft nicht vorwärts (vorher ' + vor.join(':') + ')');
            }
            vor = [su, ay];
          }
          quranLuecken += ungueltig + rueckwaerts;
          /* Störtest, sonst ist auch diese Null keine Messung. */
          let stoer = 0, v2 = [0, 0];
          for (const [su, ay] of P.map((p, i) => i === 5 ? [1, 1] : p)) {
            if (su < v2[0] || (su === v2[0] && ay <= v2[1])) stoer++;
            v2 = [su, ay];
          }
          console.log('  Seitengrenzen: ' + P.length + ' Seiten von ' + P[0].join(':')
            + ' bis ' + P[P.length - 1].join(':') + ' — '
            + (ungueltig || rueckwaerts ? ungueltig + ' ungültig, ' + rueckwaerts + ' nicht vorwärts'
                                        : 'alle gültig und streng aufsteigend')
            + ' · Störtest: ' + (stoer > 0 ? 'greift' : '⛔ greift nicht'));
          if (!stoer) quranLuecken++;
        }
      }
    }
  }
}

console.log('');
const befunde = zitatWeicht + wortFehlt + stelleFehlt + quranLuecken;
console.log('  ' + mit.length + ' Bezüge: ' + ok + ' in Ordnung · ' + bekannt + ' benannte Ausnahme(n) · '
          + zitatWeicht + ' Zitat weicht ab · ' + wortFehlt + ' Wort fehlt · ' + stelleFehlt + ' Stelle unbrauchbar');
for (const [stelle, grund] of Object.entries(BEKANNT)) console.log('     (' + stelle + ': ' + grund + ')');
console.log(befunde ? String.fromCharCode(10) + '⛔ ' + befunde + ' Befund(e) — jeden einzeln lesen.'
                    : String.fromCharCode(10) + '✅ Jeder Quranbezug fuehrt an eine Stelle, an der das Wort wirklich steht.');
process.exit(befunde ? 2 : 0);
