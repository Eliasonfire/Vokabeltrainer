#!/usr/bin/env node
/* pruefe-satz-teile.mjs — der Satzmodus in drei Teilen (v606, 25.09.2026)
 * ==========================================================================
 * Elias, wörtlich: „also tag 1 satz teil 1, tag 2 hören, tag 3 satz teil 2 und
 * dann wieder hören. es muss aber klappen, dass es nicht random ist weil sonst
 * gehen einige modis unter und andere sind viel mehr. und dann auch
 * dementsprechend das tagesziel darauf auslegen wie viel es ist um genau die
 * hälte zu machen … und ich möchte das beide teile ungefähr gleich
 * zeitaufwändig sind deswegen guck welche modis man in welches teil packt".
 *
 * ⭐ Seit v618 (25.09.2026) laufen die Teile von selbst. Elias: „ich stelle
 * mir das so vor das die app automatisch meinen ring bzw mein tagesziel
 * einstellt … und wenn ich weiter machen will kommt halt automatisch der
 * zweite teil. und am anderen tag halt andersherum … sollte ich mal an einem
 * tag den satzmodus nicht machen dann wartet so lange der teil den ich hätte
 * machen müssen bis ich ihn machen." — auf die Zusammenfassung: „ja so will
 * ich das".
 *
 * Prüft an den ECHTEN Funktionen aus js/uebung.js und js/kern.js:
 *   1. jede Übung steht in genau einem Teil — auch eine neue,
 *   2. die Teile sind gleich lang (Unterschied höchstens eine Übung),
 *   3. die Fälle a–f von v618, jeder mit einem Störtest:
 *      (a) Tagesziel = die Übungen des Anfangsteils (7 bzw. 9), keine Einstellung,
 *      (b) nach „geschafft" zieht „Gemischt" den anderen Teil — auch eine
 *          laufende Liste (uebungWeiter()),
 *      (c) der nächste Satz-Tag geht andersherum, auch nach Weitermachen,
 *      (d) ein nicht geschaffter Teil wartet, auch über mehrere Tage,
 *      (e) das alte Format { teil, tag } wird richtig übernommen,
 *      (f) halb geschafft zählt nicht,
 *   4. gemessene Zeiten schlagen die Schätzung,
 *   5. „Gemischt", der Ring, die Startseite, die Feier und die Einstellungen
 *      nehmen den Teil — und niemand liest mehr SETTINGS.satzZiel,
 *   6. verwandte Übungen stehen in verschiedenen Teilen (27.09.2026, sein Paar
 *      10/12 und drei weitere), mit Störtest,
 *   7. ein Durchgang von „Gemischt" nimmt keinen Satz doppelt, mit Störtest,
 *   8. eine ruhende Übung (`ruht:true`, seit 19.10.2026 Übung 1) steht in keinem Teil, in
 *      keiner Auswahl-Liste und in keiner Statistik, und keine andere wechselt ihretwegen den
 *      Teil — an jeder Übung geprüft, mit vier Störtests.
 * Exit 0 = alles richtig · 1 = Befund.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ohneKommentareUndTexte } from './js-quelltext.mjs';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = f => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');
const ueb = lies('js/uebung.js'), kern = lies('js/kern.js'), start = lies('js/start.js'), feier = lies('js/feier.js');
const einst = lies('js/einstellungen.js'), html = lies('index.html');
const nurCode = t => ohneKommentareUndTexte(String(t), { texte: false });

let fehler = 0;
const pruefe = (was, ok, ist) => { if (!ok) fehler++; console.log('  ' + (ok ? 'ok ' : 'X  ') + was + (ok ? '' : '   ist: ' + ist)); };

function schneide(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){ if (text[i] === '{') t++; else if (text[i] === '}' && !--t) return text.slice(a, i + 1); }
  return null;
}
/* Mit den zwei Feldern, die satzTeile() außerdem liest — je eine eigene Zeile direkt unter der
   Kopfzeile des Eintrags: `teilRang` (04.10.2026) und `ruht` (19.10.2026, Abschnitt 8). Bis zum
   19.10.2026 las dieser Prüfer `teilRang` nicht mit und teilte deshalb anders als die App. */
const UEB_ZEILEN = ueb.split('\n');
const UEBUNGEN = [];
UEB_ZEILEN.forEach((z, i) => {
  const m = /^ {4}id:'([a-z0-9-]+)', nr:(\d+), name:'[^']*', art:'([a-z]+)'/.exec(z);
  if (!m) return;
  const u = { id: m[1], nr: Number(m[2]), art: m[3] };
  for (const folge of UEB_ZEILEN.slice(i + 1, i + 3)){
    const r = /^ {4}teilRang:(\d+),/.exec(folge);
    if (r) u.teilRang = Number(r[1]);
    if (/^ {4}ruht:true,/.test(folge)) u.ruht = true;
  }
  /* `ausserhalbTeile` (Übung 21, 09.11.2026) steht weiter unten im Eintrag — bis zum nächsten
     Eintrag suchen. Ohne das Feld teilte dieser Prüfer die Geschichte mit ein, die App nicht. */
  for (const folge of UEB_ZEILEN.slice(i + 1, i + 12)){
    if (/^ {4}id:'/.test(folge)) break;
    if (/^ {4}ausserhalbTeile:true,/.test(folge)) u.ausserhalbTeile = true;
  }
  UEBUNGEN.push(u);
});
const AKTIV = UEBUNGEN.filter(u => !u.ruht && !u.ausserhalbTeile), RUHEND = UEBUNGEN.filter(u => u.ruht);
if (!UEBUNGEN.some(u => u.ausserhalbTeile)) { console.log('X  kein Eintrag mit ausserhalbTeile gefunden — Übung 21 wird mitverteilt'); process.exitCode = 1; }
const mSchaetzung = ueb.match(/const UEB_ZEIT_SCHAETZUNG = (\{[^}]+\});/);
const NAMEN = ['satzTeile', 'satzTag', 'satzTagSpeichern', 'satzTeilZustand', 'satzTeilStand', 'satzTeilHeute',
               'satzTageszielHeute', 'satzTeilAuswahl', 'uebungWeiter'];
