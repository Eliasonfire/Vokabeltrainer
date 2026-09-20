/* Halten die markierten Fehlerstellen im Korantext — und bleibt der Text
 * dabei unangetastet?
 *
 * ⛔⛔ DER AUFTRAG (Elias am 19.09.2026, vom Handy): „Ich will auch im Koran
 *    den Text markieren irgendwie können für Fehler zB wo ich tajweed etwas
 *    falsch mache." Seine drei Entscheidungen um 23:54:21: einzelne
 *    BUCHSTABEN, Farbe UND eigene Notiz, vorerst keine Übersichtsseite.
 *    Und am 20.09.2026 (v538): JEDER Buchstabe hat SEINE Farbe und SEINE
 *    Notiz — „jeder übernimmt die gleiche farbe und notiz ist auch nur für
 *    ein feld. irgendwie finde ich müssen wir das system dahinter nochmals
 *    etwas überdenken".
 *
 * ⛔ Zwei Dinge könnten hier still kaputtgehen, und beide sieht man nicht:
 *    1. Der arabische Text wird zerschnitten. Dann stehen die Buchstaben
 *       unverbunden da — ein anderes Schriftbild als im Muṣḥaf.
 *    2. Eine weggenommene Markierung kommt vom anderen Gerät zurück, weil
 *       sie als FEHLENDER Eintrag gespeichert wurde statt als `an:false` mit
 *       Zeitstempel. Genau dieser Fehler war am 06.09.2026 schon einmal da.
 *
 * ⛔ Die Funktionen werden aus js/quran-markierung.js HERAUSGESCHNITTEN und
 *    im vm gefahren, nicht nachgebaut. Ein nachgebauter Prüfling besteht
 *    jeden Test, weil er den Fehler gar nicht enthält.
 *    [[testvorlage_selbst_nachgebaut]]
 *
 * ⭐ Drei Störtests am Ende: zurückgedrehte Fassungen müssen rot werden,
 *    sonst misst die grüne Liste nichts. [[stoertest_muss_wirkung_nachweisen]]
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

/* ⛔ fileURLToPath, nicht .pathname: der Pfad enthält ein Leerzeichen und
   steht in einer URL als %20 — fs findet 'G:\1.%20Workspace' nie. */
const lies = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const mark  = lies('../js/quran-markierung.js');
const quran = lies('../js/quran.js');
const sync  = lies('../js/sync.js');
const navi  = lies('../js/navigation.js');
const html  = lies('../index.html');
const sw    = lies('../sw.js');
const einst = lies('../js/einstellungen.js');

/* ⛔ Die Prüfwörter werden aus Zeichencodes gebaut, nicht abgeschrieben.
   Arabische Vokalzeichen sind unsichtbar — ein kopiertes Wort kann ein
   Zeichen zu viel oder zu wenig haben, und niemand sieht es der Datei an.
   Genau darum geht es hier aber: um die ZAHL der Zeichen.
   [[zeichenklasse_nie_sichtbar_kopieren]] */
const ch = (...codes) => codes.map(c => String.fromCharCode(c)).join('');
const W_ALLAH = ch(0x0671, 0x0644, 0x0644, 0x064E, 0x0651, 0x0647, 0x064F); // ٱللَّهُ — 4 Buchstaben, 7 Zeichen
const W_QUL   = ch(0x0642, 0x064F, 0x0644, 0x0652);                          // قُلْ  — 2 Buchstaben, 4 Zeichen
const DAMMA   = ch(0x064F);
const LAM_SCH = ch(0x0644, 0x064E, 0x0651);                                   // لَّ — Lām mit Fatḥa und Šadda
/* Ein Wort, das quranWorte() aus zwei Stücken zusammengesetzt hat: Tanwīn
   Fatḥ, Leerzeichen, Alif. Das Leerzeichen ist kein Buchstabe. */
const W_GETEILT = ch(0x062F, 0x064B) + ch(0x0627) + ' ' + ch(0x0627);

