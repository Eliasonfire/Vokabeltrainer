#!/usr/bin/env node
/* eiche-koran-satz.mjs — eicht die vier Umformungen aus koran-satz-lib.mjs am VORHANDENEN Satzbestand.
 *
 * Die Beispielsätze der Gruppe „Koran häufigste" werden nicht getippt: jede Wortform kommt von einer Karte, aus
 * einem vorhandenen Satz — oder aus einer von vier Umformungen (koran-satz-aufloesen.mjs). Eine Umformung BILDET
 * eine Form. Das ist nur erlaubt, weil sie am Satzbestand nachgemessen ist: wo sein Buch dieselbe Form schreibt,
 * muss die gebildete Form zeichengleich sein.
 *   (1) bestimmt()  Kartenform (unbestimmt, Nominativ)  -> bestimmt, Nominativ
 *   (2) fall()      bestimmt, Nominativ                 -> Genitiv / Akkusativ (nur der letzte kurze Vokal)
 *   (3) mudaf()     Kartenform                          -> erstes Wort einer Genitivverbindung (Tanwin fällt)
 *   (4) mitBi()     bestimmt, Genitiv                   -> mit bi- davor
 *
 * Eine Abweichung ist nicht von selbst ein Fehler der Umformung: zwei verschiedene Wörter können dieselben
 * Buchstaben tragen. Deshalb gibt es eine Liste der ANGESEHENEN Abweichungen (unten, nur Kennungen von Karten und
 * Sätzen — kein Wort seiner Buchkarten steht in dieser Datei). Rot wird der Prüfer bei einer NEUEN Abweichung:
 * dann erst ansehen (der Bericht mit den Formen liegt lokal im Zwischenordner), dann entweder die Umformung
 * berichtigen oder die Kennung mit Grund eintragen.
 *
 * Herkunft: satz-eichen.mjs aus dem Zwischenordner (12.10.2026), dort ein Bericht zum Lesen; seit dem 13.10.2026
 * ein Prüfer im Sammellauf. Die Messung selbst ist unverändert.
 *
 *   node werkzeuge/eiche-koran-satz.mjs            Exit 0 = keine neue Abweichung, alle Störtests schlagen an
 *                                                  Exit 0 mit Hinweis, wenn die Buchabzüge fehlen (data/ ist lokal)
 *                                                  Exit 1 = neue Abweichung, oder der Prüfer misst nicht
 */
import fs from 'node:fs';
import path from 'node:path';
import * as LIB from './koran-satz-lib.mjs';
const { bestandLaden, saetzeLaden, stamm, nackt, nurAr, ALIF, LAM, DAMMA, KASRA, FATHA, SHADDA, DAMMATAN, Z, ARBEIT } = LIB;

/* ---------- die angesehenen Abweichungen (Kennungen, keine Wörter) ----------
   Angesehen am 12.10.2026 (Bericht satz-eichung.txt im Zwischenordner) und am 13.10.2026 wieder gemessen. In jedem
   Fall steht im Satzbestand ein ANDERES Wort mit denselben Buchstaben oder eine andere Schreibung desselben Wortes
   (Frau / Spiegel; das Verbindungs-Alif mit eigenem Zeichen) — keine falsch gebildete Form. */
const ANGESEHEN = new Set([
  'bestimmt:45858',   /* Karte „Bein / Fuß" (rijl): im Satzbestand steht mit denselben Buchstaben „der Mann" (ar-rajul)   */
  'mudaf:45764',      /* Karte „Mann" (rajul): im Satzbestand steht mit denselben Buchstaben „Bein von …" (rijlu)        */
  'bestimmt:46020',   /* Karte „Spiegel" (mirʾāh): im Satzbestand steht mit denselben Buchstaben „die Frau" (al-marʾa)   */
  'gen:mb1-75-8:3',   /* „die Frau" im Nominativ; der Genitiv-Beleg mit denselben Buchstaben ist „des Spiegels"          */
  'mudaf:46005',      /* Karte „Tochter" (ibna): der Satzbestand schreibt das Verbindungs-Alif mit eigenem Kasra         */
]);

let bestand, saetze;
try { bestand = bestandLaden(); saetze = saetzeLaden(); }
catch (e){
  console.log('  (Die Buchabzüge oder der Satzbestand fehlen auf diesem Rechner: ' + String(e.message).slice(0, 90) + ')');
  console.log('  Die Eichung ist NICHT gelaufen — das ist auf einem fremden Rechner der Normalfall, kein Fehler.');
  process.exit(0);
}