const teileUeb = NAMEN.map(n => [n, schneide(ueb, n)]);
const teileKern = [['uebZeitGemessen', schneide(kern, 'uebZeitGemessen')]];
const fehlt = teileUeb.concat(teileKern).filter(([, t]) => !t).map(([n]) => n);
if (fehlt.length || !mSchaetzung || UEBUNGEN.length < 10){
  console.log('X  Quelltext nicht gefunden: ' + fehlt.concat(!mSchaetzung ? ['UEB_ZEIT_SCHAETZUNG'] : [],
    UEBUNGEN.length < 10 ? ['UEBUNGEN (' + UEBUNGEN.length + ')'] : []).join(', '));
  process.exit(1);
}
const code = teileKern.concat(teileUeb).map(([, t]) => t).join('\n');

/* Eine Welt mit Speicher, Einstellungen und Datum — alles, was die echten
   Funktionen anfassen. `antworte(n)` macht, was answer() nach einer
   Satzantwort tut: Tageszähler hoch, speichern, Teil merken. */
function kontext(quelltext, uebungen){
  const k = { UEBUNGEN: uebungen.map(u => ({ ...u })), QUOTE_TAGE: {}, SETTINGS: {}, heute: '2026-09-26', gespeichert: 0,
              speicher: {}, UEB_GEMISCHT: 'gemischt', UEB: { modus: null }, Object, Math, Number, Set, String, JSON };
  k.todayStr = (o) => { const d = new Date(k.heute + 'T12:00:00'); d.setDate(d.getDate() + (o || 0)); return d.toISOString().slice(0, 10); };
  k.saveSettings = () => { k.gespeichert++; };
  k.LS = { get: (s, d) => (s in k.speicher ? JSON.parse(JSON.stringify(k.speicher[s])) : d), set: (s, v) => { k.speicher[s] = JSON.parse(JSON.stringify(v)); } };
  /* Für uebungWeiter(): je Übung drei Aufgaben, „Gemischt" hängt sie aneinander. */
  k.uebungenAufbauen = () => Object.fromEntries(k.UEBUNGEN.map(m => [m.id, [1, 2, 3].map(i => ({ modus: m, i }))]));
  k.uebungGemischteListe = nachModus => Object.values(nachModus).flat();
  for (const f of ['uebungAnsicht', 'renderUebungsLeiste', 'renderSentence', 'toast', 'renderUebung']) k[f] = () => {};
  vm.createContext(k);
  vm.runInContext('const UEB_ZEIT_SCHAETZUNG = ' + mSchaetzung[1] + ';\n' + quelltext, k);
  k.lauf = (ausdruck) => vm.runInContext(ausdruck, k);
  k.antworte = (n) => { for (let i = 0; i < n; i++) k.lauf('(() => { const t = satzTag(); t.gesamt++; satzTagSpeichern(t); satzTeilHeute(true); })()'); };
  return k;
}

console.log('pruefe-satz-teile.mjs — Satzmodus in drei Teilen (' + UEBUNGEN.length + ' Übungen)\n');

/* 1 + 2: Aufteilung */
const c = kontext(code, UEBUNGEN);
const t = c.lauf('satzTeile()');
/* ⭐ Seit 09.11.2026 DREI Teile. Elias: „ich fände es gut, wenn wir den satzmodus den ich fast
   täglich mache in 3 teilen. weil so wie es jetzt ist hab ich das gefühl es ist mir etwas zu
   viel pro tag deswegen". Die Zahl kommt aus satzTeile().anzahl und muss 3 sein. */
const KS = Array.from({ length: t.anzahl || 0 }, (_, i) => i + 1);
const nurTeile = tt => Object.fromEntries(KS.map(k => [k, tt[k]]));
const spanne = tt => Math.max(...KS.map(k => tt.summe[k])) - Math.min(...KS.map(k => tt.summe[k]));
pruefe('drei Teile (sein Satz vom 09.11.2026)', t.anzahl === 3, t.anzahl);
const alle = KS.flatMap(k => t[k]);
pruefe('jede Übung in genau einem Teil' + (RUHEND.length ? ` — die ruhende (Übung ${RUHEND.map(u => u.nr).join(', ')}) in keinem` : ''),
  alle.length === AKTIV.length && new Set(alle).size === AKTIV.length
  && AKTIV.every(u => alle.includes(u.id)) && RUHEND.every(u => !alle.includes(u.id)), JSON.stringify(nurTeile(t)));
const groesste = Math.max(...Object.values(t.zeit));
pruefe(`gleich lang: ${KS.map(k => `Teil ${k} ${Math.round(t.summe[k])} s`).join(', ')} je Runde (Unterschied höchstens eine Übung, ${Math.round(groesste)} s)`,
  spanne(t) <= groesste, spanne(t));
for (const k of KS) console.log(`     Teil ${k} (${t[k].length}): ${t[k].join(', ')}`);
const neu = kontext(code, UEBUNGEN.concat([{ id: 'neue-uebung', nr: 99, art: 'wahl' }]));
const tn = neu.lauf('satzTeile()');
pruefe('eine neue Übung kommt in einen Teil, und die Teile bleiben gleich lang',
  KS.some(k => tn[k].includes('neue-uebung')) && spanne(tn) <= Math.max(...Object.values(tn.zeit)),
  JSON.stringify(tn.summe));
