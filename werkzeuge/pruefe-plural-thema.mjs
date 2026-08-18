/* pruefe3.mjs -- schaerferer Nachfolger von pruefe2.mjs
   =========================================================================

   WARUM ES DEN ZWEITEN ANLAUF BRAUCHT

   pruefe2.mjs misst den ANTEIL des Textes ab der ersten Plural-Erwaehnung.
   Damit stand بَابٌ mit 100 % in der Liste - und sein Text lautet:

       „أَبْوَابُ الْجَنَّةِ — die Tore des Paradieses, acht an der Zahl.
        Ein Begriff, den du kennst, und die Vokabel steckt mitten drin."

   Das ist genau die Sorte Eselsbruecke, die Elias haben WILL: ein Anker aus
   dem Glauben, an dem das Wort haengt. Dass der Anker zufaellig die Pluralform
   ist, macht ihn nicht schlechter. Wer diesen Text ersetzt, macht die App
   schlechter und meldet dabei Fortschritt.

   Elias' Beschwerde galt etwas anderem. Sein Ausloeser war حَقِيبَةٌ:

       „⚠️ Der Plural hat eine Hamzah mitten im Wort: حَقِيبَةٌ → حَقَائِبُ …
        Genau dasselbe Muster wie bei دُكَّانٌ → دَكَاكِينُ …"

   Hier IST die Pluralbildung das Thema. Sein Wortlaut: „sie haben im prinzip
   nur die pluralform erklaert oder erwaehnt."

   DER SCHAERFERE TEST

   Nicht „kommt der Plural vor", sondern „ist der Plural das THEMA" - und das
   entscheidet sich im ERSTEN Satz. Ein Text, der mit „Der Plural ist …"
   anfaengt, handelt vom Plural. Einer, der mit einem Koranbegriff anfaengt,
   handelt vom Wort.

   EICHUNG

   Zwei echte Faelle mit bekannter Antwort, beide fest verdrahtet:
     - der ausloesende Text von حَقِيبَةٌ (Fassung v160) MUSS anschlagen
     - der Text von بَابٌ MUSS schweigen
   Faellt eine der beiden Proben aus, bricht das Skript ab, statt eine Liste
   auszugeben, der man ansieht, dass sie plausibel ist.
*/
import fs from 'fs';
import vm from 'vm';

/* Der Pfad wird aus dem Ort DIESER Datei abgeleitet, nicht fest eingetragen.
   Die erste Fassung lag im Scratchpad der Sitzung und trug den Pfad als Text -
   damit waere sie nach der naechsten Sitzung weg gewesen, und die To-Do haette
   auf ein Werkzeug verwiesen, das es nicht mehr gibt. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(WURZEL);

const ctx = vm.createContext({ console });
for (const f of ['vocab-data.js','data/fachbegriffe.js','data/eselsbruecken-alt.js'])
  vm.runInContext(fs.readFileSync(f,'utf8'), ctx);
const V = [...vm.runInContext('VOCAB_DATA', ctx), ...vm.runInContext('FACHBEGRIFF_VOKABELN', ctx)];
const A = vm.runInContext('ESELSBRUECKEN_ALT', ctx);

/* ⚠️ NICHT am Doppelpunkt trennen. pruefe2.mjs tut das, und genau daran ist
   die erste Fassung dieses Skripts durch die Eichung gefallen: der Ausloeser
   heisst „Der Plural hat eine Hamzah mitten im Wort: حَقِيبَةٌ → حَقَائِبُ" —
   mit Trennung am Doppelpunkt bestand der „erste Satz" nur aus dem Teil VOR
   dem Beispiel, und der Formpfeil landete im zweiten. Der Test haette
   geschwiegen und die Liste haette plausibel ausgesehen.
   In diesen Texten leitet der Doppelpunkt fast immer das Beispiel ein; er
   trennt keine Saetze, er verbindet sie. */
const saetze = t => String(t||'').split(/(?<=[.!?])\s+/).filter(s => s.trim());

