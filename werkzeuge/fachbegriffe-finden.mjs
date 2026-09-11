/* fachbegriffe-finden.mjs — welche arabischen Fachbegriffe aus seinen Regeln sind noch keine Vokabel?
 * ==========================================================================
 *
 *   node werkzeuge/fachbegriffe-finden.mjs              nur Unentschiedene zeigen
 *   node werkzeuge/fachbegriffe-finden.mjs --alle       auch schon Entschiedene
 *   node werkzeuge/fachbegriffe-finden.mjs --ohne-bestand   so tun, als gäbe es
 *                                                      data/fachbegriffe.js nicht (Eichung)
 *
 *   Exitcode 0 = nichts zu entscheiden · 2 = Kandidaten warten · 1 = Daten nicht ladbar
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026:
 *   20:06:16 „das muss gefixt werden. eine routine dafür wäre doch gut oder was
 *             denkst du ? wie sollen wir das lösen"
 *   20:20:53 Auswahl: „Direkt eintragen (Recommended)"
 * Der Pflegeplan-Prüfer hatte gemeldet: neue Fachbegriffe aus neuen Folgen
 * trägt niemand ein. Sein Auftrag vom 17.08.2026 dazu: „begriffe, die in meinem
 * unterricht häufiger verwendet werden wie harfuljar … die müssen inkludiert
 * werden und als eigene vokabeln hinzugefügt werden. mach das alles für mich."
 *
 * ⛔ WARUM DIE KANDIDATEN AUS DEN REGELN KOMMEN UND NICHT AUS DEM TRANSKRIPT
 * Zuerst gemessen (11.09.2026, alle 19 Folgen): Umschrift im Transkript
 * gegen ein Lautskelett des arabischen Worts zählen. Ergebnis unbrauchbar:
 * مَرْفُوع und مَعْرِفَة haben dasselbe Skelett (je 49 Treffer), نَعْت traf
 * deutsche Wörter (Folge 18: 70), ظَرْف nur einmal, obwohl der Lehrer es
 * erklärt, تاء مَرْبُوطة nie. Eine Zahl, die an bekannten Antworten so
 * scheitert, darf nicht über „direkt eintragen" entscheiden.
 * [[mein_neues_werkzeug_ist_verdaechtig]]
 * Die Regeln dagegen sind schon aus dem Unterricht ausgewertet — mit Folge,
 * Zeitmarke und dem Wortlaut des Lehrers. Ein arabischer Begriff, der eine
 * Regel BENENNT oder in mehreren Regeln wiederkehrt, ist einer, über den der
 * Lehrer spricht.
 *
 * KANDIDAT IST, was
 *   · im NAMEN einer Regel steht (die Regel handelt davon), oder
 *   · in mindestens WIEDERKEHR Regeln vorkommt (Name oder Erklärung),
 * und was weder Fachbegriff noch Vokabel in vocab-data.js ist und noch nicht
 * entschieden wurde (werkzeuge/fachbegriffe-entscheidungen.json).
 *
 * ⛔ DAS WERKZEUG ENTSCHEIDET NICHTS. Unter den Kandidaten stehen auch
 * Beispielwörter und Namen (مُحَمَّدٌ kehrt in zehn Regeln wieder). Ob ein
 * Kandidat ein Fachbegriff ist, liest die Wartung an der Fundstelle nach —
 * „du sollst sie selber auswerten" (18.08.2026) — und trägt ihn mit
 * werkzeuge/fachbegriffe-setzen.mjs ein, lehnt ihn ab oder stellt ihn als
 * Frage an den Lehrer. Jede Entscheidung wird gemerkt; derselbe Kandidat
 * kommt nie wieder. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * EICHUNG (pruefe-fachbegriffe-kette.mjs): mit --ohne-bestand muss das
 * Werkzeug die zehn Fachbegriffe vom 17.08.2026 selbst wiederfinden.
 */
import { ladeDaten, nackt, taschkilLuecken, zaehleNackt, kandidatenAusRegeln, BUCHSTABE } from './fachbegriffe-kern.mjs';

const WIEDERKEHR = 3;
const args = process.argv.slice(2);
const ALLE = args.includes('--alle');
const OHNE_BESTAND = args.includes('--ohne-bestand');

let d;
try { d = ladeDaten(); } catch (e) { console.log('⛔ Daten nicht ladbar: ' + String(e.message).split('\n')[0]); process.exit(1); }
const { G, K, F, V, E, grammarText, kartenText } = d;

const WORTGRUPPE = new RegExp('[' + BUCHSTABE + '][\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640' + BUCHSTABE + ']*(?:\\s+[' + BUCHSTABE + '][\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640' + BUCHSTABE + ']*)*', 'g');
const WORT = new RegExp('[' + BUCHSTABE + '][\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640' + BUCHSTABE + ']*', 'g');