const N = Object.fromEntries(KS.map(k => [k, t[k].length]));
function teilVon(tt, id){ for (let k = 1; k <= (tt.anzahl || 0); k++) if ((tt[k] || []).includes(id)) return k; return 0; }

/* 3: die Fälle a–f, jeder mit Störtest. Jede Funktion baut ihre eigene Welt
   aus dem übergebenen Quelltext und sagt { ok, ist }. */
function fallA(q){
  const w = kontext(q, UEBUNGEN);
  w.SETTINGS = { satzZiel: 15 };                         /* seine alte Zahl darf nichts mehr ändern */
  const z1 = w.lauf('satzTageszielHeute()'), a1 = w.lauf('satzTeilHeute(false)');
  w.SETTINGS = { satzZiel: 15, satzTeil: { teil: 2, erledigt: null } };
  const z2 = w.lauf('satzTageszielHeute()'), a2 = w.lauf('satzTeilHeute(false)');
  return { ok: a1 === 1 && z1 === N[1] && a2 === 2 && z2 === N[2], ist: `Teil ${a1}: ${z1}, Teil ${a2}: ${z2} (soll ${N[1]} / ${N[2]})` };
}
function fallB(q){
  const w = kontext(q, UEBUNGEN);
  w.antworte(N[1]);                                       /* Teil 1 geschafft */
  const s = w.lauf('satzTeilStand()');
  const auswahl = Object.keys(w.lauf('satzTeilAuswahl(uebungenAufbauen())'));
  /* Teil 2 plus Übung 21 (Geschichte, `ausserhalbTeile`): sie steht in JEDEM Teil von
     „Gemischt" (Elias, 09.11.2026: „in gemischt rein"), aber in keinem Teil selbst. */
  const draussen = UEBUNGEN.filter(u => u.ausserhalbTeile).map(u => u.id);
  const nurTeil2 = auswahl.length === N[2] + draussen.length && auswahl.every(id => t[2].includes(id) || draussen.includes(id))
    && draussen.every(id => auswahl.includes(id));
  /* eine laufende „Gemischt"-Liste, gebaut für Teil 1, eben die letzte Aufgabe beantwortet */
  w.lauf(`UEB = { modus: 'gemischt', teil: 1, idx: ${N[1] - 1}, liste: satzTeile()[1].map(id => ({ modus: { id } })).concat(satzTeile()[1].map(id => ({ modus: { id } }))) }`);
  w.lauf('uebungWeiter()');
  const naechste = w.lauf('UEB.liste[UEB.idx]'), teilDanach = w.lauf('UEB.teil'), idx = w.lauf('UEB.idx');
  const umgebaut = !!naechste && t[2].includes(naechste.modus.id) && teilDanach === 2 && idx === N[1];
  w.antworte(N[2]);                                       /* auch Teil 2 geschafft → Teil 3 */
  const s2 = w.lauf('satzTeilStand()');
  w.antworte(N[3]);                                       /* alle drei geschafft → reihum wieder Teil 1 */
  const s3 = w.lauf('satzTeilStand()');
  return { ok: s.geschafft && s.jetzt === 2 && s.stand === 0 && s.groesse === N[2] && nurTeil2 && umgebaut && s2.jetzt === 3 && s2.fertig === 2 && s3.jetzt === 1 && s3.fertig === 3,
    ist: JSON.stringify({ jetzt: s.jetzt, geschafft: s.geschafft, auswahl: auswahl.length, nurTeil2, naechste: naechste && naechste.modus.id, teilDanach, idx, danach: [s2.jetzt, s2.fertig, s3.jetzt, s3.fertig] }) };
}
function fallC(q){
  const w = kontext(q, UEBUNGEN), folge = [];
  w.heute = '2026-09-26'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[1] + N[2]);   /* beide Teile */
  w.heute = '2026-09-27'; folge.push(w.lauf('satzTeilHeute(false)'));                            /* Hören-Tag */
  w.heute = '2026-09-28'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[2]);
  w.heute = '2026-09-30'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[3]);
  w.heute = '2026-10-02'; folge.push(w.lauf('satzTeilHeute(false)'));
  return { ok: JSON.stringify(folge) === '[1,2,2,3,1]', ist: JSON.stringify(folge) + ' (soll [1,2,2,3,1])' };
}
function fallD(q){
  const w = kontext(q, UEBUNGEN), folge = [];
  w.heute = '2026-09-26'; w.antworte(3);                                                         /* angefangen, nicht geschafft */
  for (const tag of ['2026-09-27', '2026-09-28', '2026-09-29']){ w.heute = tag; folge.push(w.lauf('satzTeilHeute(false)')); }
  w.heute = '2026-09-30'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[1]);
  w.heute = '2026-10-01'; folge.push(w.lauf('satzTeilHeute(false)'));
  return { ok: JSON.stringify(folge) === '[1,1,1,1,2]' && w.SETTINGS.satzTeil.erledigt === '2026-09-30',
    ist: JSON.stringify(folge) + ' ' + JSON.stringify(w.SETTINGS.satzTeil) + ' (soll [1,1,1,1,2], erledigt 2026-09-30)' };
}
function fallE(q){
  const r = [];
  const fall = (st, satzTag, tag) => { const w = kontext(q, UEBUNGEN); w.SETTINGS = { satzTeil: st }; if (satzTag) w.speicher.vt_satzTag = satzTag; w.heute = tag; return w; };
  r.push(fall({ teil: 1, tag: '2026-09-25' }, { tag: '2026-09-25', gesamt: N[1] + 1, richtig: 0 }, '2026-09-26').lauf('satzTeilHeute(false)'));  /* geschafft → 2 */
  r.push(fall({ teil: 1, tag: '2026-09-25' }, { tag: '2026-09-25', gesamt: 3, richtig: 0 }, '2026-09-26').lauf('satzTeilHeute(false)'));         /* halb → wartet: 1 */
  r.push(fall({ teil: 2, tag: '2026-09-25' }, null, '2026-09-26').lauf('satzTeilHeute(false)'));                                                   /* unbekannt → alte Regel: der nächste, 3 */
  r.push(fall({ teil: 2, tag: '2026-09-26' }, null, '2026-09-26').lauf('satzTeilHeute(false)'));                                                   /* heute angefangen: 2 */
  const w = fall({ teil: 1, tag: '2026-09-25' }, null, '2026-09-26'); w.antworte(1);
  const neuFormat = JSON.stringify(w.SETTINGS.satzTeil);
  return { ok: JSON.stringify(r) === '[2,1,3,2]' && neuFormat === '{"teil":2,"erledigt":null}',
    ist: JSON.stringify(r) + ' ' + neuFormat + ' (soll [2,1,3,2] und {"teil":2,"erledigt":null})' };
}
function fallF(q){
  const w = kontext(q, UEBUNGEN);
  w.SETTINGS = { satzTeil: { teil: 2, erledigt: null } };
  w.heute = '2026-09-26'; w.antworte(N[2] - 1);                                                  /* eine fehlt */
  const s1 = w.lauf('satzTeilStand()');
  w.heute = '2026-09-28';
  const s2 = w.lauf('satzTeilStand()');
  return { ok: !s1.geschafft && w.SETTINGS.satzTeil.erledigt === null && s2.anfang === 2 && s2.gesamt === 0 && s2.ziel === N[2],
    ist: JSON.stringify({ geschafft: s1.geschafft, gespeichert: w.SETTINGS.satzTeil, danach: [s2.anfang, s2.gesamt, s2.ziel] }) };
}
const ersetze = (q, alt, neu) => q.includes(alt) ? q.replace(alt, neu) : q;
const FAELLE = [
  ['(a) Tagesziel = die Übungen des Anfangsteils, seine alte Zahl 15 ändert nichts', fallA,
    'das Ziel wieder anteilig aus seiner Einstellung', q => ersetze(q, 'function satzTageszielHeute(){ return satzTeilStand().ziel; }',
      'function satzTageszielHeute(){ return Math.max(1, Math.round(Number(SETTINGS.satzZiel || 16) * satzTeile()[satzTeilStand().anfang].length / UEBUNGEN.length)); }')],
  ['(b) nach „geschafft" zieht Gemischt den anderen Teil — auch die laufende Liste, danach reihum', fallB,
    'uebungWeiter() baut die Liste nicht um', q => ersetze(q, 'if (jetzt !== UEB.teil){', 'if (false){')],
  ['(c) der nächste Satz-Tag geht andersherum, auch nach Weitermachen', fallC,
    'kein Wechsel am nächsten Tag', q => ersetze(q, 'if (erledigt && erledigt < heute){ teil = teil % anzahl + 1; erledigt = null; }', 'if (erledigt && erledigt < heute){ erledigt = null; }')],
  ['(d) ein nicht geschaffter Teil wartet, über mehrere Tage', fallD,
    'jeder Tag mit Sätzen gilt als erledigt', q => ersetze(q, 'const erledigt = s.geschafft ? (s.erledigt || todayStr(0)) : null;', 'const erledigt = todayStr(0);')],
  ['(e) das alte Format { teil, tag } wird übernommen', fallE,
    'der alte Tageszähler wird nicht angesehen', q => ersetze(q, 'Number(roh.gesamt) >= satzTeile()[teil].length', 'true')],
  ['(f) halb geschafft zählt nicht', fallF,
    'schon eine Antwort gilt als geschafft', q => ersetze(q, 'const geschafft = gesamt >= n[a] ||', 'const geschafft = gesamt >= 1 ||')]
];
for (const [name, fall, stoerName, stoer] of FAELLE){
  const r = fall(code);
  pruefe(name, r.ok, r.ist);
  const kaputt = stoer(code);
  const rs = kaputt === code ? { ok: true, ist: 'Ersetzung griff nicht — Quelltext geändert?' } : fall(kaputt);
  pruefe('   STÖRTEST — ' + stoerName + ' → rot', kaputt !== code && !rs.ok, rs.ist);
}

