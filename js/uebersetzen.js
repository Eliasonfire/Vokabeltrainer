/* ============================================================================
   ÜBERSETZUNGSÜBUNG IM SATZMODUS — was falsch ist, warum, und wie es heißt
   ============================================================================

   Elias am 22.09.2026, 21:15, im Wortlaut:

     „es sollte auch im satzmodus eine übung geben, wo mir ein satz gegeben wird
      und den soll ich dann ins deutsche übersetzten. wenn ich falsch mache muss
      erkannt werden was falsch ist und warum und mir das dann zeigen"

   und unmittelbar danach, auf die Rückfrage, was in die Rückmeldung gehört:

     „und die richtige deutsche überstzung und halt warum"

   Drei Dinge also, und alle drei sind Pflicht: WAS falsch ist · WARUM (mit dem
   Namen der Regel, die es entscheidet) · die RICHTIGE Übersetzung.

   ⭐⭐ DER GRUNDSATZ, AN DEM SICH JEDE EINZELNE PRÜFUNG HIER MESSEN LÄSST:
   **großzügig beim Richtigzählen, streng beim Benennen eines Fehlers.**

   Die beiden Hälften ziehen in verschiedene Richtungen, und das ist Absicht.
   Eine Übersetzung hat viele richtige Fassungen — „Die Frau des Händlers ist im
   Haus" und „die frau vom händler ist im haus" sind dieselbe Leistung. Wer hier
   streng ist, bestraft Deutsch statt Arabisch zu prüfen.
   Umgekehrt: einen Fehler zu BENENNEN heißt, ihm einen Regelnamen anzuhängen.
   Eine falsch benannte Regel ist schlimmer als gar keine — sie bringt ihm etwas
   bei, das nicht stimmt. Deshalb feuert unten keine Prüfung auf Verdacht: jede
   verlangt ihren Beleg IM SATZ, nicht bloß im Verdacht.
   [[zahlen_ohne_beleg]] · [[regeln_selbst_auswerten]]

   ⛔ WAS DIESE DATEI NICHT TUT: raten. Findet keine der sieben Prüfungen ihren
   Beleg, sagt die Rückmeldung genau das — „ich kann nicht genau sagen, woran
   es liegt" — und zeigt die Musterübersetzung. Elias hat diesen Zweig
   ausdrücklich verlangt. Ein erfundener Grund wäre hier besonders teuer, weil
   niemand gegenliest: er lernt ihn.

   ⛔ WARUM EINE EIGENE DATEI und nicht eine Funktion in js/uebung.js:
   `werkzeuge/pruefe-pflegeplan.mjs` findet eine neue Funktion INNERHALB einer
   bestehenden Datei nicht (steht so in CLAUDE.md). Eine neue Datei wird
   gefunden, muss in sw.js in den Offline-Vorrat, in index.html geladen und in
   den Pflegeplan eingetragen werden — genau die Kette, die eine neue Funktion
   am Leben hält. [[werkzeug_ohne_aufrufer]]

   ---------------------------------------------------------------------------
   DIE SIEBEN FEHLERARTEN UND IHRE REGELN
   ---------------------------------------------------------------------------
   Die Kennungen sind in grammar-data.js nachgemessen (22.09.2026), nicht
   geraten. Jede Zeile nennt den BELEG, ohne den die Prüfung schweigt:

   | Fehlerart                 | Regel                      | Beleg im Satz          |
   |---------------------------|----------------------------|------------------------|
   | Wort ausgelassen          | — (Vollständigkeit)        | Vokabel im Muster      |
   | Adjektiv statt Aussage    | nat-bestimmtheit-01        | eine Rolle خَبَر       |
   | Bestimmtheit              | al-tanwin-tilgung-01       | اَلْ oder Tanwīn        |
   | Iḍāfa gedreht             | mudaf-ilayh-01             | مُضَاف + مُضَاف إِلَيْه |
   | falscher Besitzer         | possessiv-ya-01            | Wort endet auf ـي      |
   | Genus                     | isara-genus-kongruenz-01   | Hinweiswort im Satz    |
   | Adjektiv am falschen Wort | nat-wen-beschreibt-01      | نَعْت mit Bezugswort   |

   „Wort ausgelassen" hat bewusst KEINE Regel: ein fehlendes Wort ist keine
   Grammatikfrage. Ihm eine Regel anzuhängen wäre genau die Sorte Behauptung,
   die diese Datei vermeiden soll.

   ⚠️ hadha-al-kein-satz-01 („dieses Haus ist kein Satz") wäre die achte und
   fehlt mit Absicht: die Regel trägt in grammar-data.js `ausgeblendet: true`
   mit dem Vermerk „Elias 26.08.2026: aus dem Satzmodus. NICHT loeschen."
   Sie hier zu nennen, hieße sie durch die Hintertür zurückzuholen. Der Fall
   selbst wird trotzdem erkannt — er läuft über die Bestimmtheit. Und gefragt
   wird nicht `rule.ausgeblendet`, sondern `regelAusgeblendet(rule)`: es gilt
   die jüngere der beiden Entscheidungen (sein Schalter in der App oder der
   Export aus der Regelprüfung), und nur diese Funktion weiß das.
   [[zwei_stellen_eine_entscheidung]]
   ============================================================================ */