const bestand = new Set(OHNE_BESTAND ? [] : F.map(f => nackt(f.ar)));
const vokabeln = new Set(V.map(v => nackt(v.ar)));
const entschieden = (E && E.entscheidungen) || {};

const kand = kandidatenAusRegeln(G);   // nackt -> { formen, regeln: Map(id -> Regel), imNamen }

/* Alle Schreibungen eines Begriffs in beiden Quellen — vollständig vokalisiert? */
const alleFormen = (k) => {
  const raus = new Map();
  for (const text of [grammarText, kartenText]){
    for (const m of text.normalize('NFC').match(WORTGRUPPE) || []){
      for (const t of m.split(/\s+/).length > 1 ? [m, ...m.split(/\s+/)] : [m]){
        if (nackt(t) === k) raus.set(t, (raus.get(t) || 0) + 1);
      }
    }
  }
  return [...raus].sort((a, b) => b[1] - a[1]);
};

/* Ein einzelnes Wort, das Teil eines vorhandenen Fachbegriffs ist (تَاء aus
   تاء مَرْبُوطة, إِشَارَة aus اِسْمُ الْإِشَارَة), ist kein eigener Kandidat. */
const teilVonBestand = (k) => !k.includes(' ') && [...bestand].some(b => b.includes(' ') && b.split(' ').includes(k));

/* Zurückgestellt oder als Frage offen: kommt wieder, sobald eine Regel ihn
   nennt, die es bei der Entscheidung noch nicht gab — dann hat der Unterricht
   ihn womöglich aufgegriffen. Abgelehnt bleibt abgelehnt. */
const wiederVorlegen = (e, x) => e && (e.entscheidung === 'zurueckgestellt' || e.entscheidung === 'frage')
  && Array.isArray(e.regeln) && [...x.regeln.keys()].some(id => !e.regeln.includes(id));

const liste = [];
for (const [k, x] of kand){
  if (!x.imNamen && x.regeln.size < WIEDERKEHR) continue;
  if (bestand.has(k) || vokabeln.has(k) || teilVonBestand(k)) continue;
  const e = entschieden[k];
  const wieder = wiederVorlegen(e, x);
  if (e && !wieder && !ALLE) continue;
  liste.push({ k, x, e: wieder ? null : e, wieder });
}
liste.sort((a, b) => (b.x.imNamen - a.x.imNamen) || (b.x.regeln.size - a.x.regeln.size));

console.log('Kandidaten aus ' + G.length + ' Regeln' + (OHNE_BESTAND ? ' (ohne data/fachbegriffe.js — Eichung)' : '') + ': '
  + liste.length + (ALLE ? ' (mit Entschiedenen)' : ' unentschieden'));
let offen = 0;
for (const { k, x, e, wieder } of liste){
  const formen = alleFormen(k);
  const voll = formen.filter(([f]) => !taschkilLuecken(f).length);
  const regeln = [...x.regeln.values()];
  const unterricht = regeln.filter(r => r.source && r.source.folge);
  if (!e) offen++;
  console.log('');
  console.log((e ? '  [' + e.entscheidung + '] ' : '  🆕 ') + k + '   ' + (x.imNamen ? 'benennt eine Regel · ' : '') + regeln.length + ' Regel(n) · belegt ' + zaehleNackt(grammarText, k) + '×'
    + (wieder ? '   ↩ wieder vorgelegt: eine neue Regel nennt ihn (war ' + entschieden[k].entscheidung + ')' : ''));
  console.log('     Schreibungen: ' + formen.slice(0, 4).map(([f, n]) => f + '×' + n + (taschkilLuecken(f).length ? ' (unvollständig)' : ' ✓')).join('  '));
  if (!voll.length) console.log('     ⚠️ keine vollständig vokalisierte Schreibung in den Quellen → Frage an den Lehrer, nicht eintragen');
  console.log('     Regeln: ' + regeln.slice(0, 4).map(r => r.id + (r.source && r.source.folge ? ' (Folge ' + r.source.folge + (r.source.approxTimestamp ? ', ' + r.source.approxTimestamp : '') + ')' : ' (Buch)')).join(' · ')
    + (regeln.length > 4 ? ' · +' + (regeln.length - 4) : '') + (unterricht.length ? '' : '  ⚠️ nur aus Büchern, nicht aus dem Unterricht'));
  if (e) console.log('     entschieden am ' + e.am + ': ' + (e.grund || e.frage || e.id || ''));
}
console.log('');
if (offen){
  console.log('→ ' + offen + ' Kandidat(en) warten auf eine Entscheidung: aufnehmen, ablehnen oder als Frage an den Lehrer.');
  console.log('  Eintragen: node werkzeuge/fachbegriffe-setzen.mjs <auftrag.json> --pruefen, danach ohne --pruefen');
  process.exit(2);
}
console.log('Nichts zu entscheiden.');
process.exit(0);