/* 4: Messung schlägt Schätzung */
const m = kontext(code, UEBUNGEN);
m.QUOTE_TAGE = { '2026-09-20': { zn_uebersetzen: 12, zs_uebersetzen: 240 } };
const tm = m.lauf('satzTeile()');
pruefe('gemessen 12 Antworten à 20 s ersetzen die Schätzung', tm.zeit.uebersetzen === 20 && tm.quelle.uebersetzen === 'gemessen', JSON.stringify([tm.zeit.uebersetzen, tm.quelle.uebersetzen]));
m.QUOTE_TAGE = { '2026-09-20': { zn_uebersetzen: 5, zs_uebersetzen: 100 } };
pruefe('unter 10 Antworten gilt die Schätzung', m.lauf('satzTeile()').quelle.uebersetzen === 'geschaetzt', '');

/* 5: die Aufrufer */
const uebCode = nurCode(ueb);
pruefe('„Gemischt" zieht den Teil, der dran ist', /uebungGemischteListe\(satzTeilAuswahl\(alle\)\)/.test(uebCode)
  && /satzTeile\(\)\[satzTeilStand\(\)\.jetzt\]/.test(schneide(uebCode, 'satzTeilAuswahl') || ''), '');
pruefe('der Ring im Satzmodus nimmt das Ziel des Teils', /modusRingZeichnen\('satzRing',\s*st\.gesamt,\s*satzTageszielHeute\(\)\)/.test(uebCode), '');
const antwort = schneide(uebCode, 'uebungAuswerten') || '';
const iZaehler = antwort.indexOf('satzTagSpeichern(satzT);'), iTeil = antwort.indexOf('satzTeilHeute(true)'), iFeier = antwort.indexOf("feiere('satz-tagesziel'");
pruefe('answer(): Teil merken NACH dem Zähler und VOR der Feier', iZaehler >= 0 && iTeil > iZaehler && iFeier > iTeil
  && antwort.split('satzTeilHeute(true)').length === 2, [iZaehler, iTeil, iFeier].join(' < '));
