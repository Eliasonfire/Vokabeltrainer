/* pruefe-marken.mjs — hat jede arabische Ḥarakah einen Buchstaben, auf dem sie sitzt?
 * ====================================================================================
 *
 * ⛔ DER ANLASS (09.09.2026)
 *
 * Auf einer Pluralkarte stand „⚠️ Am Ende steht ein ُ und KEIN Tanwīn". Das
 * Damma dort ist ein KOMBINIERENDES Zeichen — es hat keine eigene Breite und
 * setzt sich auf den Buchstaben davor. Davor stand aber ein LEERZEICHEN.
 *
 * Was der Browser daraus macht, ist Schriftsache und nicht vorhersagbar: die
 * Marke rutscht auf das Leerzeichen, verschwindet, oder die Schrift schiebt
 * einen gepunkteten Ersatzkreis unter. In Elias' Schrift war sie ein winziger
 * Strich, der aussah wie ein Satzzeichen. Gesehen habe ich es erst, als eine
 * dieser Karten zum ersten Mal wirklich gerendert vor mir stand.
 * [[kombinierende_marke_einzeln]] [[bild_ohne_fehlermeldung_falsch]]
 *
 * ⭐⭐ UND DAS HAUS HATTE DIE LOESUNG SCHON — 58 MAL.
 *
 * An 58 anderen Stellen derselben Datei steht die Marke auf einem TATWEEL
 * (U+0640, der Verbindungsstrich): „ـٌ" statt „ٌ". Genau drei Stellen hatten
 * ihn nicht. Dieselbe Entscheidung, 61 Orte, drei davon ohne sie — zum dritten
 * Mal an diesem Tag dasselbe Muster.
 * [[entscheidung_gilt_fuer_das_zweite_werkzeug]]
 *
 * ====================================================================================
 * DIE REGEL
 *
 *   Jedes kombinierende arabische Zeichen in einem Anzeigetext muss ein
 *   TRAEGERZEICHEN direkt davor haben — einen arabischen Buchstaben, ein
 *   Tatweel, oder eine weitere Marke auf demselben Buchstaben.
 *
 * ⚠️ WAS ER NICHT PRUEFT: ob die Marke die RICHTIGE ist. Das ist eine Aussage
 * ueber die Sprache und braucht einen Beleg — siehe pruefe-taschkil.js. Hier
 * geht es nur darum, ob sie ueberhaupt irgendwo sitzt.
 *
 * ⚠️ Und er sieht nur die DATEN. Setzt Quelltext eine Marke selbst zusammen
 * (etwa beim Zerlegen eines Wortes), faellt das hier nicht auf.
 *
 * Aufruf:  node werkzeuge/pruefe-marken.mjs
 * Exit 0 = jede Marke sitzt · 1 = Stoertest greift nicht · 2 = Befunde
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lies = (...t) => fs.readFileSync(path.join(REPO, ...t), 'utf8');

/* ⛔ Die Zeichenbereiche stehen als CODEPUNKTE da, nicht als abgeschriebene
   Zeichen. Eine sichtbar kopierte Zeichenklasse kann eine Variante enthalten,
   die man nicht sieht — und dann prueft das Muster etwas anderes, als der
   Kommentar daneben behauptet. [[zeichenklasse_nie_sichtbar_kopieren]] */
const b = (c) => String.fromCharCode(c);
const TATWEEL = b(0x640);
/* kombinierend: Ḥarakāt/Tanwīn/Sukūn/Shadda (064B-065F) und das hochgestellte
   Alif (0670). */
const MARKE = new RegExp('[' + b(0x64B) + '-' + b(0x65F) + b(0x670) + ']');
/* traegt eine Marke: arabische Buchstaben (0620-064A, dazu 066E-06D3 fuer
   erweiterte Formen), das Tatweel, und jede weitere Marke — die sitzt dann
   auf demselben Buchstaben. */
const TRAEGT = new RegExp('[' + b(0x620) + '-' + b(0x64A)
  + b(0x64B) + '-' + b(0x65F) + b(0x670)
  + b(0x66E) + '-' + b(0x6D3) + ']');

/* ---------- Die Anzeigetexte, vollstaendig ---------- */
function quellenLesen(){
  const G = (new Function(lies('grammar-data.js')
    + ';return {GRAMMAR_RULES, SENTENCE_TAGS, SATZ_THEMEN};'))();
  return {
    VOCAB_DATA:           (new Function(lies('vocab-data.js') + ';return VOCAB_DATA;'))(),
    GRAMMAR_RULES:        G.GRAMMAR_RULES,
    SENTENCE_TAGS:        G.SENTENCE_TAGS,
    SATZ_THEMEN:          G.SATZ_THEMEN,
    LEHRBUCH_SAETZE:      (new Function(lies('lehrbuch-saetze.js') + ';return LEHRBUCH_SAETZE;'))(),
    ESELSBRUECKEN_ALT:    (new Function(lies('data', 'eselsbruecken-alt.js') + ';return ESELSBRUECKEN_ALT;'))(),
    BEISPIELSAETZE:       (new Function(lies('data', 'beispielsaetze.js') + ';return BEISPIELSAETZE;'))(),
    FACHBEGRIFF_VOKABELN: (new Function(lies('data', 'fachbegriffe.js') + ';return FACHBEGRIFF_VOKABELN;'))(),
  };
}

