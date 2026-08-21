#!/usr/bin/env node
/* wartet-auf-elias.mjs — die eine Seite, auf der steht, was IHN betrifft
 * ==========================================================================
 *
 * ⛔⛔ DAS PROBLEM
 *
 * `To-Do Vokabeltrainer.md` ist am 20.08.2026 auf **6615 Zeilen** gewachsen.
 * Die Punkte, die Elias' Entscheidung brauchen, sind darin an mindestens
 * fünfzehn Stellen verstreut — im dauerhaften Abschnitt „🔴 Wartet auf Elias",
 * im obersten Nachtplan, in Tabellenzeilen aus alten Läufen.
 *
 * Sein Auftrag vom 20.08.2026:
 *
 *   „sobald … nur noch das übrig ist was ich erledigen muss in dem
 *    zusammenhang, soll mir die bearbeitung der restlichen aufgaben SEHR
 *    LEICHT gemacht werden und angenehm für mich erledigbar gestaltet werden,
 *    auf dass ich das jedes mal mit so geringem zeit und arbeitaufwand wie nur
 *    möglich erledigen kann."
 *
 * ⭐ Eine Datei mit 6615 Zeilen erfüllt das nicht, egal wie gut sie gepflegt
 * ist. Was fehlt, ist ein ORT, an dem nur das steht, was er entscheiden muss.
 *
 * ================== WAS DIESES WERKZEUG NICHT TUT =========================
 *
 * Es sammelt NICHT jede Zeile mit einem roten Punkt ein. Damit stünden auch
 * längst erledigte Punkte aus alten Läufen darauf, und die Seite wäre beim
 * dritten Mal Lärm. [[kandidatenliste_ist_keine_fehlerliste]]
 *
 * Stattdessen zwei Quellen, beide aktuell:
 *   1. der dauerhafte Abschnitt „🔴 Wartet auf Elias" der Projekt-To-Do
 *   2. die MESSUNGEN der Prüfwerkzeuge — die sind per Definition von heute
 *
 * ⚠️ Was es misst, misst es LIVE. Eine Zahl auf dieser Seite ist nie älter als
 * ihr Aufruf. [[eingefrorenes_feld_ist_kein_zustand]]
 *
 * Aufruf:
 *   node werkzeuge/wartet-auf-elias.mjs              Seite bauen
 *   node werkzeuge/wartet-auf-elias.mjs --zeigen     nur ausgeben, nichts schreiben
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const ARG = process.argv.slice(2);
const NUR_ZEIGEN = ARG.includes('--zeigen');

const TODO = 'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\To-Do Vokabeltrainer.md';

/* ---------- 1. Die Messungen ---------- */
/* ⛔ Ein Werkzeug, das mit Exit != 0 endet, ist hier der NORMALFALL — es hat
   ja etwas gefunden. execFileSync würde darauf werfen. */
function messen(befehl, args = []){
  try {
    return { text: execFileSync(process.execPath, [befehl, ...args],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 20e6 }), code: 0 };
  } catch (e) {
    return { text: (e.stdout || '') + (e.stderr || ''), code: e.status ?? -1 };
  }
}

/* ⛔ Bis zum 20.08.2026 stand hier „über sechstausend Zeilen" als fester Text.
   Gemessen waren es an dem Tag schon 7.228 — und die Angabe wäre still weiter
   veraltet, obwohl die Datei ohnehin gelesen wird und die Zahl gratis ist.
   [[eingefrorenes_feld_ist_kein_zustand]] [[zahlen_ohne_beleg]] */
const TODO_ZEILEN = (() => {
  try { return fs.readFileSync(TODO, 'utf8').split(String.fromCharCode(10)).length; }
  catch (e) { return 0; }
})();

const posten = [];

/* A) Die offenen Feldangaben — dieselbe Quelle wie die Fragenseite. */
{
  const tmp = path.join(REPO, '.wartet-fragen.json');
  messen(path.join(REPO, 'werkzeuge', 'vorrat.mjs'), ['--offene-fragen', tmp]);
  let daten = null;
  try { daten = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp); } catch { /* nichts offen */ }
  const fragen = (daten && daten.fragen) || [];
  const anzahl = fragen.reduce((s, f) => s + f.woerter.length, 0);
  const woerter = new Set(fragen.flatMap(f => f.woerter.map(w => String(w.id)))).size;
  const belegt = fragen.reduce((s, f) => s + f.woerter.filter(w => w.beleg).length, 0);
  if (anzahl) posten.push({
    titel: 'Fehlende Angaben an Vokabeln',
    zahl: anzahl,
    einheit: anzahl === 1 ? 'Angabe' : 'Angaben',
    dazu: `an ${woerter} Wörtern`,
    /* ⭐ Die Zahl der BELEGTEN Fragen gehoert dazu — sonst schaetzt die
       Uebersicht den Aufwand zu hoch ein. Bei einer belegten Frage steht die
       Antwort schon auf der Seite; es bleibt Hinsehen statt Tippen. */
    aufwand: `${fragen.length} Durchgänge — einer je Frage, nicht je Wort`
      + (belegt ? `; bei ${belegt} steht die Antwort schon auf der Seite` : ''),
    warum: 'Ohne sie fallen Übungen aus und die Satzanalyse liest den Satz anders.',
    wie: 'Auf der Fragenseite antippen, unten den Text kopieren, in den Chat schicken.',
    seite: 'https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd',
    seiteText: 'Fragenseite öffnen',
    zeilen: fragen.map(f => `${f.woerter.length}× ${f.titel}`)
  });
}

/* Die Gruppenzeilen aus der Ausgabe von pruefe-taschkil.js lesen:
   „=== Haraka fehlt: 7 ===". ⛔ Die Zeile „Regeln mit unvokalisierten
   Woertern" gehoert NICHT dazu — sie zaehlt Regeltexte, nicht Vokabeln, und
   steht auch nicht in der Summe „14 Befunde". */
function gruppenAus(text){
  /* ⛔ Die Gruppe allein („7× Haraka fehlt") sagt ihm nicht, WELCHE Woerter
     betroffen sind — er muesste dafuer in die 7.000-Zeilen-To-Do. Eine Frage
     ohne Anschauung ist keine; dieselbe Luecke wie beim Eselsbruecken-Posten.
     pruefe-taschkil.js schreibt die Woerter ohnehin unter jede Gruppe, als
     erstes Feld der eingerueckten Zeilen. */
  const zeilen = String(text).split(String.fromCharCode(10));
  const raus = [];
  let jetzt = null;
  for (const roh of zeilen){
    const z = roh.replace(String.fromCharCode(13), "");
    /* ⛔ Kein Regex — zum fuenften Mal an diesem Tag haben die Backslashes
       den Weg durch das schreibende Skript nicht ueberlebt: aus (d+) wurde
       (d+), das trifft nichts, und der Posten stand STILL ohne Zeilen da.
       Zeichenweise zerlegen haelt. [[python_backslash_b_wird_backspace]] */
    if (z.startsWith("=== ") && z.endsWith(" ===")){
      const kern = z.slice(4, -4);
      const p = kern.lastIndexOf(": ");
      const zahl = p < 0 ? NaN : Number(kern.slice(p + 2));
      if (p > 0 && Number.isFinite(zahl)){
        /* ⛔ pruefe-taschkil.js stellt Gruppen, die KEIN Mangel sind, das
           Praefix „[kein Mangel] “ voran (Zitierform eines Fachbegriffs, Alif
           at-tanwin). Am 20.08.2026 waren das 12 von 35 — und alle 35 standen
           hier als „Taschkīl-Fragen“. Eine Kandidatenliste, die als Fragenzahl
           auftritt, macht ihm die Arbeit SCHWERER statt leichter.
           [[kandidatenliste_ist_keine_fehlerliste]] */
        const roh0 = kern.slice(0, p);
        const keinMangel = roh0.startsWith("[kein Mangel] ");
        jetzt = { name: keinMangel ? roh0.slice(14) : roh0,
                  zahl, keinMangel, woerter: [] };
        if (!jetzt.name.startsWith("Regeln mit")) raus.push(jetzt); else jetzt = null;
      }
      continue;
    }
    if (!jetzt) continue;
    if (!z.startsWith("  ") || !z.trim()) continue;
    const w = z.trim().split(" ")[0].split(String.fromCharCode(9))[0];
    /* ⛔ Nur ARABISCHE Woerter. Unter einer Gruppe stehen auch Erklaerzeilen;
       ihr erstes Wort ist deutsch und landete sonst in der Liste — gemessen:
       "2× Endung fehlt — أَلْبَان · لِمَن · dem". Ein sichtbarer Unsinn ist ein
       Geschenk; der naechste waere es nicht. [[unmoegliche_zahl_ist_ein_geschenk]] */
    const c = w ? w.charCodeAt(0) : 0;
    if (c < 0x0600 || c > 0x06FF) continue;
    if (w && w !== "Stelle" && !jetzt.woerter.includes(w)) jetzt.woerter.push(w);
  }
  return raus;
}

