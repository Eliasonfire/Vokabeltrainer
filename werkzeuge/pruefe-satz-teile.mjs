#!/usr/bin/env node
/* pruefe-satz-teile.mjs — der Satzmodus in zwei Teilen (v606, 25.09.2026)
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
 *      nehmen den Teil — und niemand liest mehr SETTINGS.satzZiel.
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
const UEBUNGEN = [...ueb.matchAll(/^ {4}id:'([a-z0-9-]+)', nr:(\d+), name:'[^']*', art:'([a-z]+)'/gm)]
  .map(m => ({ id: m[1], nr: Number(m[2]), art: m[3] }));
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

console.log('pruefe-satz-teile.mjs — Satzmodus in zwei Teilen (' + UEBUNGEN.length + ' Übungen)\n');

/* 1 + 2: Aufteilung */
const c = kontext(code, UEBUNGEN);
const t = c.lauf('satzTeile()');
const alle = t[1].concat(t[2]);
pruefe('jede Übung in genau einem Teil', alle.length === UEBUNGEN.length && new Set(alle).size === UEBUNGEN.length
  && UEBUNGEN.every(u => alle.includes(u.id)), JSON.stringify({ 1: t[1], 2: t[2] }));
const groesste = Math.max(...Object.values(t.zeit));
pruefe(`gleich lang: Teil 1 ${Math.round(t.summe[1])} s, Teil 2 ${Math.round(t.summe[2])} s je Runde (Unterschied höchstens eine Übung, ${Math.round(groesste)} s)`,
  Math.abs(t.summe[1] - t.summe[2]) <= groesste, Math.abs(t.summe[1] - t.summe[2]));
console.log('     Teil 1 (' + t[1].length + '): ' + t[1].join(', '));
console.log('     Teil 2 (' + t[2].length + '): ' + t[2].join(', '));
const neu = kontext(code, UEBUNGEN.concat([{ id: 'neue-uebung', nr: 99, art: 'wahl' }]));
const tn = neu.lauf('satzTeile()');
pruefe('eine neue Übung kommt in einen Teil, und die Teile bleiben gleich lang',
  tn[1].concat(tn[2]).includes('neue-uebung') && Math.abs(tn.summe[1] - tn.summe[2]) <= Math.max(...Object.values(tn.zeit)),
  JSON.stringify(tn.summe));
const N = { 1: t[1].length, 2: t[2].length };

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
  const nurTeil2 = auswahl.length === N[2] && auswahl.every(id => t[2].includes(id));
  /* eine laufende „Gemischt"-Liste, gebaut für Teil 1, eben die letzte Aufgabe beantwortet */
  w.lauf(`UEB = { modus: 'gemischt', teil: 1, idx: ${N[1] - 1}, liste: satzTeile()[1].map(id => ({ modus: { id } })).concat(satzTeile()[1].map(id => ({ modus: { id } }))) }`);
  w.lauf('uebungWeiter()');
  const naechste = w.lauf('UEB.liste[UEB.idx]'), teilDanach = w.lauf('UEB.teil'), idx = w.lauf('UEB.idx');
  const umgebaut = !!naechste && t[2].includes(naechste.modus.id) && teilDanach === 2 && idx === N[1];
  w.antworte(N[2]);                                       /* auch Teil 2 geschafft → reihum wieder Teil 1 */
  const s2 = w.lauf('satzTeilStand()');
  return { ok: s.geschafft && s.jetzt === 2 && s.stand === 0 && s.groesse === N[2] && nurTeil2 && umgebaut && s2.jetzt === 1 && s2.fertig === 2,
    ist: JSON.stringify({ jetzt: s.jetzt, geschafft: s.geschafft, auswahl: auswahl.length, nurTeil2, naechste: naechste && naechste.modus.id, teilDanach, idx, danach: [s2.jetzt, s2.fertig] }) };
}
function fallC(q){
  const w = kontext(q, UEBUNGEN), folge = [];
  w.heute = '2026-09-26'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[1] + N[2]);   /* beide Teile */
  w.heute = '2026-09-27'; folge.push(w.lauf('satzTeilHeute(false)'));                            /* Hören-Tag */
  w.heute = '2026-09-28'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[2]);
  w.heute = '2026-09-30'; folge.push(w.lauf('satzTeilHeute(false)')); w.antworte(N[1]);
  w.heute = '2026-10-02'; folge.push(w.lauf('satzTeilHeute(false)'));
  return { ok: JSON.stringify(folge) === '[1,2,2,1,2]', ist: JSON.stringify(folge) + ' (soll [1,2,2,1,2])' };
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
  r.push(fall({ teil: 2, tag: '2026-09-25' }, null, '2026-09-26').lauf('satzTeilHeute(false)'));                                                   /* unbekannt → alte Regel: 1 */
  r.push(fall({ teil: 2, tag: '2026-09-26' }, null, '2026-09-26').lauf('satzTeilHeute(false)'));                                                   /* heute angefangen: 2 */
  const w = fall({ teil: 1, tag: '2026-09-25' }, null, '2026-09-26'); w.antworte(1);
  const neuFormat = JSON.stringify(w.SETTINGS.satzTeil);
  return { ok: JSON.stringify(r) === '[2,1,1,2]' && neuFormat === '{"teil":2,"erledigt":null}',
    ist: JSON.stringify(r) + ' ' + neuFormat + ' (soll [2,1,1,2] und {"teil":2,"erledigt":null})' };
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
    'kein Wechsel am nächsten Tag', q => ersetze(q, 'if (erledigt && erledigt < heute){ teil = teil === 1 ? 2 : 1; erledigt = null; }', 'if (erledigt && erledigt < heute){ erledigt = null; }')],
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
const ohneAusgleich = code.replace('const t = summe[1] < summe[2] ? 1 : summe[2] < summe[1] ? 2 : (teil[1].length <= teil[2].length ? 1 : 2);', 'const t = 1;');
const s1 = kontext(ohneAusgleich, UEBUNGEN).lauf('satzTeile()');
pruefe('STÖRTEST — ohne Ausgleich wären die Teile ungleich', ohneAusgleich !== code && Math.abs(s1.summe[1] - s1.summe[2]) > Math.max(...Object.values(s1.zeit)), JSON.stringify(s1.summe));

console.log('\n' + (fehler ? `X  ${fehler} Befund(e)` : '✅ Satzmodus in zwei Teilen: alles richtig'));
process.exit(fehler ? 1 : 0);