/* ---------- Deutsch vergleichbar machen ---------- */

/* Kleinschreibung, Satzzeichen weg, typografische Zeichen vereinheitlicht.
   ⚠️ NFC: dieselbe Normalisierung wie überall sonst im Projekt. Zwei Wege,
   Unicode zu normalisieren, sind zwei Wahrheiten über dieselbe Zeichenkette. */
function uebsNorm(s){
  return String(s == null ? '' : s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[„“”»«"']/g, ' ')
    .replace(/[.,;:!?()\[\]–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uebsWorte(s){
  const n = uebsNorm(s);
  return n ? n.split(' ').filter(Boolean) : [];
}

/* ⭐ Der Stamm — hier entscheidet sich, wie großzügig das Richtigzählen ist.
   „neu", „neuer", „neue", „neues" sind dieselbe Vokabel; „Haus" und „Hauses"
   auch. Abgeschnitten wird nur, wenn mindestens vier Zeichen stehen bleiben —
   sonst würde aus „die" ein „di" und aus „ein" ein „ei", und zwei verschiedene
   Wörter fielen zusammen. Eine Normalisierung, die zu viel zusammenwirft,
   meldet „richtig" für etwas Falsches, und das fällt niemandem auf.

   ⚠️ Kein Stemmer von der Stange und keine Umlautzerlegung: „Häuser" bleibt
   von „Haus" verschieden. Das ist eine bewusste Lücke — sie führt höchstens zu
   einem „Wort ausgelassen", das keines ist, und dieser Fall ist über den
   Vokabelabgleich unten zusätzlich abgesichert. */
const UEBS_ENDUNGEN = ['en', 'em', 'er', 'es', 'e', 'n', 's'];
function uebsStamm(w){
  let x = uebsNorm(w).replace(/ß/g, 'ss');
  for (const e of UEBS_ENDUNGEN){
    if (x.length - e.length >= 4 && x.endsWith(e)) return x.slice(0, -e.length);
  }
  return x;
}

/* Wörter, die für die Vollständigkeit nicht zählen. Sie tragen keine Vokabel:
   wer „die" vergisst, hat kein Wort ausgelassen, sondern einen Artikel — und
   der ist ein eigener Befund (Bestimmtheit), kein fehlendes Wort.
   ⚠️ Die Formen von „sein" stehen bewusst mit drin und werden weiter unten
   TROTZDEM einzeln geprüft: für die Vollständigkeit sind sie belanglos, für
   die Frage „Wortgruppe oder Satz" sind sie das Entscheidende. */
const UEBS_FUELLWORTE = new Set([
  'der','die','das','den','dem','des','ein','eine','einen','einem','eines','einer',
  'ist','sind','bin','bist','seid','war','waren','wird','werden',
  'und','oder','aber','auch','noch','nicht','kein','keine','keinen',
  'in','im','an','am','auf','aus','bei','beim','mit','nach','von','vom','zu','zum','zur',
  'vor','hinter','neben','unter','ueber','über','zwischen','gegenueber','gegenüber',
  'sich','es','da','hier','dort','wo','wer','was','wie','warum'
]);

const UEBS_KOPULA   = new Set(['ist','sind','bin','bist','seid','war','waren']);
const UEBS_BESTIMMT = new Set(['der','die','das','den','dem','des','im','am','vom','zum','zur','beim']);
const UEBS_UNBESTIMMT = new Set(['ein','eine','einen','einem','eines','einer']);
const UEBS_HINWEIS  = new Set(['dies','dieser','diese','dieses','diesen','diesem','jener','jene','jenes','das']);
const UEBS_BESITZ   = {
  mein: ['mein','meine','meinen','meinem','meiner','meines'],
  dein: ['dein','deine','deinen','deinem','deiner','deines'],
  sein: ['sein','seine','seinen','seinem','seiner','seines'],
  ihr:  ['ihr','ihre','ihren','ihrem','ihrer','ihres'],
  unser:['unser','unsere','unseren','unserem','unserer','unseres'],
  euer: ['euer','eure','euren','eurem','eurer','eures']
};

function uebsInhalt(worte){
  return worte.filter(w => !UEBS_FUELLWORTE.has(w) && w.length > 1);
}

/* ---------- Arabisch: die Belege ---------- */

/* Trägt das Wort اَلْ? Gemessen am reinen Wort, ohne Endzeichen — und die
   Verschmelzungen mit einer Präposition zählen mit (بِالْ, لِلْ, فِي الْ).
   ⚠️ Ein Wort, das mit ال beginnt, hat nicht immer den Artikel: bei einem
   Eigennamen kann ال Teil des Wortes sein. Falsch herum ist das hier
   ungefährlich — die Bestimmtheitsprüfung unten verlangt zusätzlich, dass
   Muster und Eingabe sich genau in den Artikeln unterscheiden. */
function uebsHatAl(wort){
  const w = String(wort || '').normalize('NFC').replace(/[ً-ْٰۖ-ۭ]/g, '');
  return /^(?:[وفبكل])?(?:ال|اﻟ)/.test(w) || /^لل/.test(w);
}

/* Endet das Wort auf das Possessiv-Yāʾ (ـي, „mein")? Belegt durch
   possessiv-ya-01: „aus رَبُّ wird رَبّي – mein Herr".
   ⚠️ Nur wo ein Nomen steht: فِي und عَلَى enden auch auf Yāʾ und sind keine
   Besitzangabe. Deshalb die Ausnahmeliste, und deshalb mindestens vier
   Buchstaben davor — ein zweibuchstabiges Wort auf Yāʾ ist keins. */
const UEBS_KEIN_BESITZ_YA = new Set(['في', 'علي', 'على', 'الذي', 'التي', 'اي', 'هي']);
function uebsHatBesitzYa(wort){
  const w = String(wort || '').normalize('NFC').replace(/[ً-ْٰۖ-ۭ]/g, '');
  if (UEBS_KEIN_BESITZ_YA.has(w)) return false;
  return /ي$/.test(w) && w.length >= 4;
}

/* Die deutsche Bedeutung eines arabischen Wortes — roh, nicht formatiert.
   ⛔ Nachgeschlagen wird über wortKern() wie in uebersetzungFuer() (js/uebung.js):
   zwei verschiedene Normalisierungen für dieselbe Frage wären genau die Sorte
   Fehler, die niemand meldet. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function uebsBedeutung(wort){
  if (typeof wortKern !== 'function') return null;
  const k = wortKern(String(wort || ''));
  if (!k || k.length < 2) return null;
  const quelle = [];
  if (typeof bekannteVokabeln === 'function') quelle.push(...bekannteVokabeln());
  else if (typeof VOCAB_DATA !== 'undefined') quelle.push(...VOCAB_DATA);
  if (typeof FACHBEGRIFF_VOKABELN !== 'undefined') quelle.push(...FACHBEGRIFF_VOKABELN);
  const t = quelle.find(v => v && (wortKern(v.ar || '') === k
                                || wortKern(v.sg || '') === k
                                || wortKern(v.pl || '') === k));
  return (t && t.de) ? String(t.de) : null;
}

/* Aus „das Haus, die Wohnung" wird ['haus','wohnung'] — eine Vokabel hat oft
   mehrere deutsche Fassungen, und jede davon ist richtig. Artikel fliegen
   raus, sonst zählte „das" als Bedeutung. */
function uebsBedeutungsWorte(de){
  const teile = String(de || '').split(/[,;/()]| oder /);
  const raus = [];
  for (const t of teile){
    for (const w of uebsInhalt(uebsWorte(t))) raus.push(uebsStamm(w));
  }
  return [...new Set(raus)];
}

/* Steht eines der deutschen Wörter dieser Vokabel in der Eingabe? */
function uebsStehtDrin(bedeutungen, stammListe){
  return bedeutungen.some(b => stammListe.includes(b));
}

/* Position eines Stammes in einer Wortliste, oder -1. */
function uebsPos(stammListe, stamm){ return stammListe.indexOf(stamm); }

/* Die erste Position, an der irgendeine Fassung dieser Vokabel steht. */
function uebsErstePos(stammListe, bedeutungen){
  let best = -1;
  for (const b of bedeutungen){
    const i = uebsPos(stammListe, b);
    if (i >= 0 && (best < 0 || i < best)) best = i;
  }
  return best;
}

/* ---------- Darf diese Regel genannt werden? ---------- */

/* ⛔ NICHT `rule.ausgeblendet` lesen. js/regeln.js: „Deshalb liest niemand mehr
   rule.ausgeblendet direkt, sondern regelAusgeblendet(rule)." Es gibt zwei
   Stellen, an denen Elias über den Satzmodus einer Regel entscheidet — sein
   Schalter in der App und der Export aus der Regelprüfung —, und es gilt die
   jüngere. Nur diese Funktion weiß das.

   Fehlt die Funktion (Node-Prüfer ohne die App), wird die Regel genannt: der
   Prüfer soll die Zuordnung testen, nicht Elias' Schalterstand. */
function uebsRegelErlaubt(id){
  if (!id) return false;
  if (typeof regelArt === 'function' && !regelArt(id)) return false;
  if (typeof regelAusgeblendet === 'function' && typeof grammatikRegel === 'function'){
    const r = grammatikRegel(id);
    if (r && regelAusgeblendet(r)) return false;
  }
  return true;
}

function uebsRegelName(id){
  if (typeof regelText === 'function'){
    const t = regelText(id);
    if (t && t.name) return t.name;
  }
  return id;
}

/* ---------- Die sieben Prüfungen ---------- */

/* Jede bekommt denselben Beutel und legt ihren Befund hinein — oder nichts.
   `art` ist die Kennung für den Prüfer, `text` der Satz für Elias, `regelId`
   die Regel dahinter (oder null bei reiner Vollständigkeit). */

function uebsBefund(art, text, regelId){
  return { art, text, regelId: regelId || null };
}

/* 1 — WORT AUSGELASSEN. Kein Grammatikfehler, deshalb ohne Regel.
   Beleg: ein arabisches Wort des Satzes hat eine Vokabel, deren deutsche
   Bedeutung im Muster steht, in seiner Eingabe aber nicht.
   ⚠️ Beides muss zutreffen. Nur „steht nicht in der Eingabe" reichte nicht:
   das Muster darf frei übersetzen („im Haus" statt „in dem Haus"), und ein
   Wort, das das Muster selbst nicht benutzt, kann er nicht auslassen. */
function uebsPruefeAuslassung(k){
  const fehlen = [];
  for (const z of k.zeilen){
    const wort = z.rein || z.wort;
    if (!wort) continue;
    const de = uebsBedeutung(wort);
    if (!de) continue;
    const bed = uebsBedeutungsWorte(de);
    if (!bed.length) continue;
    if (!uebsStehtDrin(bed, k.musterStamm)) continue;   // das Muster benutzt es nicht
    if (uebsStehtDrin(bed, k.eingabeStamm)) continue;   // er hat es
    fehlen.push({ wort, de });
  }
  if (fehlen.length){
    const liste = fehlen.map(f => `${f.wort} (${f.de})`).join(' · ');
    return uebsBefund('ausgelassen',
      fehlen.length === 1
        ? `Ein Wort fehlt: ${liste}. Jedes Wort des arabischen Satzes muss in der Übersetzung vorkommen.`
        : `${fehlen.length} Wörter fehlen: ${liste}. Jedes Wort des arabischen Satzes muss in der Übersetzung vorkommen.`,
      null);
  }

  /* ⭐⭐ ZWEITER ZWEIG — und er ist der wichtigere (22.09.2026, nach der Messung).

     Der Zweig darüber nennt das arabische Wort mit dazu und ist deshalb die
     bessere Rückmeldung. Er setzt aber voraus, dass zu dem Wort eine Vokabel
     im Bestand steht — und das ist oft nicht so: Eigennamen, Wörter aus
     späteren Kapiteln, freier übersetzte Stellen.

     ⛔ Gemessen an 214 Störfällen (letztes Wort gestrichen): mit dem
     Vokabelzweig ALLEIN wurden nur 58 % erkannt. Die übrigen 42 % gingen als
     „ich weiß nicht, woran es liegt" durch, obwohl schlicht ein Wort fehlte —
     das ist eine Auslassung, die ich benennen KANN, also muss ich sie benennen.

     ⚠️ Hier steht trotzdem keine Regel dran, und das bleibt so: ein fehlendes
     Wort ist Vollständigkeit, keine Grammatik. */
  const fehlendeWorte = [];
  const gesehen = new Set();
  for (const w of k.musterInhalt){
    const st = uebsStamm(w);
    if (gesehen.has(st)) continue;
    gesehen.add(st);
    if (!k.eingabeStamm.includes(st)) fehlendeWorte.push(w);
  }
  if (!fehlendeWorte.length) return null;
  const liste = fehlendeWorte.map(w => `„${w}"`).join(' · ');
  return uebsBefund('ausgelassen',
    fehlendeWorte.length === 1
      ? `In deiner Übersetzung fehlt ${liste}. Jedes Wort des arabischen Satzes muss vorkommen.`
      : `In deiner Übersetzung fehlen ${fehlendeWorte.length} Wörter: ${liste}. Jedes Wort des arabischen Satzes muss vorkommen.`,
    null);
}

/* 2 — ADJEKTIV STATT AUSSAGE (nat-bestimmtheit-01).
   Beleg: die Analyse hat im Satz eine Rolle خَبَر vergeben — der Satz IST also
   eine Aussage —, und in seiner Übersetzung steht keine Form von „sein".
   Die Regel sagt es wörtlich: مَسْجِدٌ كَبِيرٌ heißt nur „eine große Moschee",
   الْمَسْجِدُ كَبِيرٌ heißt „Die Moschee ist groß".
   ⚠️ Nur wenn das MUSTER eine Kopula hat. Manche Sätze kommen ohne aus
   („Woher kommt Ammar?"), und dort wäre das Fehlen richtig. */
function uebsPruefeAussage(k){
  const musterHat  = k.musterWorte.some(w => UEBS_KOPULA.has(w));
  const eingabeHat = k.eingabeWorte.some(w => UEBS_KOPULA.has(w));
  if (!musterHat || eingabeHat) return null;

  /* ⭐⭐ DER BEFUND UND SEIN REGELNAME SIND ZWEI VERSCHIEDENE FRAGEN.

     Dass das „ist" fehlt, steht fest, sobald das Muster eines hat und seine
     Übersetzung keines — dafür braucht es keine Analyse. Ob das an
     nat-bestimmtheit-01 liegt, steht erst fest, wenn die Analyse im Satz
     wirklich einen خَبَر gefunden hat.

     ⛔ Die erste Fassung hat beides an dieselbe Bedingung gehängt und damit den
     halben Befund verschenkt: 179 Störfälle, nur 57 % erkannt. Der Rest lief
     als „ich weiß nicht, woran es liegt" durch, obwohl das „ist" nachweislich
     fehlte. Großzügig beim Richtigzählen, streng beim Benennen — das heißt
     nicht, den Fehler zu verschweigen, sondern die REGEL nicht zu behaupten.
     [[zahlen_ohne_beleg]] */
  const hatKhabar = k.zeilen.some(z => /خَبَر/.test(String(z.rolle || '')));
  return uebsBefund('aussage',
    hatKhabar
      ? 'Das ist eine Wortgruppe, kein Satz — das „ist" fehlt. Der arabische Satz hat einen خَبَر, also eine Aussage über das Subjekt: nicht „die große Moschee", sondern „die Moschee ist groß".'
      : 'Das „ist" fehlt — so ist es eine Wortgruppe und kein Satz.',
    hatKhabar ? 'nat-bestimmtheit-01' : null);
}

/* 3 — BESTIMMTHEIT (al-tanwin-tilgung-01).
   Beleg: der arabische Satz enthält mindestens ein Wort mit اَلْ oder eines mit
   Tanwīn, und seine Artikel weichen vom Muster ab.
   ⛔ STRENG: gezählt wird, nicht geraten. Der Befund feuert nur, wenn Muster
   und Eingabe gleich viele Inhaltswörter haben — sonst ist die Abweichung
   Folge eines anderen Fehlers, und ein zweiter Regelname obendrauf verwirrt
   mehr, als er erklärt. [[kandidatenliste_ist_keine_fehlerliste]] */
function uebsPruefeBestimmtheit(k){
  const hatAl  = k.zeilen.some(z => uebsHatAl(z.rein || z.wort));
  const hatTan = k.zeilen.some(z => /[ًٌٍ]/.test(String(z.wort || '')));
  if (!hatAl && !hatTan) return null;
  if (k.musterInhalt.length !== k.eingabeInhalt.length) return null;

  const zaehle = (worte, menge) => worte.filter(w => menge.has(w)).length;
  const mB = zaehle(k.musterWorte,  UEBS_BESTIMMT);
  const eB = zaehle(k.eingabeWorte, UEBS_BESTIMMT);
  const mU = zaehle(k.musterWorte,  UEBS_UNBESTIMMT);
  const eU = zaehle(k.eingabeWorte, UEBS_UNBESTIMMT);
  if (mB === eB && mU === eU) return null;

  const zuUnbestimmt = eB < mB && eU > mU;
  const zuBestimmt   = eB > mB && eU < mU;
  if (!zuUnbestimmt && !zuBestimmt) return null;

  return uebsBefund('bestimmtheit',
    zuUnbestimmt
      ? 'Die Bestimmtheit stimmt nicht: im Arabischen steht اَلْ, also „der/die/das" — du hast „ein/eine" geschrieben. اَلْ und Tanwīn schließen einander aus, das eine ist bestimmt, das andere unbestimmt.'
      : 'Die Bestimmtheit stimmt nicht: das Wort trägt Tanwīn und kein اَلْ, also „ein/eine" — du hast „der/die/das" geschrieben. اَلْ und Tanwīn schließen einander aus.',
    'al-tanwin-tilgung-01');
}

/* 4 — IḌĀFA GEDREHT (mudaf-ilayh-01).
   Beleg: die Analyse hat ein Paar مُضَاف + مُضَاف إِلَيْه gefunden, beide
   Wörter haben eine Vokabel, und in seiner Eingabe stehen sie in der
   umgekehrten Reihenfolge wie im Muster.
   Die Regel: „كِتابُ الْمُدَرِّسِ – das Buch des Lehrers", also erst das
   Besessene, dann der Besitzer. Wer dreht, macht daraus „der Lehrer des Buches".
   ⭐ Dieser Befund ist der sauberste von allen, weil er nicht am Wortlaut hängt,
   sondern an zwei POSITIONEN — und die lassen sich zählen. */
function uebsPruefeIdafa(k){
  for (let i = 0; i < k.zeilen.length - 1; i++){
    const a = k.zeilen[i], b = k.zeilen[i + 1];
    if (!/\(مُضَاف\)/.test(String(a.rolle || ''))) continue;
    if (!String(b.rolle || '').startsWith('مُضَاف إِلَيْه')) continue;

    const bedA = uebsBedeutungsWorte(uebsBedeutung(a.rein || a.wort));
    const bedB = uebsBedeutungsWorte(uebsBedeutung(b.rein || b.wort));
    if (!bedA.length || !bedB.length) continue;

    const mA = uebsErstePos(k.musterStamm,  bedA), mB2 = uebsErstePos(k.musterStamm,  bedB);
    const eA = uebsErstePos(k.eingabeStamm, bedA), eB2 = uebsErstePos(k.eingabeStamm, bedB);
    if (mA < 0 || mB2 < 0 || eA < 0 || eB2 < 0) continue;
    /* Im Muster muss die Reihenfolge überhaupt erkennbar sein. */
    if (mA === mB2 || eA === eB2) continue;
    if ((mA < mB2) === (eA < eB2)) continue;   // gleiche Reihenfolge, alles gut

    return uebsBefund('idafa',
      `Die إِضَافَة steht verkehrt herum. ${a.rein || a.wort} ist der مُضَاف und kommt zuerst, ${b.rein || b.wort} ist der مُضَافٌ إِلَيْهِ — der Besitzer, und der steht im Deutschen hinten: „das Buch des Lehrers", nicht „der Lehrer des Buches". Das zweite Wort ist immer مَجْرُور, daran erkennt man es.`,
      'mudaf-ilayh-01');
  }
  return null;
}

/* 5 — FALSCHER BESITZER (possessiv-ya-01).
   Beleg: ein Wort des Satzes endet auf ـي, das Muster sagt „mein", seine
   Eingabe sagt „dein/sein/ihr/unser/euer".
   ⚠️ Nur wenn das Muster wirklich „mein" benutzt: manche Sätze umschreiben
   den Besitz, und dann wäre das Fehlen kein Fehler. */
function uebsPruefeBesitzer(k){
  const traeger = k.zeilen.find(z => uebsHatBesitzYa(z.rein || z.wort));
  if (!traeger) return null;
  const hat = (worte, formen) => worte.some(w => formen.includes(w));
  if (!hat(k.musterWorte, UEBS_BESITZ.mein)) return null;
  if (hat(k.eingabeWorte, UEBS_BESITZ.mein)) return null;

  for (const [wessen, formen] of Object.entries(UEBS_BESITZ)){
    if (wessen === 'mein') continue;
    if (!hat(k.eingabeWorte, formen)) continue;
    return uebsBefund('besitzer',
      `Der falsche Besitzer: ${traeger.rein || traeger.wort} endet auf ـي, und das heißt „mein" — nicht „${wessen}". Aus رَبُّ wird رَبِّي „mein Herr".`,
      'possessiv-ya-01');
  }
  return null;
}

/* 6 — GENUS (isara-genus-kongruenz-01).
   Beleg: der Satz enthält ein Hinweiswort (هَذَا / هَذِهِ / ذَلِكَ / تِلْكَ),
   und seine Form davon weicht von der des Musters ab.
   ⛔ Verglichen wird mit dem MUSTER, nicht mit dem arabischen Genus — und das
   ist der Punkt. هَذَا الْبَيْتُ heißt „dieses Haus", nicht „dieser Haus": im
   Deutschen richtet sich die Form nach dem deutschen Wort. Wer hier vom
   Arabischen aus prüft, meldet einen Fehler, wo keiner ist. Das Muster ist die
   einzige Quelle, die beide Sprachen kennt. */
const UEBS_ISARA = /^(?:و?)(?:هذا|هذه|ذلك|تلك|هؤلاء|أولئك|اولئك)$/;
function uebsPruefeGenus(k){
  const hin = k.zeilen.find(z => UEBS_ISARA.test(
    String(z.rein || z.wort || '').normalize('NFC').replace(/[ً-ْٰ]/g, '')));
  if (!hin) return null;
  const mForm = k.musterWorte.find(w => UEBS_HINWEIS.has(w) && w !== 'das');
  const eForm = k.eingabeWorte.find(w => UEBS_HINWEIS.has(w) && w !== 'das');
  if (!mForm || !eForm || mForm === eForm) return null;
  if (uebsStamm(mForm) === uebsStamm(eForm)) return null;
  return uebsBefund('genus',
    `Das Hinweiswort passt nicht: es heißt „${mForm}", nicht „${eForm}". Im Arabischen richtet es sich nach dem Geschlecht des Wortes, auf das gezeigt wird — هَذَا bei männlichen, هَذِهِ bei weiblichen —, und im Deutschen nach dem deutschen Wort.`,
    'isara-genus-kongruenz-01');
}

/* 7 — ADJEKTIV AM FALSCHEN WORT (nat-wen-beschreibt-01).
   Beleg: die Analyse hat ein نَعْت gefunden, uebungBezugswort() nennt das Wort,
   zu dem es gehört, beide haben eine Vokabel — und in seiner Eingabe steht das
   Adjektiv näher an einem ANDEREN Nomen des Satzes als an seinem eigenen.
   Die Regel führt es am Satz des Lehrers vor: هُوَ اِبْنُ الْمُدِيرِ الْجَدِيدِ
   heißt „der Sohn des neuen Direktors", weil الْجَدِيدِ wie الْمُدِيرِ مَجْرُور
   ist; mit الْجَدِيدُ hieße es „der Sohn des Direktors ist neu".
   ⚠️ Gemessen wird der ABSTAND, nicht die Reihenfolge: „mein neuer Mitschüler"
   und „ein neuer Student" unterscheiden sich genau darin, neben welchem Nomen
   das Adjektiv steht. */
function uebsPruefeAdjektivBezug(k){
  if (typeof uebungBezugswort !== 'function') return null;
  for (let i = 0; i < k.zeilen.length; i++){
    const z = k.zeilen[i];
    if (!/نَعْت/.test(String(z.rolle || ''))) continue;
    const bezug = uebungBezugswort(k.zeilen, i, null);
    if (!bezug) continue;

    const bedAdj   = uebsBedeutungsWorte(uebsBedeutung(z.rein || z.wort));
    const bedBezug = uebsBedeutungsWorte(uebsBedeutung(bezug));
    if (!bedAdj.length || !bedBezug.length) continue;

    const pAdj   = uebsErstePos(k.eingabeStamm, bedAdj);
    const pBezug = uebsErstePos(k.eingabeStamm, bedBezug);
    if (pAdj < 0 || pBezug < 0) continue;

    /* Gibt es ein anderes Nomen des Satzes, das in seiner Eingabe NÄHER am
       Adjektiv steht als das Bezugswort? Nur dann ist etwas belegt. */
    let naeher = null;
    for (const andere of k.zeilen){
      const w = andere.rein || andere.wort;
      if (!w || w === bezug || w === (z.rein || z.wort)) continue;
      const bedX = uebsBedeutungsWorte(uebsBedeutung(w));
      if (!bedX.length) continue;
      const pX = uebsErstePos(k.eingabeStamm, bedX);
      if (pX < 0) continue;
      if (Math.abs(pX - pAdj) < Math.abs(pBezug - pAdj)) naeher = w;
    }
    if (!naeher) continue;

    /* Gegenprobe am Muster: dort muss das Adjektiv bei SEINEM Wort stehen,
       sonst übersetzt das Muster selbst frei und der Befund wäre falsch. */
    const mAdj   = uebsErstePos(k.musterStamm, bedAdj);
    const mBezug = uebsErstePos(k.musterStamm, bedBezug);
    if (mAdj < 0 || mBezug < 0) continue;
    const bedN = uebsBedeutungsWorte(uebsBedeutung(naeher));
    const mN   = uebsErstePos(k.musterStamm, bedN);
    if (mN >= 0 && Math.abs(mN - mAdj) < Math.abs(mBezug - mAdj)) continue;

    return uebsBefund('adjektivbezug',
      `Das Adjektiv beschreibt das falsche Wort: ${z.rein || z.wort} gehört zu ${bezug}, nicht zu ${naeher}. Im Arabischen zeigt die Endung, wen ein نَعْتٌ beschreibt — es stimmt mit seinem Wort in Fall, Zahl, Geschlecht und Bestimmtheit überein.`,
      'nat-wen-beschreibt-01');
  }
  return null;
}

/* ---------- Die Prüfung ---------- */

/* Die Reihenfolge ist die Rangfolge: was weiter oben steht, erklärt mehr.
   Ein ausgelassenes Wort ist der gröbste Fall und kommt zuerst; die
   Bestimmtheit ist der feinste und kommt zuletzt. */
const UEBS_PRUEFUNGEN = [
  uebsPruefeAuslassung,
  uebsPruefeIdafa,
  uebsPruefeAdjektivBezug,
  uebsPruefeBesitzer,
  uebsPruefeGenus,
  uebsPruefeAussage,
  uebsPruefeBestimmtheit
];

/* ⭐ Wann gilt eine Übersetzung als richtig?
   Wenn jedes Inhaltswort des Musters in der Eingabe vorkommt UND keine der
   sieben Prüfungen etwas gefunden hat. Nicht verlangt werden: dieselbe
   Wortstellung, dieselben Füllwörter, dieselbe Groß- und Kleinschreibung,
   dieselben Satzzeichen. Das ist die großzügige Hälfte des Grundsatzes.

   ⚠️ „Jedes Inhaltswort" heißt: jedes Wort des Musters, das keine Vokabel im
   Satz hat, muss ebenfalls da sein — sonst könnte er den halben Satz weglassen,
   solange die Vokabeln stimmen. */
function uebersetzungPruefen(satz, zeilen, eingabe){
  const muster = String((satz && satz.sentDe) || '').trim();
  const roh    = String(eingabe == null ? '' : eingabe).trim();

  if (!muster){
    return { richtig: false, leer: false, ohneMuster: true, befunde: [], muster: '',
             text: 'Zu diesem Satz ist keine Musterübersetzung hinterlegt — deshalb kann hier nichts geprüft werden.' };
  }
  if (!roh){
    return { richtig: false, leer: true, befunde: [], muster,
             text: 'Da steht noch nichts. Schreib die Übersetzung ins Feld, dann prüfe ich sie.' };
  }

  const k = {
    zeilen: Array.isArray(zeilen) ? zeilen : [],
    musterWorte:  uebsWorte(muster),
    eingabeWorte: uebsWorte(roh)
  };
  k.musterStamm   = k.musterWorte.map(uebsStamm);
  k.eingabeStamm  = k.eingabeWorte.map(uebsStamm);
  k.musterInhalt  = uebsInhalt(k.musterWorte);
  k.eingabeInhalt = uebsInhalt(k.eingabeWorte);

  const fehlend = uebsInhalt(k.musterWorte).map(uebsStamm)
    .filter(s => !k.eingabeStamm.includes(s));

  const befunde = [];
  for (const p of UEBS_PRUEFUNGEN){
    let b = null;
    /* ⛔ Eine kaputte Einzelprüfung darf die anderen nicht mitnehmen — dieselbe
       Vorsichtsmaßnahme wie in uebungenAufbauen(). */
    try { b = p(k); } catch(e){ b = null; }
    if (b) befunde.push(b);
  }

  const richtig = !fehlend.length && !befunde.length;

  /* Nichts erkannt, aber auch nicht richtig — Elias' ausdrücklich verlangter
     Zweig. Hier wird NICHT geraten. [[zahlen_ohne_beleg]] */
  const ratlos = !richtig && !befunde.length;

  return { richtig, leer: false, ratlos, befunde, muster,
           fehlend: fehlend.length,
           text: richtig ? 'Richtig.' : null };
}

/* Die Rückmeldung als fertiger Text — was falsch ist, warum, und die richtige
   Übersetzung. Die Regelnamen stehen dabei, und zwar nur die, die im Satzmodus
   auch gelten dürfen (siehe uebsRegelErlaubt). */
function uebersetzungRueckmeldung(erg){
  if (!erg) return '';
  if (erg.richtig) return 'Richtig.';
  if (erg.leer || erg.ohneMuster) return erg.text || '';

  const teile = [];
  if (erg.ratlos){
    teile.push('Das ist nicht die Musterübersetzung, aber ich kann nicht genau sagen, woran es liegt — vielleicht ist es auch nur anders formuliert und trotzdem richtig.');
  } else {
    for (const b of erg.befunde){
      const name = (b.regelId && uebsRegelErlaubt(b.regelId)) ? uebsRegelName(b.regelId) : null;
      teile.push(name ? `${b.text} (Regel: ${name})` : b.text);
    }
  }
  teile.push(`So heißt der Satz: „${erg.muster}"`);
  return teile.join(' ');
}

/* Welche Regelkarte gehört zur Rückmeldung? Die des ersten Befundes, der eine
   nennen darf — „Warum? → Regel" öffnet dann genau die. */
function uebersetzungRegel(erg){
  if (!erg || !erg.befunde) return null;
  for (const b of erg.befunde){
    if (b.regelId && uebsRegelErlaubt(b.regelId)) return b.regelId;
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = {
    uebersetzungPruefen, uebersetzungRueckmeldung, uebersetzungRegel,
    uebsNorm, uebsWorte, uebsStamm, uebsInhalt,
    uebsHatAl, uebsHatBesitzYa, uebsBedeutungsWorte,
    UEBS_PRUEFUNGEN
  };
}