/* A2) Wörter ohne Eselsbrücke.

   ⛔ Das stand bis zum 20.08.2026 auf dieser Seite GAR NICHT — der Rückstand
   war nur in der Ausgabe von vorrat.mjs sichtbar, die Elias nie zu Gesicht
   bekommt. Ein Posten, den nur das Werkzeug kennt, ist so gut wie keiner.
   [[daten_ohne_zugang]]

   ⚠️ Gemessen aus dem Arbeitsauftrag, nicht aus einer Handliste: welche Wörter
   noch welche brauchen, steht dort je Wort als „hat N, braucht M mehr".
   [[handliste_neben_echter_quelle]] */
{
  const datei = path.join(REPO, '.wartet-auftrag.md');
  let text = '';
  messen(path.join(REPO, 'werkzeuge', 'vorrat.mjs'), ['--auftrag', datei]);
  try { text = fs.readFileSync(datei, 'utf8'); fs.unlinkSync(datei); } catch (e) {}
  const bloecke = text.split(/^## /m).slice(1);
  const offen = bloecke.map(b => {
    const m = /braucht (\d+) mehr/.exec(b);
    if (!m || Number(m[1]) === 0) return null;
    const kopf = b.split('\n')[0];
    const teile = kopf.split(/\s+/);
    return { zahl: Number(m[1]), id: teile[0],
             wort: teile.slice(1).join(' ').replace(/\s+/g, ' ').trim() };
  }).filter(Boolean);
  const summe = offen.reduce((s, o) => s + o.zahl, 0);
  if (summe) posten.push({
    titel: 'Eselsbrücken, die noch fehlen',
    zahl: summe,
    einheit: 'Merkhaken',
    dazu: `an ${offen.length} Wörtern`,
    aufwand: 'eine Entscheidung: brauchst du sie überhaupt?',
    warum: 'Es sind ausschließlich Funktionswörter. Ich habe sie bewusst ausgelassen — '
      + 'sie sind Grundwortschatz und lernen sich über den Gebrauch, nicht über ein Bild.',
    wie: 'Sag „ja, schreib sie" — dann kommen sie beim nächsten Lauf. Sagst du nichts, '
      + 'bleibt es so, und dieser Posten steht hier weiter.',
    /* ⛔ Eine Entscheidung ohne Anschauung ist keine. Er kann nicht wissen, ob
       er sie braucht, ohne EINE gesehen zu haben — deshalb steht hier ein
       belegtes Beispiel statt einer Beschreibung.
       [[eselsbruecken_an_bekanntes_anknuepfen]] [[quranbezug_nur_auswendiges]] */
    beispiel: 'So sähe eine aus — für كَيْفَ: Du kennst es aus dem Vers, den du '
      + 'auswendig kannst. أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَٰبِ ٱلْفِيلِ '
      + '(105:1, al-Fīl) — „Siehst du nicht, WIE dein Herr mit den Leuten des '
      + 'Elefanten verfuhr". Das كَيْفَ steht dort an dritter Stelle und fragt '
      + 'genau danach: nach dem WIE.',
    zeilen: offen.slice(0, 12).map(o => `${o.wort}`)
  });
}

/* B) Taschkīl */
{
  const r = messen(path.join(REPO, 'pruefe-taschkil.js'));
  const m = /^(\d+) Befunde in (\d+)/m.exec(r.text);
  /* ⭐ Die Summenzeile von pruefe-taschkil.js zaehlt ALLE Befunde, auch die
     als „kein Mangel“ gekennzeichneten. Fuer diese Seite gilt nur, was
     wirklich eine Frage an ihn ist — sonst waechst die Zahl, ohne dass mehr
     zu tun waere. */
  const alleGruppen = gruppenAus(r.text);
  const echt = alleGruppen.filter(g => !g.keinMangel);
  const echteBefunde = echt.reduce((n, g) => n + g.zahl, 0);
  const ohneMangel = alleGruppen.filter(g => g.keinMangel).reduce((n, g) => n + g.zahl, 0);
  /* ⚠ Auch die Woerterzahl neu bilden: m[2] zaehlt die Woerter ALLER
     Gruppen. „23 Befunde in 29 Woertern“ waere eine Zahl aus zwei
     verschiedenen Mengen. [[zahlen_ohne_beleg]] */
  /* ⚠ pruefe-taschkil.js zeigt je Gruppe nur die ersten 12 Befunde (ohne
     --alle). Solange keine Gruppe groesser ist, stimmt diese Zahl; danach
     waere sie zu klein. Am 20.08.2026 ist die groesste Gruppe 11.
     [[begrenzung_haelt_messung_nicht_stand]] */
  const gekappt = echt.some(g => g.zahl > g.woerter.length && g.zahl > 12);
  const echteWoerter = new Set(echt.flatMap(g => g.woerter)).size || Number(m[2]);
  if (gekappt) console.log("  ⚠ Eine Taschkil-Gruppe ist groesser als 12 —"
    + " die Woerterzahl unten ist dadurch zu klein. pruefe-taschkil.js --alle.");
  if (m && echteBefunde > 0) posten.push({
    titel: 'Taschkīl-Fragen',
    zahl: echteBefunde,
    einheit: 'Befunde',
    dazu: `in ${echteWoerter} Wörtern` + (ohneMangel ? ` · ${ohneMangel} weitere sind kein Mangel` : ''),
    /* ⛔⛔ GEMESSEN, NICHT AUFGESCHRIEBEN.

       Bis zum 20.08.2026 standen hier drei feste Zeilen und die Angabe „drei
       echte Entscheidungen". Beides war eingefroren und schon überholt:
       مُضَافْ إِلَيهِ war am selben Vormittag als Abzugs-Artefakt entfallen, und
       لِمَن war neu dazugekommen — die Seite zeigte Elias also eine Liste, die
       es so nicht mehr gab. [[eingefrorenes_feld_ist_kein_zustand]]

       ⭐ `pruefe-taschkil.js` gruppiert die Befunde ohnehin und schreibt die
       Gruppen als „=== Name: Zahl ===" in die Ausgabe. Die Zahl der Gruppen
       ist die ehrliche Antwort auf „wie viele Entscheidungen sind es?" —
       innerhalb einer Gruppe entscheidet er einmal für alle.
       [[zahlen_ohne_beleg]] */
    aufwand: echt.length
      ? `${echt.length} Entscheidung(en) — innerhalb einer Gruppe gilt sie für alle`
      : 'nach Gruppen sortiert',
    warum: 'Eine fehlende Ḥaraka ändert die Aussprache und macht die Suche unbrauchbar.',
    /* ⭐ Belege sichtbar machen. Beim Feldangaben-Posten steht schon „bei 31
       steht die Antwort schon auf der Seite"; fuer Taschkil gilt seit dem
       21.08. dasselbe, nur sah man es hier nicht. Eine Hilfe, die niemand
       sieht, hilft nicht. [[flaeche_nur_im_gefuellten_zustand]]
       ⛔ Gezaehlt wird aus data/aussenbelege.json, nicht geschaetzt. Fehlt
       die Datei, faellt der Satz weg statt eine Zahl zu erfinden. */
    wie: (() => {
      let n = 0;
      try {
        const p = path.join(REPO, 'data', 'aussenbelege.json');
        n = Object.keys(JSON.parse(fs.readFileSync(p, 'utf8')).taschkil || {}).length;
      } catch { /* keine Belege geholt */ }
      return 'Je Gruppe eine Entscheidung.'
           + (n ? ` Bei ${n} Befunden steht die Schreibung von en.wiktionary schon daneben — \`node pruefe-taschkil.js\` zeigt sie unter dem Befund.` : '')
           + ' Was ich schon geklärt habe, steht in der To-Do unter „Wartet auf Elias".';
    })(),
    zeilen: alleGruppen.map(g => (g.keinMangel ? '✓ kein Mangel: ' : '') + g.zahl + "× " + g.name + (g.woerter.length ? "  —  " + g.woerter.slice(0, 5).join(" · ") + (g.woerter.length > 5 ? " …" : "") : ""))
  });
}

/* C) Funktionsanzeige */
{
  const r = messen(path.join(REPO, 'pruefe-funktionen.js'));
  const m = /nur „Wort":\s+(\d+)/.exec(r.text);
  if (m && Number(m[1]) > 0) posten.push({
    titel: 'Infokarten, die nur „Wort" sagen',
    zahl: Number(m[1]),
    einheit: 'Wörter',
    dazu: 'alle aus deinen eigenen Vokabeln',
    aufwand: 'ein Durchgang — sie stehen auch auf der Fragenseite',
    warum: 'Die Infokarte kann die Funktion im Satz nicht benennen.',
    wie: 'Löst sich mit der Wortart-Frage auf der Fragenseite von selbst.',
    seite: 'https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd',
    seiteText: 'Fragenseite öffnen'
  });
}

/* C2) Duplikate (A13) */
{
  const r = messen(path.join(REPO, 'pruefe-duplikate.js'));
  /* ⛔ Regex OHNE Escapes: die Backslashes kommen durch den Kanal halbiert
     oder gar nicht an — hier stand erst /=== (d+) Befund/. */
  const m = new RegExp("=== (" + '\\d' + "+) Befund").exec(r.text);
  if (m && Number(m[1]) > 0) posten.push({
    titel: 'Ein Wort steht doppelt',
    zahl: Number(m[1]),
    einheit: Number(m[1]) === 1 ? 'Wort' : 'Wörter',
    dazu: 'eigene Vokabel oder Fachbegriff gegen Buchvokabel',
    aufwand: 'schon entschieden — nur bestätigen, welche echt sind',
    warum: 'Zwei Karteikarten für dasselbe Wort — du lernst es doppelt.',
    wie: 'Deine Regel vom 20.08.: „wenn bei einem kapitel das gleiche wort wie bei eigenen vokabeln ist dann soll meine eigene vokabel weg“. ⛔ Aber nicht jeder Treffer ist ein Duplikat — die Bedeutung steht hinter jedem Eintrag. ظَرْف = Zeit-/Ortsangabe gegen ظَرْفٌ = Umschlag sind zwei verschiedene Wörter.',
    zeilen: r.text.split(String.fromCharCode(10)).filter(z => z.startsWith('  ') && z.includes('(') && z.includes('id ')).slice(0, 4).map(z => z.trim())
  });
}

/* C3) Neun Karten behaupten einen Plural, den es nicht gibt (20.08.2026) */
{
  const r = messen(path.join(REPO, "validate.js"));
  /* ⛔ Regex OHNE Backslash-Escape — siehe C2. [0-9] tut dasselbe wie \d
     und uebersteht den Weg durch ein schreibendes Skript. */
  const m = new RegExp("([0-9]+) Zahlwort").exec(r.text);
  /* Die drei Beispiele stehen in derselben Zeile: „وَاحِدٌ → وَاحِدَةٌ (id 50296)". */
  const zeile = String(r.text).split(String.fromCharCode(10))
    .find(x => x.includes("Zahlwort")) || "";
  const bsp = zeile.split(": ").pop().trim();
  if (m && Number(m[1]) > 0) posten.push({
    titel: '„Plural“ steht an einer Zahl, wo keiner ist',
    zahl: Number(m[1]),
    einheit: Number(m[1]) === 1 ? "Karte" : "Karten",
    dazu: "die Zahlwörter eins bis zehn",
    auswahl: true,
    aufwand: "eine Antwort für alle neun — nicht neunmal dieselbe Frage",
    warum: "Deine Karte zu ثَلَاثَةٌ zeigt „Plural: ثَلَاثٌ“. Das ist kein Plural,"
      + " sondern die Form, die vor einem femininen Gezählten steht"
      + " (ثَلَاثُ نِسَاءٍ gegen ثَلَاثَةُ رِجَالٍ). Bei وَاحِدٌ steht dort die feminine"
      + " Form وَاحِدَةٌ. An drei Stellen der App steht wörtlich „Plural“ davor,"
      + " und mit eingeschalteten Pluralkarten wird daraus eine eigene Karte"
      + " „drei (Plural)“."
      /* ⭐ Die acht offenen gender-Fragen sind DIESELBE Sache: die Gruppe
         „Welches Geschlecht haben diese Wörter?" besteht zu 8 von 8 aus den
         Zahlen 3-10 (am 20.08.2026 ausgezaehlt). Ohne diesen Satz sieht er
         zwei Aufgaben und beantwortet zweimal dasselbe. */
      + " ⭐ Dieselbe Sache steckt hinter den acht offenen Fragen"
      + " „Welches Geschlecht haben diese Wörter?“ auf der Fragenseite — das"
      + " sind genau diese Zahlen. Eine Antwort erledigt beides.",
    /* ⛔ Ich schlage KEINE Beschriftung vor. Wie dein Lehrer diese Form
       nennt, weiss er und nicht ich; eine erfundene Bezeichnung stuende als
       Tatsache auf einer Lernkarte und meldete sich nie.
       [[sein_ist_nicht_wirken]] */
    wie: "Drei Wege, du musst nur einen nennen:  (a) die Zeile bei Zahlen"
      + " weglassen — der Wert bleibt im Datensatz, nur die falsche Beschriftung"
      + " verschwindet;  (b) sie anders beschriften — dann sag mir, wie dein"
      + " Lehrer diese Form nennt;  (c) so lassen, wenn ihr es im Unterricht"
      + " so nutzt. ⛔ Ich habe absichtlich nichts geändert: was dort stehen"
      + " soll, ist eine Frage an deinen Unterricht, nicht an mich.",
    zeilen: bsp ? [bsp] : []
  });
}

/* C2) Bücher, die er anhaken KANN, in denen aber nichts vorbereitet ist.

   Am 21.08.2026 im Browser gemessen: `istBekannt()` und `passtZurAuswahl()`
   fragen SEINE AUSWAHL, nicht die Freischaltung. In den Einstellungen sind
   alle acht Bücher wählbar; `FREIGESCHALTET` kennt nur madina-1 und -2.
   Hakt er bayna-yadayk-1 Kapitel 1 an, bekommt er 27 Karten — 27 davon
   ohne Eselsbrücke und ohne Satz. [[app_auswahl_entscheidet]]

   ⛔⛔ DIE EICHUNG ENTSCHEIDET, OB DER POSTEN ERSCHEINT.
   madina-1 ist lückenlos: 298 Wörter, 0 ohne Eselsbrücke, 0 ohne Satz —
   dreifach gemessen am 21.08. Kommt hier etwas anderes heraus, misst das
   Werkzeug nicht, was es zu messen behauptet, und der Posten bleibt weg.
   Lieber kein Posten als eine falsche Zahl auf seiner Seite.

   ⚠️ `vocab-data.js` MUSS dabei sein: dort tragen 171 Wörter ihr `mnemo`
   und `sentAr` direkt am Eintrag. Ohne die Datei meldet dieselbe Rechnung
   158 Lücken in madina-1, die es nicht gibt — am 21.08. genau so passiert.
   [[dritte_satzquelle]] [[unmoegliche_zahl_ist_ein_geschenk]] */
{
  const kiste = { window: {} }; kiste.globalThis = kiste; vm.createContext(kiste);
  const ladeIn = rel => { const f = path.join(REPO, rel);
    if (!fs.existsSync(f)) return false;
    try { vm.runInContext(fs.readFileSync(f, "utf8"), kiste, { filename: rel }); return true; }
    catch { return false; } };
  const holen = n => { try { return vm.runInContext(
    "typeof " + n + " !== \"undefined\" ? " + n + " : null", kiste); } catch { return null; } };

  ladeIn("vocab-data.js");
  ladeIn("data/eselsbruecken.js");
  ladeIn("data/beispielsaetze.js");
  fs.readdirSync(path.join(REPO, "data"))
    .filter(f => /^vokabeln-.*\.js$/.test(f)).forEach(f => ladeIn("data/" + f));

  const ES  = holen("BUCH_ESELSBRUECKEN") || {};
  const SAE = holen("BEISPIELSAETZE") || {};
  const VD  = new Map((holen("VOCAB_DATA") || []).map(w => [String(w.id), w]));
  const BUCH = kiste.window.VOKABELN || {};

  const zaehle = liste => {
    let ohneE = 0, ohneS = 0;
    for (const w of liste){
      const v = VD.get(String(w.id)) || {};
      if (!ES[w.id] && !v.mnemo) ohneE++;
      if (!(SAE[w.id] && SAE[w.id].sentAr) && !v.sentAr && !w.sentAr) ohneS++;
    }
    return { n: liste.length, ohneE, ohneS };
  };

  const eich = zaehle(BUCH["madina-1"] || []);
  const eichungOk = eich.n === 298 && eich.ohneE === 0 && eich.ohneS === 0;

  if (!eichungOk){
    console.error("  ⚠️ Eichung madina-1 fehlgeschlagen ("
      + eich.n + " Wörter, " + eich.ohneE + " ohne Eselsbrücke, " + eich.ohneS
      + " ohne Satz) - der Posten rohe Buecher wird NICHT gezeigt.");
  } else {
    const rohe = [];
    for (const [slug, liste] of Object.entries(BUCH)){
      if (slug === "madina-1") continue;
      const e = zaehle(liste || []);
      if (e.ohneE || e.ohneS) rohe.push({ slug, ...e });
    }
    const summe = rohe.reduce((s, r) => s + r.n, 0);
    if (rohe.length) posten.push({
      titel: "Andere Bücher: anhakbar, aber leer",
      zahl: summe, einheit: "Wörter", dazu: rohe.length + " Bücher", auswahl: true,
      aufwand: "nichts tun ist in Ordnung — du sollst nur wissen, was passiert",
      warum: "Die Buchauswahl in den Einstellungen zeigt alle acht Bücher, aber vorbereitet"
        + " ist nur Madina 1 (298 Wörter, 24 von 24 Kapiteln lückenlos). Hakst du eines der"
        + " anderen an, kommen die Karten ohne Eselsbrücke und ohne Beispielsatz —"
        + " und ohne Satz gibt es auch keine Markierung und keine Übungsaufgabe."
        + " Die Freischaltung bremst das nicht: seit v282 entscheidet deine Auswahl.",
      wie: "Wenn dich das stört, sag Bescheid — dann baue ich einen Hinweis in die"
        + " Buchauswahl, etwa „Bayna Yadayk 1 · 231 Karten, noch keine Eselsbrücken“."
        + " Ich habe ihn NICHT gebaut: das ist App-Code und eine Geschmacksfrage.",
      seite: "", seiteText: "",
      zeilen: rohe.sort((a, b) => b.n - a.n)
        .map(r => r.slug + ": " + r.n + " Wörter, " + r.ohneE + " ohne Eselsbrücke, " + r.ohneS + " ohne Satz")
    });
  }
}

/* C3) Eine fertige Funktion, die niemand erreichen kann.

   `paketLoeschen()` steht in js/vokabelpaket.js:64 und wird NIRGENDS
   aufgerufen — am 21.08.2026 über das ganze Repo gegrept, ohne Klammern,
   damit auch eine Übergabe als Referenz aufgefallen wäre.
   [[funktion_als_referenz_sieht_tot_aus]] [[werkzeug_ohne_aufrufer]]

   ⚠️ LIVE geprüft, nicht fest eingetragen: bekommt sie einen Aufrufer,
   verschwindet der Posten von selbst. [[eingefrorenes_feld_ist_kein_zustand]] */
{
  const quelle = path.join(REPO, "js", "vokabelpaket.js");
  if (fs.existsSync(quelle) && /function paketLoeschen\s*\(/.test(fs.readFileSync(quelle, "utf8"))){
    let aufrufer = 0;
    const suchen = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        if (e.name === ".deploy" || e.name === "node_modules" || e.name === ".git") continue;
        const voll = path.join(dir, e.name);
        if (e.isDirectory()){ suchen(voll); continue; }
        if (!/\.(js|html)$/.test(e.name)) continue;
        const txt = fs.readFileSync(voll, "utf8");
        for (const m of txt.matchAll(/paketLoeschen/g)){
          const um = txt.slice(Math.max(0, m.index - 12), m.index);
          if (!/function\s*$/.test(um)) aufrufer++;
        }
      }
    };
    suchen(path.join(REPO, "js"));
    /* Und die Wurzel, aber NUR die .html/.js dort - nicht data/ mit
       seinen Megabytes. */
    for (const e of fs.readdirSync(REPO, { withFileTypes: true })){
      if (!e.isFile() || !/.(js|html)$/.test(e.name)) continue;
      const txt = fs.readFileSync(path.join(REPO, e.name), "utf8");
      for (const m of txt.matchAll(/paketLoeschen/g)){
        const um = txt.slice(Math.max(0, m.index - 12), m.index);
        if (!/functions*$/.test(um)) aufrufer++;
      }
    }
    if (!aufrufer) posten.push({
      titel: "Vokabelpaket löschen: fertig, aber kein Knopf",
      zahl: 1, einheit: "Entscheidung", dazu: "js/vokabelpaket.js:64", auswahl: true,
      aufwand: "ja oder nein sagen — den Knopf baue ich in zehn Minuten",
      warum: "Die Funktion zum Entfernen eines geladenen Vokabelpakets ist fertig und"
        + " getestet, aber sie wird von nirgendwo aufgerufen. Es gibt also derzeit"
        + " keinen Weg, ein Paket wieder loszuwerden, ohne den Browserspeicher zu leeren.",
      wie: "Sag mir, ob du den Knopf willst und wo er hin soll — Einstellungen oder"
        + " direkt neben der Paketanzeige.",
      seite: "", seiteText: ""
    });
  }
}