/* alle Wörter des Satzbestands, nach Stamm geordnet */
const nachStamm = new Map();
for (const s of saetze.values()) s.w.forEach((w, i) => { const k = stamm(w.ar); if (!nachStamm.has(k)) nachStamm.set(k, []); nachStamm.get(k).push({ form: w.ar, wo: s.id + ':' + (i + 1) }); });
const hatArtikel = f => nackt(f).startsWith(ALIF + LAM);
const endetAuf = (f, v) => f.endsWith(v) || f.endsWith(v + SHADDA);
const normAlif = f => f.replace(new RegExp('^' + ALIF + '[' + FATHA + Z(0x652) + ']?'), ALIF).replace(Z(0x671), ALIF);

/* Die Messung — mit den Umformungen als Eingabe, damit die Störtests eine verdorbene hineinreichen können. */
function eiche({ bestimmt, fall, mudaf, mitBi }){
  const z = { bestimmt: { gleich: 0, anders: 0, abgelehnt: 0 }, gen: { gleich: 0, anders: 0 }, akk: { gleich: 0, anders: 0 }, mudaf: { gleich: 0, anders: 0 }, bi: { gleich: 0, anders: 0 } };
  const anders = [];   /* { schluessel, lesbar } — `lesbar` nur für den lokalen Bericht */
  /* (1) */
  for (const k of bestand.values()){
    if (!k.ar || !['noun', 'adjective'].includes(k.type)) continue;
    const karte = nurAr(String(k.ar).split(' / ')[0]);
    if (karte.includes(' ') || !(endetAuf(karte, DAMMATAN) || endetAuf(karte, DAMMA))) continue;
    const belege = [...new Set((nachStamm.get(stamm(karte)) || []).filter(t => hatArtikel(t.form) && endetAuf(t.form, DAMMA)).map(t => t.form))];
    if (!belege.length) continue;
    const b = bestimmt(karte);
    if (b === null){ z.bestimmt.abgelehnt++; continue; }
    if (belege.some(f => normAlif(f) === normAlif(b))) z.bestimmt.gleich++;
    else { z.bestimmt.anders++; anders.push({ schluessel: 'bestimmt:' + k.id, lesbar: karte + ' -> ' + b + ' | im Bestand: ' + belege.join(' , ') }); }
  }
  /* (2) */
  for (const liste of nachStamm.values()){
    const best = liste.filter(t => hatArtikel(t.form));
    const nom = best.filter(t => endetAuf(t.form, DAMMA));
    if (!nom.length) continue;
    for (const [kasus, vokal] of [['gen', KASRA], ['akk', FATHA]]){
      const belege = [...new Set(best.filter(t => endetAuf(t.form, vokal)).map(t => t.form))];
      if (!belege.length) continue;
      const gebildet = [...new Set(nom.map(t => fall(t.form, kasus)).filter(Boolean))];
      if (belege.some(f => gebildet.includes(f))) z[kasus].gleich++;
      else { z[kasus].anders++; anders.push({ schluessel: kasus + ':' + nom[0].wo, lesbar: [...new Set(nom.map(t => t.form))].join(' , ') + ' -> ' + gebildet.join(' , ') + ' | im Bestand: ' + belege.join(' , ') }); }
    }
  }
  /* (3) */
  for (const k of bestand.values()){
    if (!k.ar || k.type !== 'noun') continue;
    const karte = nurAr(String(k.ar).split(' / ')[0]);
    const m = mudaf(karte);
    if (karte.includes(' ') || m === null) continue;
    const belege = [...new Set((nachStamm.get(stamm(karte)) || []).filter(t => !hatArtikel(t.form) && endetAuf(t.form, DAMMA)).map(t => t.form))];
    if (!belege.length) continue;
    if (belege.includes(m)) z.mudaf.gleich++;
    else { z.mudaf.anders++; anders.push({ schluessel: 'mudaf:' + k.id, lesbar: karte + ' -> ' + m + ' | im Bestand: ' + belege.join(' , ') }); }
  }
  /* (4) */
  const BI = Z(0x628) + KASRA;
  const alleFormen = new Map(); for (const liste of nachStamm.values()) for (const t of liste) if (!alleFormen.has(t.form)) alleFormen.set(t.form, t.wo);
  for (const [f, wo] of alleFormen){
    if (!f.startsWith(BI + ALIF + LAM)) continue;
    const rest = f.slice(2);
    const nomBelege = [...alleFormen.keys()].filter(x => hatArtikel(x) && stamm(x) === stamm(rest) && endetAuf(x, DAMMA));
    const ok = alleFormen.has(rest) || nomBelege.some(x => fall(x, 'gen') === rest);
    if (ok && mitBi(rest) === f) z.bi.gleich++;
    else { z.bi.anders++; anders.push({ schluessel: 'bi:' + wo, lesbar: f + ' | Rest ' + rest + ' | Rest belegt: ' + ok }); }
  }
  return { z, anders };
}