pruefe('die Startseite zeigt „Satz 1/2" mit dem Ziel des Teils', /'Satz ' \+ satzTeilHeute\(false\)/.test(start) && /zZiel = satzTageszielHeute\(\)/.test(nurCode(start)), '');
pruefe('die Tagesziel-Feier und „Tag komplett" nehmen das Ziel des Teils', /satzTageszielHeute\(\)/.test(nurCode(feier)) && !/satzTagesziel\(\)/.test(nurCode(feier)), '');
const alleJs = fs.readdirSync(path.join(REPO, 'js')).filter(f => f.endsWith('.js')).map(f => [f, nurCode(lies('js/' + f))]);
const liestZiel = alleJs.filter(([, q]) => /\bsatzZiel\b|\bsatzTagesziel\s*\(|SATZ_ZIEL_VORGABE/.test(q)).map(([f]) => f);
pruefe('niemand liest mehr SETTINGS.satzZiel / satzTagesziel()', !liestZiel.length, liestZiel.join(', '));
pruefe('die Einstellung ist eine Anzeige, kein Schalter', !/id="satzZielSelect"|id="satzZielEigen"/.test(html) && /id="satzZielAnzeige"/.test(html)
  && !/id:'satz'/.test(nurCode(einst)) && /function zeigeSatzZielAutomatisch/.test(einst) && /zeigeSatzZielAutomatisch\(\)/.test(schneide(einst, 'renderSettings') || ''), '');

/* Störtest der Aufteilung (seit v606) */
const ohneAusgleich = code.replace('.sort((a, b) => (summe[a] - summe[b]) || (teil[a].length - teil[b].length) || (a - b))[0];', '[0];');
const s1 = kontext(ohneAusgleich, UEBUNGEN).lauf('satzTeile()');
pruefe('STÖRTEST — ohne Ausgleich wären die Teile ungleich', ohneAusgleich !== code && spanne(s1) > Math.max(...Object.values(s1.zeit)), JSON.stringify(s1.summe));

/* 6: verwandte Übungen nie im selben Teil (27.09.2026). Elias: „am besten wenn
   beide übungen nicht am sleben tag statt finden. generell sollte ein tag
   nicht mit einer übung überfüllt sein sondern gut durchmischt" — vorher
   lagen Übung 10 und 12 durch die Schätzung immer zusammen in Teil 1. */
const PAARE = [['genus', 'fem-form'], ['kasus', 'haraka'], ['jarr-paar', 'alle-majrur'], ['isara', 'pronomen']];
const getrennt = tt => PAARE.every(([a, b]) => { const ta = teilVon(tt, a), tb = teilVon(tt, b); return ta && tb && ta !== tb; });
pruefe('verwandte Übungen in verschiedenen Teilen — mit der Schätzung', getrennt(t), JSON.stringify(nurTeile(t)));
const gm = kontext(code, UEBUNGEN);
gm.QUOTE_TAGE = { '2026-09-20': { zn_genus: 12, zs_genus: 480, 'zn_fem-form': 12, 'zs_fem-form': 480 } };
const tg = gm.lauf('satzTeile()');
pruefe('… und wenn die zwei gemessen gleich lang sind (je 40 s)', getrennt(tg)
  && spanne(tg) <= Math.max(...Object.values(tg.zeit)), JSON.stringify({ ...nurTeile(tg), summe: tg.summe }));
const ohnePaare = code.replace('const frei = nummern.filter(k => !pa.some(x => teil[k].includes(x)));', 'const frei = nummern;');
pruefe('STÖRTEST — ohne die Paare stünden 10 und 12 wieder zusammen', ohnePaare !== code && !getrennt(kontext(ohnePaare, UEBUNGEN).lauf('satzTeile()')), '');

/* 7: kein Satz zweimal in einem Durchgang von „Gemischt" (27.09.2026) —
   „… und sogar mit dem selben satz". Die echten uebungGemischteListe() und
   uebungZiehen(), Mischen abgeschaltet, damit die Reihenfolge feststeht. */
const zieh = [schneide(ueb, 'uebungGemischteListe'), schneide(ueb, 'uebungZiehen')];
if (zieh.some(x => !x)){ pruefe('uebungGemischteListe/uebungZiehen im Quelltext', false, 'nicht gefunden'); }
else {
  const gemischt = (quelle, koerbe) => {
    const A = { id: 'a' }, B = { id: 'b' };
    const k = { UEBUNGEN: [A, B], shuffle: x => x, uebungMischen: (m, l) => l.slice(), Set };
    vm.createContext(k);
    vm.runInContext(quelle, k);
    const nach = { a: koerbe.a.map(s => ({ modus: A, satz: { sentAr: s } })), b: koerbe.b.map(s => ({ modus: B, satz: { sentAr: s } })) };
    return vm.runInContext('uebungGemischteListe', k)(nach).map(x => x.satz.sentAr);
  };
  const echt = zieh.join('\n');
  const r1 = gemischt(echt, { a: ['s1', 's2'], b: ['s3', 's2'] });
  pruefe('ein Durchgang nimmt keinen Satz doppelt, wenn es einen anderen gibt', r1.length === 4 && r1[0] !== r1[1] && r1[2] !== r1[3], r1.join(' '));
  const r2 = gemischt(echt, { a: ['s1'], b: ['s1'] });
  pruefe('gibt es keinen anderen, fehlt trotzdem keine Übung', r2.length === 2, r2.join(' '));
  const ohneZiehen = echt.replace('raus.push(uebungZiehen(koerbe[i], imDurchgang));', 'raus.push(koerbe[i].pop());');
  const r3 = gemischt(ohneZiehen, { a: ['s1', 's2'], b: ['s3', 's2'] });
  pruefe('STÖRTEST — ohne uebungZiehen käme derselbe Satz zweimal', ohneZiehen !== echt && r3[0] === r3[1], r3.join(' '));

  /* 7b: Übung 21 (Geschichte, `reihenfolge`) in „Gemischt" (Elias, 09.11.2026: „in gemischt
     rein"): ihre Lücken kommen der Reihe nach, das Mischen (hier: umdrehen) greift nicht. */
  const geschichte = quelle => {
    const G = { id: 'g', reihenfolge: true };
    const k = { UEBUNGEN: [G], shuffle: x => x, uebungMischen: (m, l) => [l[1], l[2], l[0]], Set };
    vm.createContext(k);
    vm.runInContext(quelle, k);
    return vm.runInContext('uebungGemischteListe', k)({ g: ['l1', 'l2', 'l3'].map(s => ({ modus: G, satz: { sentAr: s } })) }).map(x => x.satz.sentAr).join(' ');
  };
  const r4 = geschichte(echt);
  pruefe('die Lücken einer Geschichte kommen in „Gemischt" der Reihe nach', r4 === 'l1 l2 l3', r4);
  const ohneReihe = echt.replace('m.reihenfolge ?', 'false ?');
  const r5 = geschichte(ohneReihe);
  pruefe('STÖRTEST — ohne die Ausnahme für `reihenfolge` würde gemischt', ohneReihe !== echt && r5 !== 'l1 l2 l3', r5);
  const sta = schneide(ueb, 'satzTeilAuswahl') || '';
  pruefe('„Gemischt" nimmt die Übungen mit `ausserhalbTeile` in jedem Teil mit', /UEBUNGEN\.filter\(m => m\.ausserhalbTeile\)/.test(sta), '');
}

/* 8: eine RUHENDE Übung (`ruht:true`, 19.10.2026). Elias, mit Bild von Übung 1: „die
   satzübung können wir erstmal einstellen weil wir sie meine ich noch nicht offiziell
   besprochen haben und sie für mich noch keinen sinn macht. guck ob sich bei teil 1 und 2 die
   sortierung ändert dadurch das eines weniger ist." Gemessen an seinem Stand (KV 19.10.2026,
   05:05): fiele Übung 1 schon vor dem Verteilen weg, wechselten fünf andere den Teil. Bis zum
   15.11.2026 wurde sie deshalb mitverteilt und erst danach herausgenommen (MEINE Entscheidung).
   ⛔ Seit 15.11.2026 fällt sie VOR dem Verteilen weg: mitverteilt fehlten dem Teil, der sie
   hielt, mit seinen echten Zeiten 31 s (21 % auseinander) — seine Vorgabe „gleich
   zeitaufwändig" geht vor (Abschnitt 9). Geprüft an JEDER Übung: ruht sie allein, steht sie in
   keinem Teil, und die anderen sind so verteilt, als gäbe es sie nicht.
   Dazu die Auswahl-Liste und die Übungsstatistik, beide an den echten Funktionen. */
console.log('\n8. Eine ruhende Übung steht in keinem Teil, die anderen sind verteilt, als gäbe es sie nicht');
const ohneRuhe = liste => liste.map(u => { const v = { ...u }; delete v.ruht; return v; });
const wanderer = (quelltext, liste) => {
  const ohneSie = kontext(quelltext, liste.filter(u => !u.ruht)).lauf('satzTeile()');
  const mit = kontext(quelltext, liste).lauf('satzTeile()');
  return { anders: liste.filter(u => !u.ruht && teilVon(mit, u.id) !== teilVon(ohneSie, u.id)).map(u => u.nr + ' ' + u.id),
           ruhtDrin: liste.filter(u => u.ruht && teilVon(mit, u.id) !== 0).map(u => u.nr + ' ' + u.id) };
};
const alleinRuht = id => ohneRuhe(UEBUNGEN).map(u => (u.id === id ? { ...u, ruht: true } : u));
{
  const echt = wanderer(code, UEBUNGEN);
  pruefe(`seine ruhende Übung (${RUHEND.map(u => u.nr + ' ' + u.id).join(', ') || 'keine'}) steht in keinem Teil, die anderen wie ohne sie`,
    !echt.anders.length && !echt.ruhtDrin.length, JSON.stringify(echt));
  const jede = UEBUNGEN.map(u => [u, wanderer(code, alleinRuht(u.id))]).filter(([, r]) => r.anders.length || r.ruhtDrin.length);
  pruefe(`… und bei JEDER Übung, die allein ruht (${UEBUNGEN.length} Läufe)`, !jede.length,
    jede.map(([u, r]) => u.nr + ': ' + JSON.stringify(r)).join(' · '));
  const probe = alleinRuht(UEBUNGEN[0].id);
  const filterLinie = 'const UEBUNGEN_T = UEBUNGEN.filter(m => !m.ausserhalbTeile && !m.ruht);';
  const kaputt1 = code.split(filterLinie).length === 2 ? code.replace(filterLinie, 'const UEBUNGEN_T = UEBUNGEN.filter(m => !m.ausserhalbTeile);') : code;
  const r1 = kaputt1 === code ? null : wanderer(kaputt1, probe);
  pruefe('STÖRTEST — wird die ruhende mitverteilt, steht sie in einem Teil → rot',
    !!r1 && r1.ruhtDrin.length > 0, r1 ? JSON.stringify(r1) : 'Ersetzung griff nicht — Quelltext geändert?');

  /* Die Auswahl-Liste: die echte renderUebungsLeiste() mit einem Blatt, in das sie schreibt. */
  const gruppen = (ueb.match(/const UEB_GRUPPEN = \[[\s\S]*?\n\];/) || [''])[0];
  const leiste = schneide(ueb, 'renderUebungsLeiste'), aktivF = schneide(ueb, 'uebungAktiv');
  const zeichne = (quelle, liste) => {
    const el = { uebBlatt: { innerHTML: '' }, uebWert: { textContent: '' }, uebZahl: { textContent: '' } };
    const tt = kontext(code, liste).lauf('satzTeile()');
    const k = { UEBUNGEN: liste, document: { getElementById: id => el[id] || null }, UEB: { modus: null }, UEB_GEMISCHT: 'gemischt',
                uebungenAufbauen: () => Object.fromEntries(liste.map(m => [m.id, [1, 2, 3]])), uebungAnzahl: l => (l || []).length,
                escapeHtml: s => String(s), arabischHervor: s => String(s), satzTeilStand: () => ({ jetzt: 1 }), satzTeile: () => tt, Set, String, Object };
    vm.createContext(k);
    vm.runInContext(gruppen + '\n' + aktivF + '\n' + quelle + '\nrenderUebungsLeiste();', k);
    const html = el.uebBlatt.innerHTML;
    return { fehlt: liste.filter(m => !m.ruht && !html.includes(`data-uebmodus="${m.id}"`)).map(m => m.nr),
             zuviel: liste.filter(m => m.ruht && html.includes(`data-uebmodus="${m.id}"`)).map(m => m.nr),
             modi: el.uebZahl.textContent };
  };
  if (!gruppen || !leiste || !aktivF) pruefe('renderUebungsLeiste/uebungAktiv/UEB_GRUPPEN im Quelltext', false, 'nicht gefunden');
  else {
    const z = zeichne(leiste, probe);
    pruefe(`die Auswahl-Liste zeigt jede andere Übung, die ruhende nicht, und zählt ${UEBUNGEN.length - 1} Modi`,
      !z.fehlt.length && !z.zuviel.length && z.modi === (UEBUNGEN.length - 1) + ' Modi', JSON.stringify(z));
    const filterAlt = 'UEBUNGEN.filter(m=>m.art===art && uebungAktiv(m))';
    const kaputt3 = leiste.split(filterAlt).length === 2 ? leiste.replace(filterAlt, 'UEBUNGEN.filter(m=>m.art===art)') : leiste;
    const z3 = kaputt3 === leiste ? null : zeichne(kaputt3, probe);
    pruefe('STÖRTEST — ohne den Filter stünde die ruhende in der Liste → rot', !!z3 && z3.zuviel.length > 0,
      z3 ? JSON.stringify(z3) : 'Ersetzung griff nicht — Quelltext geändert?');
  }

  /* Die Übungsstatistik: die echte renderUebungStand() aus js/statistik.js. */
  const stat = schneide(lies('js/statistik.js'), 'renderUebungStand');
  const zaehle = (quelle, liste) => {
    const kasten = { innerHTML: '' };
    const k = { UEBUNGEN: liste, UEBUNG_STAND: Object.fromEntries(liste.map(m => [m.id, { gestellt: 4, richtig: 2, zuletzt: '2026-10-18' }])),
                document: { getElementById: id => (id === 'uebungStand' ? kasten : null) }, tageHer: () => 'gestern',
                arabischHervor: s => String(s), escapeHtml: s => String(s), Array };
    vm.createContext(k);
    vm.runInContext(aktivF + '\n' + quelle + '\nrenderUebungStand();', k);
    return (kasten.innerHTML.match(/<div class="rz/g) || []).length;
  };
  if (!stat) pruefe('renderUebungStand in js/statistik.js', false, 'nicht gefunden');
  else {
    const n = zaehle(stat, probe);
    pruefe(`die Übungsstatistik zeigt ${UEBUNGEN.length - 1} Zeilen, die ruhende nicht`, n === UEBUNGEN.length - 1, n);
    const statFilter = "UEBUNGEN.filter(m => (typeof uebungAktiv === 'function') ? uebungAktiv(m) : !m.ruht)";
    const kaputt4 = stat.split(statFilter).length === 2 ? stat.replace(statFilter, 'UEBUNGEN') : stat;
    const n4 = kaputt4 === stat ? null : zaehle(kaputt4, probe);
    pruefe('STÖRTEST — ohne den Filter stünde sie in der Statistik → rot', n4 !== null && n4 === UEBUNGEN.length,
      n4 === null ? 'Ersetzung griff nicht — Quelltext geändert?' : n4);
  }
}

/* 9: GLEICH ZEITAUFWÄNDIG MIT SEINEN ECHTEN ZEITEN (15.11.2026). Elias, Google Tasks: „dass die
   3 Teile des satzmoduses im russisch und arabisch besser verteilt sein soll damit alle
   ungefähr gleich zeitaufwändig sind". Die Schätzung nach der Art ergab mit seinen Zeiten etwa
   130 / 200 / 290 s. Gefordert: die Teile liegen höchstens 15 % auseinander (größter gegen
   kleinsten), gerechnet mit ZEIT_ELIAS aus satzTeile() — dieser Prüfer kennt keine Messungen,
   also entscheidet genau diese Schätzung, wie in der App bei unter 10 Antworten. */
console.log('\n9. Mit seinen echten Zeiten liegen die drei Teile höchstens 15 % auseinander');
{
  const zeitElias = t.zeit;
  const echtSumme = tt => KS.map(k => (tt[k] || []).reduce((s, id) => s + (zeitElias[id] || 0), 0));
  const abstand = tt => { const v = echtSumme(tt); return (Math.max(...v) - Math.min(...v)) / Math.min(...v); };
  const hatEintrag = /const ZEIT_ELIAS = \{/.test(code);
  pruefe('satzTeile() hat ZEIT_ELIAS, und jede verteilte Übung hat darin einen Eintrag',
    hatEintrag && AKTIV.every(u => new RegExp("['\\s{]" + u.id.replace(/-/g, '\\-') + "'?:\\s*\\d").test(code)), '');
  pruefe(`höchstens 15 %: ${echtSumme(t).map((s, i) => `Teil ${i + 1} ${Math.round(s)} s`).join(', ')} (${Math.round(abstand(t) * 100)} %)`,
    abstand(t) <= 0.15, abstand(t));
  /* Ohne ZEIT_ELIAS (nur die Ruhe-Regel neu) lagen sie am 15.11.2026 zufällig bei 10 % — eine
     Schätzung, die für Welche Regel? 12 s statt 58 s annimmt, ist trotzdem keine Grundlage.
     Gemessen wird deshalb, dass satzTeile() die Tabelle LIEST, und dass der alte Stand rot ist. */
  const nurArt = code.replace(/const ZEIT_ELIAS = \{[\s\S]*?\n  \};/, 'const ZEIT_ELIAS = {};');
  const ta = nurArt === code ? null : kontext(nurArt, UEBUNGEN).lauf('satzTeile()');
  const abweichend = ta ? AKTIV.filter(u => ta.zeit[u.id] !== zeitElias[u.id]).length : 0;
  pruefe('STÖRTEST — leeres ZEIT_ELIAS: die Zeiten sind nicht mehr seine → rot', !!ta && abweichend > 0,
    ta ? abweichend + ' Übungen mit anderer Zeit, Abstand dann ' + Math.round(abstand(ta) * 100) + ' %' : 'Ersetzung griff nicht — Quelltext geändert?');
  const filterLinie = 'const UEBUNGEN_T = UEBUNGEN.filter(m => !m.ausserhalbTeile && !m.ruht);';
  const ruhLinie = 'const ruht = UEBUNGEN.filter(m => m.ruht).map(m => m.id);';
  const mitverteilt = code.split(filterLinie).length === 2 && code.split(ruhLinie).length === 2
    ? code.replace(filterLinie, 'const UEBUNGEN_T = UEBUNGEN.filter(m => !m.ausserhalbTeile);')
          .replace(ruhLinie, ruhLinie + '\n  for (const k of nummern) teil[k] = teil[k].filter(id => !ruht.includes(id));') : code;
  const tm = (mitverteilt === code || !RUHEND.length) ? null : kontext(mitverteilt, UEBUNGEN).lauf('satzTeile()');
  /* ⚠️ Seit 15.11.2026 (Übung 19 kam dazu) „schlechter als jetzt" statt „über 15 %": mit der neuen
     Übung lag der alte Weg zufällig bei 14 % (der jetzige bei 6 %) — die feste Grenze hätte einen
     Störtest rot gemeldet, der seinen Zweck erfüllt. Gemessen wird, dass der alte Weg die Teile
     weiter auseinanderlegt als der jetzige. */
  pruefe('STÖRTEST — die ruhende mitverteilt und erst danach herausgenommen (bis 15.11.2026) → weiter auseinander als jetzt', !RUHEND.length || (!!tm && abstand(tm) > abstand(t)),
    tm ? Math.round(abstand(tm) * 100) + ' % gegen jetzt ' + Math.round(abstand(t) * 100) + ' %' : (RUHEND.length ? 'Ersetzung griff nicht — Quelltext geändert?' : 'keine ruhende Übung'));
  const alt = mitverteilt === code ? code : mitverteilt.replace(/const ZEIT_ELIAS = \{[\s\S]*?\n  \};/, 'const ZEIT_ELIAS = {};');
  const tAlt = (alt === code || alt === mitverteilt) ? null : kontext(alt, UEBUNGEN).lauf('satzTeile()');
  pruefe('STÖRTEST — der alte Stand (Schätzung nach der Art, ruhende mitverteilt) → rot', !!tAlt && abstand(tAlt) > 0.15,
    tAlt ? KS.map(k => Math.round(echtSumme(tAlt)[k - 1]) + ' s').join(' / ') + ' = ' + Math.round(abstand(tAlt) * 100) + ' %' : 'Ersetzung griff nicht — Quelltext geändert?');
}

console.log('\n' + (fehler ? `X  ${fehler} Befund(e)` : '✅ Satzmodus in drei Teilen: alles richtig'));
process.exit(fehler ? 1 : 0);