/* D) Gestaltungsentscheidungen — sie warten, ohne dass ein Werkzeug sie misst. */
/* ⚠️⚠️ DIESE ZWEI POSTEN HABEN AM 20.08. IHRE FRAGE GEWECHSELT, und ein Posten,
   der stillsteht, waehrend sich die Lage bewegt, macht ihm Arbeit vor, die es
   nicht mehr gibt. Beides ist belegt, nicht vermutet:

     Schrift  — er hat am 20.08. entschieden: „das will ich" (Scheherazade New),
                „aber die farbe muss noch schöner sein".
     Farben   — die fuenf, die ihm gefielen, stehen seit v282 im Farbwaehler der
                App (AKZENT_FARBEN in js/darstellung.js). Er braucht keine
                Vergleichsseite mehr, er hat sie in der Hand.

   ⛔ Beim naechsten Mal zuerst pruefen, ob die FRAGE noch stimmt — nicht nur,
   ob sie beantwortet ist. [[eingefrorenes_feld_ist_kein_zustand]] */
posten.push({
  titel: 'Wortmarke: welche Farbe?',
  zahl: 1, einheit: 'Entscheidung', dazu: 'Schrift steht bereits', auswahl: true,
  aufwand: 'eine Farbe nennen, den Rest baue ich',
  warum: 'Die Schrift hast du gewählt (Scheherazade New) und dazu gesagt: „die farbe muss noch schöner sein". Sobald sie feststeht, wird die Marke zu einem SVG-Pfad — dann bleibt die App unabhängig von Google.',
  wie: 'Eine der fünf Akzentfarben aus deinen Einstellungen nennen, oder eine eigene.',
  seite: 'https://claude.ai/code/artifact/21463a39-a852-43e0-ad80-7c3bbf78714b',
  seiteText: 'Die Schriftentwürfe'
});
posten.push({
  titel: 'Akzentfarbe: welche wird es?',
  zahl: 5, einheit: 'Farben', dazu: 'seit v282 in den Einstellungen', auswahl: true,
  aufwand: 'in der App antippen — kein Artefakt nötig',
  warum: 'Torch Red erreicht 4,47 Kontrast am ungünstigsten Ort, knapp unter der Schwelle 4,5. Cyan käme auf 9,54, Azure auf 4,71.',
  wie: 'Einstellungen öffnen, Farbe antippen, sie wirkt sofort. „BISHER" markiert die alte.',
  seite: '',
  seiteText: ''
});
posten.push({
  /* ⭐ Am 21.08. dreifach nachgemessen — und der Posten fängt damit früher an
     als gedacht: es geht nicht um die BESTE Stimme, sondern erst einmal um
     eine überhaupt. SAPI kennt 2 (Hedda de-DE, Zira en-US), OneCore 3 (alle
     de-DE), und `speechSynthesis.getVoices()` im Browser — die Liste, die für
     die App zählt — liefert 3 Stimmen, davon 0 arabische. */
  titel: 'Arabische Stimme: erst installieren, dann hören',
  zahl: 0, einheit: 'arabische Stimmen', dazu: 'im Browser gemessen', auswahl: true,
  aufwand: 'einmal in den Windows-Einstellungen, kostenlos',
  warum: 'Auf deinem PC ist KEINE arabische Stimme — dreifach gemessen (SAPI, OneCore, speechSynthesis im Browser). Die App kann heute gar nicht arabisch sprechen; das ist keine Frage der Qualität.',
  wie: 'Einstellungen → Zeit und Sprache → Sprache und Region → Sprache hinzufügen → Arabisch → Optionen → Sprachausgabe. Danach sage ich dir in zehn Sekunden, ob sie deine Ḥarakāt liest: رَجُلٌ gegen رِجْلٌ. Spricht sie beide gleich, ist sie unbrauchbar — und eine kostenlose, die sie liest, schlägt jede bezahlte, die rät.',
  seite: 'https://claude.ai/code/artifact/15b48598-2cda-4516-81bd-6a7e730dd4cc',
  seiteText: 'Der Bericht'
});