/* ⛔ Verbote im Quelltext werden im KOMMENTARFREIEN Text gesucht. Sonst
   findet der Prüfer seine eigene Warnung: „⛔ NICHT CSS.highlights.clear()"
   steht als Kommentar in der Datei, und eine Suche danach meldet genau die
   Zeile als Verstoß, die den Verstoß verbietet. Zweimal passiert, beim
   ersten Lauf dieses Prüfers am 20.09.2026.
   [[funktion_als_referenz_sieht_tot_aus]] */
const ohneKommentare = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const markNackt = ohneKommentare(mark);
const htmlNackt = ohneKommentare(html);

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(58)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};

/* ------------------- Die Stücke aus dem echten Quelltext ------------------ */
const schneide = (name) => {
  const m = mark.match(new RegExp('\\nfunction ' + name + '\\([\\s\\S]*?\\n\\}\\n'));
  return m ? m[0] : null;
};
const TEILE = {
  normal:    schneide('tajweedEintragNormal'),
  laden:     schneide('tajweedLaden'),
  cluster:   schneide('tajweedCluster'),
  clusterAn: schneide('tajweedClusterAn'),
  stellen:   schneide('tajweedStellen'),
  jeWort:    schneide('tajweedJeWort'),
  kanten:    schneide('tajweedKanten')
};
const mKonst  = mark.match(/const TJ_SCHLUESSEL[\s\S]*?const TJ_FARBE_VORGABE = '[a-z]+';/);
const mKombi  = mark.match(/const TJ_KOMBI = \/\[[^\n]*\/;/);
const mMin    = mark.match(/const TJ_FLAECHE_MIN = (\d+);/);
const mFertig = mark.match(/\nfunction tajweedFertig\(\)\{[\s\S]*?\n\}\n/);
const fehlt = Object.entries(TEILE).filter(([, v]) => !v).map(([k]) => k)
  .concat(!mKonst ? ['Konstanten'] : [], !mKombi ? ['TJ_KOMBI'] : [],
          !mMin ? ['TJ_FLAECHE_MIN'] : [], !mFertig ? ['tajweedFertig'] : []);
if (fehlt.length){
  console.log('X  Quelltext nicht gefunden: ' + fehlt.join(', '));
  process.exit(1);
}

/* Ein Kontext mit genau so viel Umgebung, wie die Stücke fragen — nicht mehr.
   [[pruefung_fragt_einen_stellvertreter_ab]] */
function baueUmgebung(teile = TEILE, speicher = {}){
  const abgelegt = {};
  const ctx = {
    LS: { get: (k, f) => (k in speicher ? speicher[k] : f), set: (k, v) => { abgelegt[k] = JSON.parse(JSON.stringify(v)); } },
    Intl, JSON, Math, Object, Array, String, Number, Map, Set, Date,
    console: { log(){} }
  };
  vm.createContext(ctx);
  vm.runInContext(
    mKonst[0] + '\n' + mKombi[0] + '\nconst TJ_CLUSTER_CACHE = new Map();\n'
    + mMin[0] + '\nlet TAJWEED = {};\n'
    + Object.values(teile).join('\n')
    + '\nthis.API = { tajweedLaden, tajweedCluster, tajweedClusterAn, tajweedStellen, tajweedJeWort, tajweedKanten,'
    + ' setzeTajweed: (v)=>{ TAJWEED = v; } };', ctx);
  return { api: ctx.API, abgelegt };
}

/* ===================== 1. Buchstaben statt Zeichen ======================== */
{
  const { api } = baueUmgebung();
  const zahl  = (w) => api.tajweedCluster(w).length;
  const texte = (w) => api.tajweedCluster(w).map(c => c.text);
  console.log('Ein Buchstabe ist Basiszeichen PLUS alles darüber und darunter:');
  pruefe('4 Buchstaben aus 7 Zeichen (Allāh)', 4, zahl(W_ALLAH));
  pruefe('2 Buchstaben aus 4 Zeichen (qul)',   2, zahl(W_QUL));
  pruefe('die Ḥaraka hängt am Buchstaben davor', DAMMA, texte(W_QUL)[0].slice(1));
  pruefe('Wort mit Leerzeichen: 3 Buchstaben', 3, zahl(W_GETEILT));
  pruefe('… und keine Stelle ist ein Leerzeichen', false, texte(W_GETEILT).some(t => !t.trim()));
  pruefe('leerer Text ergibt keine Buchstaben', 0, zahl(''));
}

/* =============== 2. Die Stelle zeigt weiter auf ihr Zeichen =============== */
{
  const { api } = baueUmgebung();
  const cl = api.tajweedCluster(W_ALLAH);
  console.log('Eine gespeicherte Stelle findet ihren Buchstaben wieder:');
  pruefe('Position 2 ist der dritte Buchstabe', LAM_SCH,
    api.tajweedClusterAn(cl, 2) && api.tajweedClusterAn(cl, 2).text);
  pruefe('Position 3 liegt IM dritten Buchstaben -> derselbe', LAM_SCH,
    api.tajweedClusterAn(cl, 3) && api.tajweedClusterAn(cl, 3).text);
  pruefe('Position hinter dem Wort -> nichts', null, api.tajweedClusterAn(cl, 99));
}

/* ============ 3. Je Buchstabe ein Eintrag, mit Zeitstempel ================ */
{
  console.log('Der Speicher: je BUCHSTABE ein Eintrag { an, farbe, notiz, zeit }:');
  const zwei = {
    '112:1:3:2': { an: true, zeichen: 'x', farbe: 'blau', notiz: 'zu kurz', zeit: 1000 },
    '112:1:3:5': { an: true, zeichen: 'y', farbe: 'lila', notiz: 'zu lang', zeit: 1100 }
  };
  const u = baueUmgebung(TEILE, { vt_tajweed: zwei });
  const geladen = u.api.tajweedLaden();
  u.api.setzeTajweed(geladen);
  pruefe('Farbe und Notiz überleben das Laden', ['blau', 'zu kurz'],
    [geladen['112:1:3:2'].farbe, geladen['112:1:3:2'].notiz]);
  pruefe('der Zeitstempel überlebt das Laden', 1000, geladen['112:1:3:2'].zeit);
  /* ⭐ Elias' Punkt vom 20.09.2026: zwei Buchstaben desselben Wortes,
     zwei Farben, zwei Notizen. */
  const st = u.api.tajweedStellen(112, 1, 3);
  pruefe('zwei Buchstaben im selben Wort, jeder mit EIGENER Farbe', ['blau', 'lila'], st.map(s => s.farbe));
  pruefe('… und jeder mit EIGENER Notiz', ['zu kurz', 'zu lang'], st.map(s => s.notiz));
  pruefe('… nach Position sortiert', [2, 5], st.map(s => s.pos));
  pruefe('ein anderes Wort hat nichts', 0, u.api.tajweedStellen(112, 1, 4).length);
  const jw = u.api.tajweedJeWort();
  pruefe('die Gruppierung fürs Zeichnen kennt das Wort', 2, (jw.get('112:1:3') || []).length);

  /* ⛔⛔ Das ist der Kern: ein weggenommener Buchstabe bleibt als `an:false`
     STEHEN. Ein fehlender Eintrag verliert jeden Vergleich „der jüngere
     Stempel gewinnt" — und käme vom anderen Gerät zurück. */
  const weg = { '112:1:3:2': { an: false, zeichen: '', farbe: 'blau', notiz: '', zeit: 2000 } };
  const w = baueUmgebung(TEILE, { vt_tajweed: weg });
  const g2 = w.api.tajweedLaden();
  w.api.setzeTajweed(g2);
  pruefe('weggenommen bleibt als Eintrag stehen', true, '112:1:3:2' in g2);
  pruefe('… mit an:false und seinem Zeitstempel', [false, 2000], [g2['112:1:3:2'].an, g2['112:1:3:2'].zeit]);
  pruefe('… und wird nicht gezeichnet', 0, w.api.tajweedStellen(112, 1, 3).length);

  pruefe('kaputter Eintrag wird übergangen, nicht geworfen', 0,
    Object.keys(baueUmgebung(TEILE, { vt_tajweed: { 'x': 'quatsch', '1:2': 5 } }).api.tajweedLaden()).length);

  /* Die Wort-Form von v536/v537 wird in Buchstaben aufgelöst. */
  console.log('Die alte Wort-Form (v536) wird beim Laden aufgelöst:');
  const alt = { '112:1:3': { an: true, stellen: [2, 5], zeichen: 'a b', farbe: 'rot', notiz: 'alt', zeit: 500 } };
  const a = baueUmgebung(TEILE, { vt_tajweed: alt });
  const ga = a.api.tajweedLaden();
  a.api.setzeTajweed(ga);
  pruefe('aus einem Wort-Eintrag werden zwei Buchstaben-Einträge', ['112:1:3:2', '112:1:3:5'],
    Object.keys(ga).filter(k => k.split(':').length === 4).sort());
  pruefe('… mit Farbe, Notiz und altem Zeitstempel', ['rot', 'alt', 500],
    [ga['112:1:3:2'].farbe, ga['112:1:3:2'].notiz, ga['112:1:3:2'].zeit]);
  pruefe('… und je Buchstabe sein Zeichen', ['a', 'b'], [ga['112:1:3:2'].zeichen, ga['112:1:3:5'].zeichen]);
  pruefe('der alte Wort-Eintrag bleibt als an:false stehen (Abgleich!)', [false, 500],
    [ga['112:1:3'].an, ga['112:1:3'].zeit]);
  pruefe('… und die Auflösung wird sofort zurückgeschrieben', true, 'vt_tajweed' in a.abgelegt);
  pruefe('ein neuerer Buchstaben-Eintrag schlägt die alte Wort-Form', 'blau',
    baueUmgebung(TEILE, { vt_tajweed: Object.assign({}, alt, { '112:1:3:2': { an: true, farbe: 'blau', notiz: '', zeit: 900 } }) })
      .api.tajweedLaden()['112:1:3:2'].farbe);
}

/* ============ 4. Ein unveränderter Buchstabe behält seinen Stempel ======== */
{
  console.log('Fertig stempelt nur, was sich geändert hat:');
  pruefe('tajweedFertig vergleicht vor dem Stempeln', true, /const gleich = alt && /.test(mFertig[0]));
  pruefe('… und zwar an, farbe UND notiz', true,
    /alt\.an/.test(mFertig[0]) && /alt\.farbe/.test(mFertig[0]) && /alt\.notiz/.test(mFertig[0]));
  pruefe('… und übergeht Unverändertes', true, /if \(gleich\) continue;/.test(mFertig[0]));
  pruefe('ein weggenommener Buchstabe wird als an:false GESPEICHERT, nicht gelöscht', true,
    /const an = !!jetzt;/.test(mFertig[0]) && /vorher\.keys\(\)/.test(mFertig[0]) && !/delete TAJWEED/.test(markNackt));
}

/* ==================== 5. Die Trefferflächen für den Finger ================ */
const ECHT_GEMESSEN = [
  { links: 204, rechts: 247 }, { links: 247, rechts: 271 },
  { links: 271, rechts: 291 }, { links: 291, rechts: 314 }
].map((r, n) => ({ c: { i: n }, links: r.links, rechts: r.rechts }));
{
  const { api } = baueUmgebung();
  const MIN = Number(mMin[1]);
  const kanten = api.tajweedKanten(ECHT_GEMESSEN, 518);
  const breiten = kanten.slice(1).map((k, n) => Math.round(k - kanten[n]));
  console.log('Jede Fläche ist fingerbreit, lückenlos und in der Reihenfolge:');
  pruefe('keine Fläche schmaler als ' + MIN, true, breiten.every(b => b >= MIN));
  pruefe('die Kanten steigen -> keine Überlappung', true,
    kanten.every((k, n) => n === 0 || k > kanten[n - 1]));
  pruefe('die Flächen stoßen aneinander -> keine tote Lücke', true,
    breiten.reduce((a, b) => a + b, 0) === Math.round(kanten[kanten.length - 1] - kanten[0]));
  pruefe('sie reichen NICHT bis an den Kartenrand', true, kanten[kanten.length - 1] < 518);
  const viele = Array.from({ length: 12 }, (_, n) => ({ c: { i: n }, links: 10 + n * 8, rechts: 18 + n * 8 }));
  const engeKanten = api.tajweedKanten(viele, 340);
  const engeBreiten = engeKanten.slice(1).map((k, n) => k - engeKanten[n]);
  pruefe('12 Buchstaben auf 340 Pixeln: gleichmäßig geteilt', true,
    Math.max(...engeBreiten) - Math.min(...engeBreiten) < 0.01);
  pruefe('… und nichts ragt über die Bühne hinaus', true,
    engeKanten[0] >= 0 && engeKanten[engeKanten.length - 1] <= 340);
  pruefe('ein einzelner Buchstabe bekommt auch eine Fläche', 2,
    api.tajweedKanten([{ c: { i: 0 }, links: 100, rechts: 112 }], 300).length);
}

/* ============ 6. Der Text selbst wird nicht angefasst ===================== */
{
  console.log('Der Korantext bleibt unzerschnitten:');
  pruefe('die Markierung läuft über CSS.highlights', true, /CSS\.highlights\.set\(/.test(markNackt));
  pruefe('kein innerHTML auf dem Wort im Lesetext', false,
    /\.qw[^\n]*innerHTML/.test(markNackt) || /span\.innerHTML\s*=/.test(markNackt));
  pruefe('quranWortSpans zerlegt weiter in WÖRTER, nicht in Buchstaben', true,
    /class="qw" data-w="/.test(quran) && !/class="qb"/.test(quran));
  pruefe('kein letter-spacing auf dem großen Wort', false,
    /\.tj-wort\{[^}]*letter-spacing\s*:/.test(htmlNackt));
  pruefe('räumt nur die eigenen Namen weg', false, /CSS\.highlights\.clear\(\)/.test(markNackt));
  pruefe('es gibt einen sichtbaren Rückfall ohne die Schnittstelle', true,
    /classList\.add\('tj-wort'/.test(markNackt) && /\.qw\.tj-wort\{/.test(htmlNackt));
  /* Elias 20.09.2026: „ich will das das unterstrichene gerade ist". */
  pruefe('die Linie ist GERADE, keine Welle (Elias 20.09.)', true,
    /::highlight\(tajweed-rot\)[^}]*underline solid/.test(htmlNackt) && !/::highlight\([^)]*\)[^}]*wavy/.test(htmlNackt));
  pruefe('Karte und Lesetext haben getrennte Highlight-Namen', true,
    /tajweedHighlightsSetzen\('tajweed-karte-'/.test(markNackt) && /tajweedHighlightsSetzen\('tajweed-'/.test(markNackt));
}

/* ==================== 7. Verdrahtung: sieht es jemand? ==================== */
{
  console.log('Der Weg von der Datei bis auf den Schirm:');
  pruefe('index.html lädt js/quran-markierung.js', true,
    html.includes('<script src="js/quran-markierung.js"></script>'));
  pruefe('sw.js hat die Datei im Vorrat', true, sw.includes("'./js/quran-markierung.js'"));
  pruefe('renderVerses zeichnet die Markierungen nach jedem Neuaufbau', true,
    /tajweedZeichnen === 'function'\) tajweedZeichnen\(\)/.test(quran));
  pruefe('nach dem Geräteabgleich wird neu geladen (ladeQuranStandNeu)', true,
    /function ladeQuranStandNeu\(\)\{[\s\S]*?tajweedNachAbgleich\(\);[\s\S]*?\n\}/.test(quran));
  pruefe('die Zurück-Taste schließt die Karte', true,
    /id: 'tajweedKarte',\s*zu: 'tajweedKarteSchliessen'/.test(navi));
  pruefe('der Knopf steht in der Leiste', true, html.includes('id="btnTajweedModus"'));
  pruefe('die Karte steht im Markup', true, html.includes('id="tajweedKarte"') && html.includes('id="tjFlaechen"'));
  pruefe('der Zettel steht im Markup', true, html.includes('id="tajweedZettel"'));
  /* Elias 20.09.2026: die Karte kam „von mittig links" — popIn ist für
     mittige Kästen gebaut. */
  pruefe('die Karte fährt NICHT mit popIn auf', false, /\.tajweed-karte\{[^}]*animation:popIn/.test(htmlNackt));
  pruefe('… sondern mit kartenAuf', true, /\.tajweed-karte\{[^}]*animation:kartenAuf/.test(htmlNackt) && /@keyframes kartenAuf/.test(htmlNackt));
  /* Elias 20.09.2026: „rechtsbündig". */
  pruefe('die drei Knöpfe stehen rechtsbündig in EINER Reihe', true,
    /\.hifz-knoepfe\{[^}]*justify-content:flex-end[^}]*flex-wrap:nowrap/.test(htmlNackt));

  pruefe('vt_tajweed wird abgeglichen', true, /'vt_tajweed',/.test(sync));
  const zweig = sync.match(/if \(k === 'vt_bekannt'[\s\S]*?\)\{/);
  pruefe('… im Zweig, der je Id den späteren Stempel nimmt', true, !!zweig && /vt_tajweed/.test(zweig[0]));
  const zeitform = sync.match(/const zeitform = \([\s\S]*?\);/);
  pruefe('… und NICHT in der Kurzform, die nur {an,zeit} behält', false,
    !!zeitform && /vt_tajweed/.test(zeitform[0]));
  pruefe('vt_tajweed kommt in die Sicherung', true, /'vt_tajweed',/.test(einst));
}

/* ========================== 8. Die Störtests ============================== */
{
  console.log('Störtests (jede zurückgedrehte Fassung muss auffallen):');

  const ohneMin = TEILE.kanten.replace(/if \(bis - von >= noetig\)\{[\s\S]*?\n  \} else \{[\s\S]*?\n  \}/,
    'for (let k = 1; k < n; k++) kanten[k] = (sortiert[k-1].rechts + sortiert[k].links) / 2;');
  pruefe('a) die Störfassung unterscheidet sich vom Original', true, ohneMin !== TEILE.kanten);
  const a = baueUmgebung(Object.assign({}, TEILE, { kanten: ohneMin }));
  const k1 = a.api.tajweedKanten(ECHT_GEMESSEN, 518);
  pruefe('a) ohne Mindestbreite wird eine Fläche zu schmal', true,
    k1.slice(1).map((k, n) => k - k1[n]).some(b => b < Number(mMin[1])));

  const alteForm = TEILE.normal.replace(/zeit: Number\(v\.zeit\) \|\| 0/, 'zeit: 0');
  pruefe('b) die Störfassung unterscheidet sich vom Original', true, alteForm !== TEILE.normal);
  const b = baueUmgebung(Object.assign({}, TEILE, { normal: alteForm }),
    { vt_tajweed: { '112:1:3:2': { an: true, farbe: 'rot', notiz: '', zeit: 5000 } } });
  pruefe('b) ohne Zeitstempel verliert der Eintrag sein Datum', 0,
    b.api.tajweedLaden()['112:1:3:2'].zeit);

  const ohneKombi = TEILE.cluster
    .replace(/try \{\s*if \(typeof Intl[\s\S]*?catch \(e\)\{ out = \[\]; \}/, 'out = [];')
    .replace(/TJ_KOMBI\.test\(z\)/, 'false');
  pruefe('c) die Störfassung unterscheidet sich vom Original', true, ohneKombi !== TEILE.cluster);
  const c = baueUmgebung(Object.assign({}, TEILE, { cluster: ohneKombi }));
  pruefe('c) ohne Zusammenfassung hat Allāh 7 statt 4 Stellen', 7, c.api.tajweedCluster(W_ALLAH).length);
}

console.log(fehler === 0
  ? '\nAlles gruen: die Markierungen halten, und der Korantext bleibt unangetastet.'
  : '\n' + fehler + ' Probe(n) rot.');
process.exit(fehler === 0 ? 0 : 1);
