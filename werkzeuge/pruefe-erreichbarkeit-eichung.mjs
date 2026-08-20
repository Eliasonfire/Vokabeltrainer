/* Stoertest: wirkt der Fix in pruefe-erreichbarkeit.js wirklich?
   ==========================================================================
   ⛔ Ein gruener Lauf beweist nichts — er war VORHER auch gruen. Der Fehler
   war latent: heute haengt keine Regel ausschliesslich an einem eigenen Wort.
   Also muss der Fall kuenstlich hergestellt werden.
   [[stoertest_muss_wirkung_nachweisen]]

   Aufbau: die `sichtbar`-Funktion in beiden Fassungen nachbilden und an
   demselben Fall messen. Kein Anfassen von grammar-data.js.
*/
import fs from 'node:fs';

const REPO = 'G:/1. Workspace/Vokabeltrainer';

const { BEISPIELSAETZE } =
  (new Function(fs.readFileSync(REPO + '/data/beispielsaetze.js', 'utf8') + ';return {BEISPIELSAETZE};'))();
const fen = {};
new Function('window', fs.readFileSync(REPO + '/data/vokabeln-madina-1.js', 'utf8'))(fen);
const kapVon = new Map((fen.VOKABELN['madina-1'] || []).map(w => [String(w.id), Number(w.chapter)]));
const stand = 12;

const alt = id => {
  const k = BEISPIELSAETZE[String(id)] ? kapVon.get(String(id)) : undefined;
  return BEISPIELSAETZE[String(id)] ? (k !== undefined && k <= stand) : true;
};
const neu = id => {
  const s = String(id);
  if (!BEISPIELSAETZE[s]) return true;
  const k = kapVon.get(s);
  if (k === undefined) return true;
  return k <= stand;
};

/* Drei Faelle, jeder mit bekannter Antwort — sonst waere der Test selbst
   ungeeicht. [[pruefwerkzeug_mit_eingebauter_antwort]] */
const eigenesMitSatz = Object.keys(BEISPIELSAETZE).find(i => /^p_/.test(i));
const buchFrueh = Object.keys(BEISPIELSAETZE).find(i => kapVon.get(i) !== undefined && kapVon.get(i) <= stand);
const buchSpaet = Object.keys(BEISPIELSAETZE).find(i => kapVon.get(i) !== undefined && kapVon.get(i) > stand);

const faelle = [
  ['eigenes Wort mit Satz (p_)', eigenesMitSatz, true,  'chapter personal — js/kern.js:149 gibt bedingungslos true'],
  ['Buchvokabel im Fenster',      buchFrueh,      true,  'Kapitel <= Lernstand'],
  ['Buchvokabel dahinter',        buchSpaet,      false, 'Kapitel > Lernstand — MUSS ausgeblendet bleiben']
];

let fehler = 0;
console.log('Fall'.padEnd(30) + 'id'.padEnd(20) + 'alt'.padEnd(8) + 'neu'.padEnd(8) + 'soll');
for (const [name, id, soll, warum] of faelle){
  if (!id){ console.log(name.padEnd(30) + '(kein Beispiel im Bestand)'); continue; }
  const a = alt(id), n = neu(id);
  const ok = n === soll;
  if (!ok) fehler++;
  console.log(name.padEnd(30) + String(id).slice(0,18).padEnd(20)
    + String(a).padEnd(8) + String(n).padEnd(8) + String(soll) + (ok ? '  ok' : '  ⛔ FALSCH'));
  console.log('   ' + warum);
}
console.log('');
if (alt(eigenesMitSatz) === neu(eigenesMitSatz)){
  console.log('⛔ DER STOERTEST HAT NICHTS BEWIESEN: alte und neue Fassung antworten gleich.');
  process.exit(1);
}
console.log('✔ Die Stoerung wirkt: fuer ' + eigenesMitSatz
  + ' sagt die alte Fassung ' + alt(eigenesMitSatz)
  + ', die neue ' + neu(eigenesMitSatz) + '.');
console.log(fehler ? '⛔ ' + fehler + ' Fall(e) falsch.' : '✔ Alle drei Faelle richtig — auch der, der ausgeblendet BLEIBEN muss.');
process.exit(fehler ? 1 : 0);