/* ⛔⛔ REGELKANDIDATEN — der Posten, der bis zum 20.08.2026 fehlte.

   Elias' Auftrag nennt die Routinen ausdruecklich „vor allem bezogen auf die
   NEUEN REGELN und Vokabeln". Fuer die Vokabeln gibt es die Fragenseite; fuer
   die Regeln gibt es die Freigabeseite — und die stand auf KEINER Liste.
   Gemessen am 20.08.: 45 Fundstellen aus den Folgen 14, 15 und 16 warteten
   auf seine Freigabe, und seine Seite „Was auf dich wartet" wusste nichts
   davon, obwohl sie verspricht, ALLE offenen Entscheidungen zu zeigen.

   ⚠️ Gezaehlt werden die Kandidaten aus transcripts/kandidaten/folge-*.json
   MINUS dem, was in entscheidungen.json schon beantwortet ist. Ohne diesen
   Abzug meldete der Posten dieselbe Zahl weiter, nachdem er geantwortet hat —
   und ein Posten, der sich nie bewegt, wird nach dem dritten Mal ueberlesen.
   [[erledigt_heisst_nicht_wertlos]] */
try {
  const kand = path.join(REPO, 'transcripts', 'kandidaten');
  const dateien = fs.existsSync(kand)
    /* ⛔ KEIN Regex hier. Ein Muster mit Backslashes ueberlebt den Weg durch
       ein Skript, das dieses Skript schreibt, nicht: aus /^folge-d+/ wurde
       beim Einbau /^folge-d+/, und das trifft NICHTS. Der Posten blieb
       lautlos leer, weil 0 Kandidaten kein Fehler sind.
       [[python_backslash_b_wird_backspace]] [[ausfall_ist_unsichtbar_gebaut]] */
    ? fs.readdirSync(kand).filter(f => f.startsWith('folge-') && f.endsWith('.json')) : [];
  if (!dateien.length) console.log('  ⚠️ keine folge-*.json in transcripts/kandidaten - Regelkandidaten UNGEPRUEFT.');
  let offen = 0; const folgen = [];
  for (const d of dateien){
    const o = JSON.parse(fs.readFileSync(path.join(kand, d), 'utf8'));
    const n = (o.kandidaten || []).length;
    if (n){ offen += n; folgen.push('F' + o.folge + ': ' + n); }
  }
  let beantwortet = 0;
  const ent = path.join(kand, 'entscheidungen.json');
  if (fs.existsSync(ent)){
    const e = JSON.parse(fs.readFileSync(ent, 'utf8'));
    beantwortet = (e.entscheidungen || []).length;
  }
  const rest = Math.max(0, offen - beantwortet);
  if (rest) posten.push({
    titel: 'Regelkandidaten aus dem Unterricht',
    zahl: rest, einheit: 'Fundstellen', dazu: folgen.join(' · '),
    aufwand: 'durchsehen und je Fundstelle ja/nein/später — das Zusammenfassen mache ich',
    warum: 'Aus ihnen werden neue Grammatikregeln. Ohne dein Ja trage ich keine ein — eine Regel ohne Quelle waere geraten, und geraten wird hier nicht.',
    wie: 'Auf der Freigabeseite antippen, unten den Text kopieren, in den Chat schicken.',
    seite: 'https://claude.ai/code/artifact/d9916aee-b679-4d91-bb0c-c3642f8889ac',
    seiteText: 'Die Freigabeseite'
  });
} catch (e) {
  console.log('  ⚠️ Regelkandidaten nicht lesbar: ' + e.message);
}

