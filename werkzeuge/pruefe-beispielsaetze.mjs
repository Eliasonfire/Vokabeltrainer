/* ============================================================================
   Jede Karte braucht einen Beispielsatz — und dieser Prüfer zählt, wem einer fehlt.
   ============================================================================

   Elias am 22.09.2026, 22:52, mit dem Bild der Karte „Genitivverbindung — zwei
   Nomen werden ein Ausdruck", auf der nur eine Eselsbrücke stand:

     „kein beispielsatz, sorge dafür das alle ien beispielsatz haben"

   ---------------------------------------------------------------------------
   WAS DIESER PRÜFER IST — UND WAS ER NICHT IST
   ---------------------------------------------------------------------------
   Er **zählt** und **benennt**. Er schreibt keinen Satz.

   ⛔ Und das ist kein Versäumnis, sondern die Regel: Arabisch wird hier nie
   selbst vokalisiert, und Vokabeln, Grammatik und Koranstellen brauchen eine
   zitierbare Quelle. Ein Beispielsatz, den ich mir ausdenke, sähe aus wie
   Material aus seinem Unterricht und wäre keins — er würde ihn auswendig
   lernen. [[regeln_selbst_auswerten]] · [[quranbezug_nur_auswendiges]]

   ---------------------------------------------------------------------------
   WAS AM 22.09.2026 GEMESSEN WURDE
   ---------------------------------------------------------------------------
     vocab-data.js            171 Karten,  0 ohne Beispielsatz
     data/fachbegriffe.js      61 Karten, 25 ohne
     data/vokabeln-eigene.js   11 Karten, 11 ohne
                              ---------------------
                              243 Karten, 36 ohne

   ⚠️ UND EINE ZWEITE MESSUNG, DIE DEN NAHELIEGENDEN WEG VERWORFEN HAT:
   Für 17 der 36 gibt es im ganzen Satzbestand keinen Satz, der das Wort
   enthält — es sind Grammatikbegriffe (إِعْرَاب, تَنْوِين, خَبَر …), und die
   kommen in Kurssätzen nicht vor. Sie brauchen einen Satz, der das PHÄNOMEN
   zeigt, nicht das Wort.
   ⛔ Der erste Anlauf zählte 19 „Treffer" — darunter لِ mit 382 und مَدّ mit
   81. Das waren Teilstrings, nicht Wörter: لِ ist ein Buchstabe, der in fast
   jedem Satz vorkommt. Eine Zahl, die so entsteht, sieht aus wie ein Ergebnis
   und ist keins. [[stichworttreffer_ist_kein_inhaltstreffer]]
   Deshalb prüft `--kandidaten` unten auf WORTGRENZEN, nicht auf enthalten.

   Aufruf:  node werkzeuge/pruefe-beispielsaetze.mjs
            node werkzeuge/pruefe-beispielsaetze.mjs --liste       alle zeigen
            node werkzeuge/pruefe-beispielsaetze.mjs --kandidaten  vorhandene Sätze vorschlagen
   Exit 0 = keine Karte ohne Satz · 2 = Lücken, die auf Material warten
   Exit 1 = ein Werkzeugfehler (die Zahl wäre nicht belastbar)
   ============================================================================ */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HIER   = path.dirname(url.fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');
const zeigeAlle   = process.argv.includes('--liste');
const kandidaten  = process.argv.includes('--kandidaten');

function lade(datei){
  const voll = path.join(WURZEL, datei);
  if (!fs.existsSync(voll)) return null;
  const s = fs.readFileSync(voll, 'utf8');
  /* ⛔ `const NAME = […]` landet NICHT am globalen Objekt eines vm-Kontexts —
     eine Suche über Object.keys() findet dort nichts und sieht aus wie „die
     Datei ist leer". Deshalb wird jeder Name ausdrücklich herausgereicht. */
  const namen = [...s.matchAll(/^(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map(m => m[1]);
  const ctx = { window:{}, document:{}, __raus:{} };
  vm.createContext(ctx);
  try {
    vm.runInContext(s + '\n;' + namen.map(n => `try{__raus[${JSON.stringify(n)}]=${n}}catch(e){}`).join(';'),
                    ctx, { filename: datei });
  } catch(e){ return { __fehler: e.message }; }
  const raus = { ...ctx.__raus };
  for (const k of Object.keys(ctx.window || {})) raus[k] = ctx.window[k];
  return raus;
}

/* Ohne Ḥarakāt und mit vereinheitlichten Alif-/Tāʾ-Varianten — dasselbe Maß,
   mit dem auch sonst im Projekt verglichen wird. */
const nackt = x => String(x || '').normalize('NFC')
  .replace(/[ً-ٰٓۖ-ۭـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

/* ⛔⛔ NUR WAS index.html WIRKLICH LÄDT, IST EINE KARTE.

   `data/vokabeln-eigene.js` steht hier bewusst NICHT. Gemessen am 22.09.2026:
   index.html lädt die Datei **null mal** (nur sw.js führt sie im Vorrat), und
   alle 11 Einträge darin stehen noch einmal in vocab-data.js — dort **mit**
   Beispielsatz, alle elf. Die Datei ist ein Abzug, keine Quelle.

   Wer sie mitzählt, meldet 36 Lücken statt 25 — also elf Karten, die Elias auf
   seinem Bildschirm mit Satz sieht. Genau so weit war der erste Anlauf schon.
   [[liste_zeigt_nur_eine_oberflaeche]] · [[einzeln_frei_ist_nur_im_browser]]

   ⚠️ Dass dieselbe Vokabel in zwei Dateien steht, ist zugleich die Spur zu
   seinem doppelten مُضَاف vom selben Abend — siehe To-Do. */
const QUELLEN = [
  ['vocab-data.js',        'VOCAB_DATA'],
  ['data/fachbegriffe.js', 'FACHBEGRIFF_VOKABELN']
];

/* ⛔⛔ EIN LEERES `sentAr` HEISST NICHT, DASS DIE KARTE KEINEN SATZ HAT.

   `saetzeNachtragen()` in js/buecher.js hängt beim Start für jede Karte ohne
   eigenen Satz den aus `BEISPIELSAETZE[id]` an. Wer nur das Feld liest, zählt
   deshalb Lücken, die auf dem Bildschirm gar nicht existieren — und meldet
   Elias eine Zahl, die er an seiner App nicht nachvollziehen kann.

   Gemessen am 22.09.2026: der erste Anlauf kam auf 36. Aufgefallen ist es nur,
   weil mehrere „Kandidaten" die ID DER KARTE SELBST trugen — der Satz lag
   schon da, nur woanders. [[liste_zeigt_nur_eine_oberflaeche]]

   ⚠️ Die App liest data/beispielsaetze.js nach VOCAB_DATA.push(), also NACH
   dem Einhängen der Fachbegriffe und eigenen Wörter. Der Nachtrag gilt somit
   für alle drei Quellen unten — genau wie hier. */
const BSP = (() => {
  const b = lade('data/beispielsaetze.js') || {};
  for (const v of Object.values(b))
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 20) return v;
  return {};
})();
const hatSatz = w => !!(String(w.sentAr || '').trim()
  || (BSP[String(w.id)] && String(BSP[String(w.id)].sentAr || '').trim()));

const fehler = [];
const zeilen = [];
let gesamt = 0;
let ausNachtrag = 0;
const ohneSatz = [];

for (const [datei, name] of QUELLEN){
  const geladen = lade(datei);
  if (!geladen){ fehler.push(datei + ' fehlt'); continue; }
  if (geladen.__fehler){ fehler.push(datei + ': ' + geladen.__fehler); continue; }
  let liste = geladen[name];
  if (!Array.isArray(liste)){ fehler.push(datei + ': ' + name + ' ist keine Liste — die Zahlen unten wären nicht belastbar'); continue; }
  /* ⛔ Seit dem 23.09.2026 zählen nur BESTELLTE Fachbegriffe als Karte
     (FACHBEGRIFF_AUFTRAG). Elias: „ich hattte spezifisch darum gebeten
     akkusativ, genitiv und nominativ und vielleicht noch eine hand voll
     weitere zu haben aber nicht solceh dinge." Für einen ruhenden Begriff einen
     Satz zu verfassen, hieße Arbeit an einem Wort, das er abbestellt hat. */
  if (geladen.FACHBEGRIFF_AUFTRAG && typeof geladen.FACHBEGRIFF_AUFTRAG === 'object'){
    const vorher = liste.length;
    liste = liste.filter(w => w && Object.prototype.hasOwnProperty.call(geladen.FACHBEGRIFF_AUFTRAG, String(w.id)));
    if (vorher !== liste.length) console.log('  ℹ ' + datei + ': ' + (vorher - liste.length) + ' ruhende Fachbegriffe nicht gezählt (keine Karte).');
  }
  const ohne = liste.filter(w => w && !hatSatz(w));
  const nachtrag = liste.filter(w => w && !String(w.sentAr || '').trim() && hatSatz(w)).length;
  gesamt += liste.length;
  ausNachtrag += nachtrag;
  ohne.forEach(w => ohneSatz.push({ ...w, quelle: datei }));
  zeilen.push([datei, liste.length, ohne.length, nachtrag]);
}

/* ---------- Kandidaten aus dem vorhandenen Bestand ---------- */

function alleSaetze(){
  const raus = [];
  const b = lade('data/beispielsaetze.js') || {};
  for (const v of Object.values(b)){
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    for (const [id, s] of Object.entries(v)) if (s && s.sentAr) raus.push({ id, ar: s.sentAr, de: s.sentDe || '' });
  }
  for (const [datei, name] of QUELLEN){
    const g = lade(datei); if (!g || !Array.isArray(g[name])) continue;
    for (const s of g[name]) if (s && s.sentAr) raus.push({ id: s.id || '?', ar: s.sentAr, de: s.sentDe || '' });
  }
  return raus;
}

/* ⭐ WORTGRENZE statt „enthalten" — der Grund steht oben im Kopf. Ein einzelner
   Buchstabe wie لِ trifft sonst fast jeden Satz. */
function stehtAlsWort(satzNackt, wortNackt){
  if (!wortNackt) return false;
  /* Einzelbuchstaben werden gar nicht erst gesucht: als eigenes Wort sind sie
     im Arabischen meist Präfixe und stehen nie getrennt. */
  if (wortNackt.replace(/\s/g, '').length < 2) return false;
  const escaped = wortNackt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[\\s،.؟!"«»])' + escaped + '($|[\\s،.؟!"«»])').test(satzNackt);
}

let mitKandidat = 0;
const vorschlaege = [];
if (kandidaten){
  const saetze = alleSaetze();
  for (const w of ohneSatz){
    const k = nackt(w.ar);
    const treffer = saetze.filter(s => stehtAlsWort(nackt(s.ar), k));
    if (treffer.length){ mitKandidat++; vorschlaege.push({ w, treffer }); }
  }
}

/* ---------- Ausgabe ---------- */

console.log('--- Beispielsätze ---\n');
console.log('Quelle                      Karten   nachgetragen   ohne Satz');
for (const [datei, n, o, nt] of zeilen)
  console.log('  ' + datei.padEnd(26) + String(n).padStart(4) + String(nt).padStart(13) + String(o).padStart(12));
console.log('  ' + 'SUMME'.padEnd(26) + String(gesamt).padStart(4) + String(ausNachtrag).padStart(13) + String(ohneSatz.length).padStart(12));
console.log('\n  „nachgetragen" = kein eigenes sentAr, aber ein Satz in data/beispielsaetze.js;');
console.log('  den hängt saetzeNachtragen() (js/buecher.js) beim Start an. Auf dem');
console.log('  Bildschirm ist das kein Unterschied — in der Datei schon.');

if (ohneSatz.length && (zeigeAlle || ohneSatz.length <= 40)){
  console.log('\nOhne Beispielsatz:');
  for (const w of ohneSatz)
    console.log('  ' + String(w.id).slice(0, 24).padEnd(26) + String(w.ar).padEnd(20) + (w.de || '').slice(0, 44));
}

if (kandidaten){
  console.log('\nVorhandene Sätze, in denen das Wort ALS WORT steht: ' + mitKandidat + ' von ' + ohneSatz.length);
  for (const v of vorschlaege)
    console.log('  ' + String(v.w.id).slice(0, 24).padEnd(26) + v.w.ar.padEnd(18)
              + v.treffer.length + '×  z.B. ' + v.treffer[0].id + '  ' + v.treffer[0].ar.slice(0, 44));
  console.log('\n⛔ Das sind VORSCHLÄGE, kein Eintrag. Ein Satz wird erst übernommen,');
  console.log('   wenn er zum Wort wirklich passt — und keiner wird dazuerfunden.');
}

if (fehler.length){
  console.log('\n✖ Werkzeugfehler — die Zahlen oben sind nicht belastbar:');
  fehler.forEach(z => console.log('  · ' + z));
  process.exit(1);
}

if (ohneSatz.length){
  console.log('\n⬜ ' + ohneSatz.length + ' Karte(n) ohne Beispielsatz.');
  console.log('   Elias am 22.09.2026: „kein beispielsatz, sorge dafür das alle ien beispielsatz haben"');
  console.log('   ⛔ Kein Satz wird erfunden — sie warten auf belegtes Material.');
  console.log('   Mit --kandidaten zeigt dieser Prüfer, für welche es schon einen gibt.');
  process.exit(2);
}
console.log('\n✅ Jede Karte hat einen Beispielsatz.');
process.exit(0);