const ECHT = { bestimmt: LIB.bestimmt, fall: LIB.fall, mudaf: LIB.mudaf, mitBi: LIB.mitBi };
const { z, anders } = eiche(ECHT);
const neu = anders.filter(a => !ANGESEHEN.has(a.schluessel));
const verwaist = [...ANGESEHEN].filter(s => !anders.some(a => a.schluessel === s));

/* Der lesbare Bericht bleibt lokal: er enthält Wörter seiner Buchkarten. */
try {
  fs.mkdirSync(ARBEIT, { recursive: true });
  fs.writeFileSync(path.join(ARBEIT, 'satz-eichung.txt'), [JSON.stringify(z), '', ...anders.map(a => (ANGESEHEN.has(a.schluessel) ? 'angesehen ' : 'NEU       ') + a.schluessel + '   ' + a.lesbar)].join('\n') + '\n', 'utf8');
} catch (e){ /* der Bericht ist eine Lesehilfe, kein Teil der Prüfung */ }

let rot = 0;
const sag = (ok, text) => { console.log((ok ? '  ok   ' : '  ⛔   ') + text); if (!ok) rot = 1; };
console.log('--- Eichung der Umformungen für die Koran-Sätze ---');
console.log('  Bestand: ' + bestand.size + ' Karten · Satzbestand: ' + saetze.size + ' Sätze · ' + nachStamm.size + ' Stämme');
console.log('  bestimmt: ' + z.bestimmt.gleich + ' gleich, ' + z.bestimmt.anders + ' anders (' + z.bestimmt.abgelehnt + ' lehnt die Umformung selbst ab) · Genitiv: ' + z.gen.gleich + ' / ' + z.gen.anders
  + ' · Akkusativ: ' + z.akk.gleich + ' / ' + z.akk.anders + ' · Genitivverbindung: ' + z.mudaf.gleich + ' / ' + z.mudaf.anders + ' · bi-: ' + z.bi.gleich + ' / ' + z.bi.anders);
sag(!neu.length, 'keine NEUE Abweichung (' + anders.length + ' Abweichungen, alle angesehen)' + (neu.length ? ' — neu: ' + neu.map(a => a.schluessel).join(', ') + '   (Formen: data-ersatz/arbeit/koran-zwischenordner/satz-eichung.txt)' : ''));
sag(!verwaist.length, 'jede angesehene Abweichung besteht noch' + (verwaist.length ? ' — nicht mehr gemessen: ' + verwaist.join(', ') + ' (aus ANGESEHEN streichen)' : ''));
/* Eine Messung an fast nichts wäre auch „keine Abweichung". Die Schwellen liegen weit unter den Zahlen vom 13.10.2026
   (75 · 34 · 11 · 40 · 2) und wachsen mit seinem Bestand nur nach oben. */
sag(z.bestimmt.gleich >= 40 && z.gen.gleich >= 15 && z.akk.gleich >= 5 && z.mudaf.gleich >= 20 && z.bi.gleich >= 1,
  'es ist überhaupt etwas gemessen (bestimmt ≥ 40, Genitiv ≥ 15, Akkusativ ≥ 5, Genitivverbindung ≥ 20, bi- ≥ 1)');

/* ---------- Störtests: eine verdorbene Umformung MUSS neue Abweichungen bringen ---------- */
const stoer = (name, umformungen, vorsilbe) => {
  const r = eiche(Object.assign({}, ECHT, umformungen));
  const n = r.anders.filter(a => !ANGESEHEN.has(a.schluessel) && a.schluessel.startsWith(vorsilbe)).length;
  sag(n > 0, 'Störtest: ' + name + ' → ' + n + ' neue Abweichung(en)');
};
stoer('bestimmt() vergisst das Sukun auf dem Lam', { bestimmt: w => { const b = LIB.bestimmt(w); return b ? b.replace(Z(0x652), '') : b; } }, 'bestimmt:');
stoer('fall() setzt für den Genitiv ein Fatha', { fall: (w, k) => LIB.fall(w, k === 'gen' ? 'akk' : k) }, 'gen:');
stoer('fall() setzt für den Akkusativ ein Kasra', { fall: (w, k) => LIB.fall(w, k === 'akk' ? 'gen' : k) }, 'akk:');
stoer('mudaf() lässt das Tanwin stehen', { mudaf: w => { const t = nurAr(w); return t.endsWith(DAMMATAN) ? t : LIB.mudaf(w); } }, 'mudaf:');
stoer('mitBi() setzt ein Fatha auf das Ba', { mitBi: w => { const b = LIB.mitBi(w); return b ? Z(0x628) + FATHA + b.slice(2) : b; } }, 'bi:');

console.log(rot ? '\n⛔ eiche-koran-satz: es gibt Befunde.' : '\n✅ eiche-koran-satz: keine neue Abweichung, alle fünf Störtests schlagen an.');
process.exit(rot);