/* ⭐ Alle Seiten, die es fuer ihn gibt. Sie stehen HIER, weil diese Seite die
   ist, die er aufmacht — eine Adresse, die man nicht findet, ist so gut wie
   keine. ⚠️ Beim Anlegen eines neuen Artefakts hier ergaenzen; die URL bleibt
   ueber Aktualisierungen hinweg dieselbe. */
const ARTEFAKTE = [
  ['Was auf dich wartet',   '4c3a7c9e-c288-480c-bb1f-e2d7cd26d856', 'diese Seite — alle offenen Entscheidungen'],
  ['Die Fragenseite',       '724ee9bc-adb7-4dcd-ad75-6a56a552adbd', 'die offenen Feldangaben, ein Durchgang je Frage'],
  ['Der Wartungskreislauf', '9ec136ba-019d-438b-98af-e57939eb4a99', 'wie das System läuft — vier Phasen, dreizehn Prüfungen'],
  /* ⭐ Am 21.08. vom eigenen Wächter gemeldet: „1 Seite hat eine URL, steht
     aber auf KEINER Liste, die Elias sieht." Genau der Fall, für den er
     gebaut wurde — eine Adresse, die man nicht findet, ist so gut wie keine. */
  ['Lagebericht', '3eb1fcc3-e2ca-4c89-947c-9e382068e9e3', '48 Stunden Arbeit, der Stand des Goal-Prompts, mit Nachtrag vom 21.08.'],
  ['Vierzehn Schriften',    '21463a39-a852-43e0-ad80-7c3bbf78714b', 'die Wortmarke طالب zur Auswahl'],
  ['Das Farbgerüst',        '4e9ce030-17a6-46be-ba47-02ccb56bc32a', 'acht Akzentfarben an dreizehn Flächen'],
  ['Eine Stimme fürs Arabische', '15b48598-2cda-4516-81bd-6a7e730dd4cc', 'vier Wege, mit den gemessenen Kosten']
];