/* Ist der Plural das THEMA des Textes? Entschieden am ersten Satz. */
const PLURALWORT = /\bPlural\b|\bMehrzahl\b/i;
const FORMPFEIL  = /\u2192|->/;          /* „X → Y", die Gegenueberstellung zweier Formen */
function pluralIstThema(text){
  const s = saetze(text);
  if (!s.length) return false;
  const erster = s[0];
  /* Beides zusammen ist das Muster, das Elias gemeldet hat: das Wort „Plural"
     UND eine Formgegenueberstellung, gleich im ersten Satz. Eines allein
     genuegt nicht - „Nimm den Plural gleich mit" mitten im Text ist ein
     Zusatz, kein Thema. */
  return PLURALWORT.test(erster) && FORMPFEIL.test(erster);
}

/* Schwaechere Stufe: erster Satz nennt den Plural, aber ohne Formpfeil. */
function pluralImAufschlag(text){
  const s = saetze(text);
  return s.length ? PLURALWORT.test(s[0]) : false;
}

/* ---------- Eichung an zwei echten Faellen ---------- */
const EICH_SCHLAEGT_AN =
  '\u26a0\ufe0f Der Plural hat eine Hamzah mitten im Wort: \u062d\u064e\u0642\u0650\u064a\u0628\u064e\u0629\u064c \u2192 \u062d\u064e\u0642\u064e\u0627\u0626\u0650\u0628\u064f, \u1e25a-q\u0101-\u02beib. Genau dasselbe Muster wie bei \u062f\u064f\u0643\u0651\u064e\u0627\u0646\u064c \u2192 \u062f\u064e\u0643\u064e\u0627\u0643\u0650\u064a\u0646\u064f.';
const EICH_SCHWEIGT =
  '\u0623\u064e\u0628\u0652\u0648\u064e\u0627\u0628\u064f \u0627\u0644\u0652\u062c\u064e\u0646\u0651\u064e\u0629\u0650 \u2014 die Tore des Paradieses, acht an der Zahl. Ein Begriff, den du kennst, und die Vokabel steckt mitten drin.';

const a = pluralIstThema(EICH_SCHLAEGT_AN);
const b = pluralIstThema(EICH_SCHWEIGT);
console.log('=== Eichung ===');
console.log('  حَقِيبَةٌ (Elias\u2019 Ausloeser) muss anschlagen :', a ? 'erkannt, richtig' : 'NICHT erkannt \u2014 misst nichts');
console.log('  بَابٌ (guter Text) muss schweigen           :', b ? 'FAELSCHLICH erkannt' : 'still, richtig');
if (!(a && !b)){ console.log('  -> Eichung GESCHEITERT'); process.exit(2); }
console.log('  -> Eichung BESTANDEN\n');

/* ---------- Zaehlen ---------- */
const treffer = [], rand = [];
for (const w of V){
  const liste = [{q:'mnemo',t:w.mnemo}, ...(A[String(w.id)]||[]).map((t,i)=>({q:'alt'+(i+1),t}))];
  for (const {q,t} of liste){
    if (!t) continue;
    if (pluralIstThema(t)) treffer.push({ w, q, t });
    else if (pluralImAufschlag(t)) rand.push({ w, q, t });
  }
}

console.log(`=== Plural ist das THEMA (erster Satz: „Plural" + Formpfeil): ${treffer.length} Texte, ${new Set(treffer.map(x=>x.w.id)).size} Woerter ===`);
for (const x of treffer) console.log(`  ${x.w.id.padEnd(10)} ${x.q.padEnd(6)} ${(x.w.sg||x.w.ar)}  „${x.w.de}"`);

console.log(`\n=== Randfall: erster Satz nennt den Plural, aber ohne Formpfeil: ${rand.length} Texte ===`);
for (const x of rand) console.log(`  ${x.w.id.padEnd(10)} ${x.q.padEnd(6)} ${(x.w.sg||x.w.ar)}  „${x.w.de}"`);