/* Alle Stellen, an denen eine Marke ohne Traeger steht. */
function ohneTraeger(text){
  const t = String(text);
  const treffer = [];
  for (let i = 0; i < t.length; i++){
    if (!MARKE.test(t[i])) continue;
    if (i > 0 && TRAEGT.test(t[i - 1])) continue;
    treffer.push({ stelle: i, marke: t[i],
      umfeld: t.slice(Math.max(0, i - 24), i + 4).replace(/\s+/g, ' ') });
  }
  return treffer;
}

/* Und dieselbe Frage fuer eine ganze Quelle, mit Pfad. */
function durchgehen(quellen){
  const befunde = [];
  let texte = 0;
  const sieh = (pfad, wert) => {
    if (typeof wert === 'string'){
      texte++;
      for (const x of ohneTraeger(wert)) befunde.push({ pfad, ...x });
    } else if (Array.isArray(wert)){
      wert.forEach((v, i) => sieh(pfad + '[' + i + ']', v));
    } else if (wert && typeof wert === 'object'){
      for (const [k, v] of Object.entries(wert))
        if (typeof v !== 'function' && !(v instanceof RegExp)) sieh(pfad + '.' + k, v);
    }
  };
  for (const [name, q] of Object.entries(quellen))
    sieh(name, Array.isArray(q) ? q : q);
  return { befunde, texte };
}

console.log('--- Sitzt jede Ḥarakah auf einem Buchstaben? ---\n');

let befunde = [], texte = 0, traeger = 0;
try {
  const Q = quellenLesen();
  ({ befunde, texte } = durchgehen(Q));
  /* Wie oft wird der Traeger heute schon richtig gesetzt? Das ist die
     Vergleichszahl — ohne sie sagt „0 Befunde" nur, dass nichts gefunden
     wurde, nicht dass die Regel ueberhaupt gilt. [[leere_liste_ist_keine_messung]] */
  const zaehleTraeger = (w) => {
    if (typeof w === 'string'){
      for (let i = 1; i < w.length; i++) if (MARKE.test(w[i]) && w[i - 1] === TATWEEL) traeger++;
    } else if (Array.isArray(w)) w.forEach(zaehleTraeger);
    else if (w && typeof w === 'object') Object.values(w).forEach(v => {
      if (typeof v !== 'function' && !(v instanceof RegExp)) zaehleTraeger(v);
    });
  };
  Object.values(Q).forEach(zaehleTraeger);
  console.log('  ' + texte + ' Anzeigetexte durchgesehen.');
  console.log('  ' + traeger + ' Marke(n) sitzen bewusst auf einem Tatweel (die Hausform).');
} catch (e){
  console.log('  ⛔ Bestand nicht lesbar: ' + e.message);
  process.exit(2);
}

console.log('');
for (const f of befunde){
  console.log('  ⛔ ' + f.pfad + '   …' + f.umfeld + '…');
  console.log('       Marke U+' + f.marke.charCodeAt(0).toString(16).toUpperCase()
    + ' ohne Buchstaben davor. Setz ein Tatweel (U+0640) direkt davor — so wie');
  console.log('       an den ' + traeger + ' anderen Stellen. Am Text selbst aendert das nichts.');
}

/* ---------- ⛔ STOERTEST ---------- */
console.log('=== Stoertest ===');
let stoer = 0;
const sProbe = (was, ist, soll) => {
  if (ist !== soll){ stoer++; console.log('  ⛔  ' + was + ': ' + JSON.stringify(ist) + ' statt ' + JSON.stringify(soll)); }
  else console.log('  ok   ' + was);
};
{
  const DAMMA = b(0x64F), MIM = b(0x645);
  sProbe('eine Marke nach einem Leerzeichen faellt auf',
    ohneTraeger('steht ein ' + DAMMA + ' und').length, 1);
  sProbe('dieselbe Marke auf einem Tatweel NICHT',
    ohneTraeger('steht ein ' + TATWEEL + DAMMA + ' und').length, 0);
  sProbe('eine Marke auf einem Buchstaben NICHT',
    ohneTraeger('das Wort ' + MIM + DAMMA + ' hier').length, 0);
  sProbe('zwei Marken auf einem Buchstaben NICHT',
    ohneTraeger(MIM + b(0x651) + DAMMA).length, 0);
  sProbe('eine Marke ganz am Anfang faellt auf', ohneTraeger(DAMMA + 'x').length, 1);
  sProbe('deutscher Text ohne Marke ist still', ohneTraeger('Alle vier enden gleich.').length, 0);
  /* Und dass die Durchsicht ueberhaupt in die Tiefe geht. */
  const tief = durchgehen({ P: [{ a: { b: 'x ' + DAMMA + ' y' } }] });
  sProbe('verschachtelte Felder werden erreicht', tief.befunde.length, 1);
  sProbe('… und der Pfad wird genannt', tief.befunde[0] && tief.befunde[0].pfad, 'P[0].a.b');
  /* Die Hausform muss es wirklich geben — sonst prueft er eine erfundene Regel. */
  sProbe('die Hausform ist im Bestand belegt (>= 20 Traeger)', traeger >= 20, true);
}
if (stoer){
  console.log('\n⛔ ' + stoer + ' Stoertest(s) gescheitert — dieser Pruefer misst nicht.');
  process.exit(1);
}

console.log('');
if (befunde.length){
  console.log('⛔ ' + befunde.length + ' Marke(n) ohne Traeger.');
  console.log('   Auf dem Schirm ist das kein Fehler, den jemand meldet — die Marke');
  console.log('   sieht nur aus wie ein Satzzeichen oder ist gar nicht da.');
  process.exit(2);
}
console.log('✅ Jede Ḥarakah sitzt auf einem Buchstaben — ' + traeger
  + ' davon auf einem Tatweel, wie es die Hausform will.');