/* ⭐ Zwei Seiten, die NICHT zu den Entscheidungen gehören, sondern laufend
   gebraucht werden — und in denen deine Antworten stehen. Sie standen bis zum
   20.08.2026 in keinem Index; `Artifact action:"list"` kennt neunzehn Seiten,
   die meisten davon erledigte Entwürfe.

   ⛔ Elias am 18.08.2026 zur Regelprüfung: „jedoch habe ich da schon ein paar
   antworten gegeben, die sollen nicht verschwinden das ist das aller
   wichtigste." Die Schlüssel dieser beiden Seiten dürfen sich deshalb NIE
   ändern. */
const LAUFEND = [
  ['Regelauswahl Satzmodus', 'da4af296-67c5-4055-a2e7-35defc375007',
   'welche der 95 Regeln im Satzmodus bleiben — Schlüssel satzmodus-auswahl-v1'],
  ['Regelprüfung Madina 1', '1e11a0ef-992b-41ac-9786-1247cc185e83',
   'deine Beurteilung der Regeln — Schlüssel regelpruefung-v1, deine Antworten liegen darin'],
  ['Regelkandidaten freigeben', 'd9916aee-b679-4d91-bb0c-c3642f8889ac',
   'neue Regeln vor dem Eintragen — Schlüssel regelkandidaten-v1'],
  /* ⛔ Diese drei tragen einen eigenen Speicher — also deine Antworten — und
     standen bis zum 20.08.2026 auf KEINER Liste. Eine Adresse, die man nicht
     findet, ist so gut wie keine; und wer eine davon ohne ihre URL neu
     veroeffentlicht, laesst die Antworten in der alten Fassung zurueck. */
  ['Ähnliche Regeln zusammenfassen?', '9cb296d7-b5ea-4767-8f99-e5e896e6a871',
   'acht gemessene Regelgruppen zum Verschmelzen — Schlüssel verschmelzung-v1'],
  ['Neun Befunde', 'bc9b71c0-5ea6-451b-9f02-0fbc9fbdd63d',
   'die Befunde aus der Nacht auf den 19.08. — Schlüssel befunde-v1'],
  ['Die Wortmarke im Kopf der App', '75f11c5e-c9ae-4a57-87cc-d8b86338c621',
   'die aeltere Wortmarken-Frage — Schlüssel wortmarke-v1']
];

/* ⛔⛔ WELCHE DATEI GEHOERT ZU WELCHER URL

   Die Listen oben fuehren Titel und URL - aber nicht den DATEINAMEN. Wer eine
   Seite veroeffentlicht, muss die Zuordnung also im Kopf haben, und wer sie
   nicht hat, legt eine ZWEITE Seite an. Die alte bleibt verlinkt und wird nie
   wieder aktuell; gemerkt haette es niemand, weil beide fuer sich richtig
   aussehen. Am 20.08.2026 ist genau das an der Fragenseite fast passiert.

   ⚠️ Der Waechter unten meldet jede HTML in artefakte/, die hier fehlt. Eine
   Datei ohne Zuordnung ist keine Kleinigkeit: sie ist die naechste doppelte
   Seite. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[werkzeug_ohne_aufrufer]] */
const DATEI_ZU_URL = {
  'wartet-auf-elias.html':        '4c3a7c9e-c288-480c-bb1f-e2d7cd26d856',
  'wartungsfragen-artefakt.html': '724ee9bc-adb7-4dcd-ad75-6a56a552adbd',
  'wartungskreislauf.html':       '9ec136ba-019d-438b-98af-e57939eb4a99',
  'schriften-talib-artefakt.html':'21463a39-a852-43e0-ad80-7c3bbf78714b',
  'farben-artefakt.html':         '4e9ce030-17a6-46be-ba47-02ccb56bc32a',
  'stimme-artefakt.html':         '15b48598-2cda-4516-81bd-6a7e730dd4cc',
  'regelpruefung.html':           '1e11a0ef-992b-41ac-9786-1247cc185e83',
  'freigabe.html':                'd9916aee-b679-4d91-bb0c-c3642f8889ac',
  /* Der 48-Stunden-Bericht vom 20.08. Er lag bis zum 21.08. NUR im
     Scratchpad — also ausserhalb jeder Sicherung und ohne Eintrag hier.
     Waere er einmal unter einer neuen URL erschienen, haette Elias zwei
     Berichte gehabt und keinen Hinweis, welcher gilt. */
  'lagebericht.html':             '3eb1fcc3-e2ca-4c89-947c-9e382068e9e3',

  /* ⛔⛔ UND DIE SEITEN IM WURZELORDNER — sie waren dem Waechter unsichtbar,
     weil er nur artefakte/ las. Genau die Fehlerklasse des Tages: ein
     Werkzeug meldet gruen, weil es einen kleineren Bestand misst.
     [[werkzeug_misst_kleineren_bestand]]

     ⛔⛔ In den ersten vier liegen ELIAS ANTWORTEN (localStorage-Schluessel
     dahinter). Wer eine davon ohne ihre URL veroeffentlicht, legt eine ZWEITE
     Seite an — und seine Antworten bleiben in der ersten. Sein Wortlaut vom
     18.08.2026: „ich habe da schon ein paar antworten gegeben, die sollen
     nicht verschwinden das ist das aller wichtigste."
     Zugeordnet ueber den <title>, der in Datei und Artefaktliste gleich ist. */
  '../regelauswahl.html':         'da4af296-67c5-4055-a2e7-35defc375007',   /* satzmodus-auswahl-v1 */
  '../befunde.html':              'bc9b71c0-5ea6-451b-9f02-0fbc9fbdd63d',   /* befunde-v1 */
  '../verschmelzung.html':        '9cb296d7-b5ea-4767-8f99-e5e896e6a871',   /* verschmelzung-v1 */
  '../wortmarke-entwuerfe.html':  '75f11c5e-c9ae-4a57-87cc-d8b86338c621',   /* wortmarke-v1 */
  '../vorschau-stamm.html':       '488ce289-f5ae-4c8d-b597-ebd83d275cc2',
  '../vorschau-modusleisten.html':'13414c89-616d-4280-84fa-eef11e9b29e0',
  /* ⚠️ wartungsfragen.html ist die Vorschaufassung derselben Seite und wird
     NICHT veroeffentlicht - deshalb bewusst ohne URL, aber genannt, damit der
     Waechter sie nicht jedes Mal meldet. */
  'wartungsfragen.html':          null,
};


/* ---------- 2. Der Abschnitt aus der To-Do ---------- */
let ausTodo = [];
try {
  const t = fs.readFileSync(TODO, 'utf8');
  const auf = t.indexOf('### 🔴 Wartet auf Elias');
  if (auf >= 0){
    const rest = t.slice(auf + 24);
    const zu = rest.search(/\n#{1,3} /);
    ausTodo = (zu < 0 ? rest : rest.slice(0, zu))
      .split(/\r?\n/)
      .filter(z => /^\s*[-*]\s/.test(z))
      .map(z => z.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean)
      /* ⛔ ERLEDIGTES gehoert nicht auf eine Seite, die zeigt, was WARTET.
         Am 20.08.2026 stand dort ein vierzeiliger Absatz „✅ Erledigt … die
         zwei Saetze sind KEIN Mangel" — richtig und gut belegt, aber er machte
         die Seite laenger statt klarer. Ein erledigter Punkt bleibt in der
         To-Do stehen (dort ist er der Beleg), nur nicht hier.
         [[flaeche_nur_im_gefuellten_zustand]] */
      .filter(z => !/^(✅|~~)/.test(z.trim()));
  }
} catch (e) {
  console.error('⚠️ To-Do nicht lesbar: ' + e.message);
}

/* ---------- 3. Ausgabe ---------- */
/* ⛔ Nicht alles addieren. 14 Schriftentwuerfe und 8 Farben sind AUSWAHL, keine
   Stueckarbeit — eine Summe daraus behauptet 96 Aufgaben, wo es sechs
   Entscheidungen sind. Eine Zahl ohne ihren Nenner ist eine falsche Auskunft.
   [[trefferquote_ohne_preis]] */
const stueck = posten.filter(p => !p.auswahl).reduce((s, p) => s + p.zahl, 0);
const auswahlPosten = posten.filter(p => p.auswahl).length;
console.log('Was auf Elias wartet — gemessen am ' + new Date().toLocaleString('de-DE'));
console.log('');
posten.forEach(p => {
  console.log('  ' + String(p.zahl).padStart(4) + '  ' + p.titel + (p.dazu ? '  (' + p.dazu + ')' : ''));
  console.log('        Aufwand: ' + p.aufwand);
});
console.log('');
console.log('  ' + posten.length + ' Entscheidungen. Davon ' + (posten.length - auswahlPosten)
  + ' mit Stueckarbeit (' + stueck + ' Einzelstuecke), ' + auswahlPosten + ' nur ansehen und waehlen.');
if (ausTodo.length) console.log('  Dazu ' + ausTodo.length + ' Zeile(n) aus dem To-Do-Abschnitt.');

if (NUR_ZEIGEN) process.exit(0);

/* ---------- 4. Die Seite ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* Fettschrift und Code aus den To-Do-Zeilen behalten — sie tragen Bedeutung. */
const md = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

const karten = posten.map((p, i) => `
<article class="posten" data-nr="${i}">
  <header>
    <span class="zahl">${p.zahl}</span>
    <span class="einheit">${esc(p.einheit)}</span>
    <h2>${esc(p.titel)}</h2>
    ${p.dazu ? `<span class="dazu">${esc(p.dazu)}</span>` : ''}
  </header>
  <p class="aufwand"><span class="marke">Aufwand</span> ${esc(p.aufwand)}</p>
  <p class="warum">${esc(p.warum)}</p>
  <p class="wie"><span class="marke">So geht es</span> ${esc(p.wie)}</p>
  ${p.beispiel ? `<p class="warum"><span class="marke">Beispiel</span> ${esc(p.beispiel)}</p>` : ''}
  ${p.zeilen && p.zeilen.length ? `<ul class="zeilen">${p.zeilen.map(z => `<li>${md(z)}</li>`).join('')}</ul>` : ''}
  ${p.seite ? `<a class="knopf" href="${esc(p.seite)}" target="_blank" rel="noopener">${esc(p.seiteText || 'Öffnen')} →</a>` : ''}
</article>`).join('\n');

const html = `<title>Was auf dich wartet</title>
<style>
:root{
  --bg:#000; --flaeche:#111114; --hoch:#17171c; --rand:#26262c; --rand2:#1c1c21;
  --text:#f4f4f6; --leise:#9a9aa4; --still:#6b6b75;
  --rot:#ff1744; --rot-hell:#ff4d6a; --gruen:#2fd27a; --gelb:#ffc44d; --blau:#5aa9ff;
  --grad:linear-gradient(135deg,#ff1744 0%,#ff4d6a 100%);
  --sp1:6px; --sp2:10px; --sp3:16px; --sp4:24px; --sp5:38px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
     font-size:17px;line-height:1.55;padding:var(--sp5) var(--sp3) 90px}
.huelle{max-width:720px;margin:0 auto}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase;color:var(--still);margin:0 0 var(--sp2)}
h1{font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1;letter-spacing:-.025em;
   margin:0 0 var(--sp3);text-wrap:balance}
.vorspann{color:var(--leise);margin:0 0 var(--sp4);max-width:60ch}
.vorspann b{color:var(--text)}
code{font-family:var(--mono);font-size:.86em;color:var(--leise);
     background:var(--hoch);padding:1px 5px;border-radius:5px}

.posten{background:var(--flaeche);border:1px solid var(--rand);border-radius:16px;
        padding:var(--sp3) var(--sp4);margin-bottom:var(--sp3);
        border-left:3px solid var(--rot)}
.posten.erledigt{opacity:.42;border-left-color:var(--gruen)}
.posten header{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;
               margin-bottom:var(--sp3)}
.zahl{font-family:var(--mono);font-size:1.7rem;font-weight:700;line-height:1;
      background:var(--grad);-webkit-background-clip:text;background-clip:text;
      color:transparent;font-variant-numeric:tabular-nums}
.einheit{font-size:.78rem;color:var(--still);letter-spacing:.06em;text-transform:uppercase}
.posten h2{font-size:1.05rem;font-weight:600;margin:0;flex-basis:100%}
.dazu{font-size:.85rem;color:var(--still)}
.marke{font-family:var(--mono);font-size:.68rem;letter-spacing:.09em;
       text-transform:uppercase;color:var(--still);margin-right:var(--sp2)}
.posten p{margin:0 0 var(--sp2);font-size:.94rem}
.aufwand{color:var(--gelb)}
.warum{color:var(--leise)}
.wie{color:var(--leise)}
.zeilen{margin:var(--sp2) 0 var(--sp3);padding-left:1.15em;color:var(--leise);font-size:.9rem}
.zeilen li{margin-bottom:3px}
.knopf{display:inline-block;background:var(--grad);color:#fff;text-decoration:none;
       font-weight:600;font-size:.9rem;padding:9px 18px;border-radius:99px;
       margin-top:var(--sp1)}
.knopf:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.summe{background:var(--hoch);border:1px solid var(--rand);border-radius:16px;
       padding:var(--sp3) var(--sp4);margin-bottom:var(--sp4);
       display:flex;gap:var(--sp4);flex-wrap:wrap;align-items:baseline}
.summe .gross{font-family:var(--mono);font-size:2rem;font-weight:700;
              background:var(--grad);-webkit-background-clip:text;
              background-clip:text;color:transparent}
.summe .txt{color:var(--leise);font-size:.9rem}

h3{font-size:1rem;font-weight:600;margin:var(--sp5) 0 var(--sp2);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.todoliste{color:var(--leise);font-size:.92rem;padding-left:1.15em}
.todoliste li{margin-bottom:var(--sp2)}
.todoliste b{color:var(--text)}
.fuss{color:var(--still);font-size:.83rem;margin-top:var(--sp5)}
.seiten{list-style:none;padding:0;margin:0}
.seiten li{padding:var(--sp2) 0;border-bottom:1px solid var(--rand2);
           display:flex;gap:var(--sp2);flex-wrap:wrap;align-items:baseline}
.seiten li:last-child{border-bottom:0}
.seiten a{color:var(--blau);text-decoration:none;font-weight:600;font-size:.95rem}
.seiten a:hover{text-decoration:underline}
.seiten span{color:var(--still);font-size:.85rem}
</style>

<div class="huelle">
<p class="eyebrow">Stand ${esc(new Date().toLocaleString('de-DE'))}</p>
<h1>Was auf dich wartet</h1>

<p class="vorspann">Alles andere ist erledigt. Was hier steht, kann ich nicht
allein entscheiden — <b>und mehr steht hier auch nicht</b>. Die To-Do daneben
zählt inzwischen ${TODO_ZEILEN.toLocaleString('de-DE')} Zeilen; diese Seite wird bei jedem
Wartungslauf <b>neu erzeugt</b> und ist nie älter als ihr Datum oben.</p>

<div class="summe">
  ${posten.length === 0
    ? `<span class="gross">✓</span>
  <span class="txt"><b>Nichts offen.</b><br>
  Alles, was ohne dich geht, ist erledigt — und alles, was du entschieden
  hast, ist eingebaut. Diese Seite kommt wieder, sobald etwas auf dich
  wartet.</span>`
    : `<span class="gross">${posten.length}</span>
  <span class="txt"><b>Entscheidungen</b> — nicht ${stueck} Aufgaben.<br>
  ${auswahlPosten} davon heißt nur: ansehen und eine antippen. Die übrigen
  ${posten.length - auswahlPosten} betreffen zusammen ${stueck} Einzelstücke,
  aber die gehen in wenigen Durchgängen, nicht Stück für Stück.</span>`}
</div>

${karten}

${ausTodo.length ? `<h3>Dazu aus der To-Do</h3>
<ul class="todoliste">${ausTodo.map(z => `<li>${md(z)}</li>`).join('')}</ul>` : ''}

<h3>Laufend gebraucht — deine Antworten liegen darin</h3>
<ul class="seiten">${LAUFEND.map(([n, id, was]) =>
  `<li><a href="https://claude.ai/code/artifact/${id}">${esc(n)}</a> <span>${esc(was)}</span></li>`).join('')}</ul>

<h3>Alle Seiten für dich</h3>
<ul class="seiten">${ARTEFAKTE.map(([n, id, was]) =>
  `<li><a href="https://claude.ai/code/artifact/${id}">${esc(n)}</a> <span>${esc(was)}</span></li>`).join('')}</ul>

<p class="fuss">Erzeugt von <code>werkzeuge/wartet-auf-elias.mjs</code>. Die
Zahlen kommen aus <code>vorrat.mjs</code>, <code>pruefe-taschkil.js</code>,
<code>pruefe-funktionen.js</code> und <code>pruefe-duplikate.js</code> — live bei jedem Lauf, nicht abgeschrieben.</p>
</div>
`;

const ZIEL = path.join(REPO, 'artefakte', 'wartet-auf-elias.html');
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL + '.neu', html, 'utf8');
fs.renameSync(ZIEL + '.neu', ZIEL);
console.log('');
console.log('Seite gebaut: ' + path.relative(REPO, ZIEL));
/* Waechter: liegt eine Artefakt-Seite ohne bekannte URL da? */
try {
  const ohne = [];
  for (const [ordner, praefix] of [[path.join(REPO, 'artefakte'), ''], [REPO, '../']]){
    for (const f of fs.readdirSync(ordner)){
      if (!f.endsWith('.html')) continue;
      /* index.html ist die App selbst, vorschau-* sind Entwuerfe, die nie
         veroeffentlicht wurden. Beides gehoert nicht in die Zuordnung — sonst
         meldete der Waechter bei jedem Lauf fuenfzehn Fehlalarme und wuerde
         nach dem dritten Mal ueberlesen. Die zwei vorschau-Seiten, die DOCH
         veroeffentlicht sind, stehen oben namentlich drin. */
      if (praefix === '../' && (f === 'index.html' || f.startsWith('vorschau'))) continue;
      if (!((praefix + f) in DATEI_ZU_URL)) ohne.push(praefix + f);
    }
  }
  if (ohne.length){
    console.log('  ⛔ ' + ohne.length + ' Artefakt-Seite(n) ohne hinterlegte URL: ' + ohne.join(', '));
    console.log('     Wer sie veroeffentlicht, legt eine ZWEITE Seite an. Erst die URL in');
    console.log('     DATEI_ZU_URL (werkzeuge/wartet-auf-elias.mjs) eintragen, dann veroeffentlichen.');
  }
  /* ⭐⭐ UND DIE GEGENRICHTUNGEN. Am 20.08.2026 dreimal gelernt: ein Waechter
     prueft die Richtung, in der man ihn gedacht hat — die andere Haelfte
     fuehlt sich wie dieselbe Frage an und ist eine andere.
       Datei ohne URL      → fand freigabe.html
       URL ohne Datei      → fand regelauswahl.html im WURZELORDNER
       URL ohne Liste      → fand drei Seiten mit seinen Antworten
     Die ersten beiden Richtungen stehen jetzt als Code da, die dritte auch.
     [[werkzeug_misst_kleineren_bestand]] */
  const alleDateien = new Set();
  for (const [ordner, praefix] of [[path.join(REPO, 'artefakte'), ''], [REPO, '../']])
    for (const f of fs.readdirSync(ordner)) if (f.endsWith('.html')) alleDateien.add(praefix + f);
  const ohneDatei = Object.keys(DATEI_ZU_URL).filter(f => !alleDateien.has(f));
  if (ohneDatei.length)
    console.log('  ⛔ ' + ohneDatei.length + ' Zuordnung(en) ohne Datei im Projekt: ' + ohneDatei.join(', '));

  const aufListe = new Set([...ARTEFAKTE, ...LAUFEND].map(x => x[1]));
  const ohneListe = Object.entries(DATEI_ZU_URL)
    .filter(([f, id]) => id && !aufListe.has(id))
    .filter(([f]) => !f.startsWith('../vorschau'))
    .map(([f]) => f);
  if (ohneListe.length){
    console.log('  ⛔ ' + ohneListe.length + ' Seite(n) haben eine URL, stehen aber auf KEINER Liste,');
    console.log('     die Elias sieht: ' + ohneListe.join(', '));
    console.log('     Eine Adresse, die man nicht findet, ist so gut wie keine.');
  }
} catch (e) { console.log('  ⚠️ artefakte/ nicht lesbar: ' + e.message); }
console.log('  ⚠️ Veroeffentlichen kann die Routine nicht selbst — das braucht eine Sitzung.');
console.log('     DIESELBE URL wiederverwenden, keine neue anlegen:');
console.log('     https://claude.ai/code/artifact/4c3a7c9e-c288-480c-bb1f-e2d7cd26d856');
process.exit(posten.length ? 2 : 0);
