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
import { arabischInSeite, BIDI_CSS } from './arabisch-hervorheben.mjs';

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
    seite: 'https://claude.ai/artifact/5ChpdN9n7PAiTY4B5ZHud3',
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
  /* ⭐ MIT --alle, seit 21.08.2026. Ohne das zeigt pruefe-taschkil.js je
     Gruppe nur die ersten 12 Befunde, und die Woerterzahl dieser Seite wird
     zu klein — der Generator sagte das selbst („mindestens so viele"), rief
     aber weiter ohne auf. Gemessen kostet es nichts: 181 ms gegen 182 ms,
     54 Bytes mehr Ausgabe. Eine Kappung, die nichts spart und die Zahl
     verfaelscht, hat keinen Grund. [[begrenzung_haelt_messung_nicht_stand]] */
  const r = messen(path.join(REPO, 'pruefe-taschkil.js'), ['--alle']);
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
     waere sie zu klein.

     ⛔ Der Satz „Am 20.08.2026 ist die groesste Gruppe 11" stand hier als
     Beruhigung — und war am 21.08.2026 ueberholt: die Warnung schlaegt an,
     also IST eine Gruppe groesser. Eine Zahl im Kommentar, die niemand
     nachzieht, beruhigt genau dann, wenn sie es nicht mehr darf.
     [[eingefrorenes_feld_ist_kein_zustand]] [[begrenzung_haelt_messung_nicht_stand]] */
  /* ⛔⛔ DAS ALTE KENNZEICHEN HATTE ZWEI URSACHEN (21.08.2026)
     ========================================================
     Hier stand `echt.some(g => g.zahl > g.woerter.length && g.zahl > 12)`.
     Aber `zahl > woerter.length` heisst nicht nur „gekappt" — es heisst auch
     „ein Wort hat MEHRERE Befunde". Genau das ist der Normalfall: in „Haraka
     fehlt: 13" steht أَيْضاً zweimal (einmal sentAr, einmal ar), in „Hamzat
     al-wasl: 10" steht اسْمُ zweimal. Die Warnung schlug also auch dann an,
     wenn gar nichts gekappt war — und blieb nach der Umstellung auf --alle
     stehen, obwohl Kappung nun ausgeschlossen ist.
     [[kennzeichen_mit_zwei_ursachen]]

     ⭐ Gemessen wird jetzt die Kappung selbst: pruefe-taschkil.js schreibt
     „… N weitere (--alle zeigt sie)", und nur dann. Gegenprobe am 21.08.:
     ohne --alle 1x in der Ausgabe, mit --alle 0x.
     [[pruefung_fragt_einen_stellvertreter_ab]] */
  const gekappt = /--alle zeigt sie/.test(r.text);
  /* ⛔ `m ? … : 0` und nicht `Number(m[2])`: faellt pruefe-taschkil.js aus,
     ist m null. Die Absicherung `if (m && …)` steht zwei Zeilen SPAETER —
     zu spaet, der Generator starb hier mit TypeError. Am 21.08.2026 beim
     Stoertest aufgefallen, nicht im Betrieb: die Datendateien fehlen sonst
     nie. [[befund_vor_dem_ende_der_funktion]] */
  const echteWoerter = new Set(echt.flatMap(g => g.woerter)).size || (m ? Number(m[2]) : 0);
  if (gekappt) console.log("  ⚠ Eine Taschkil-Gruppe ist groesser als 12 —"
    + " die Woerterzahl unten ist dadurch zu klein. pruefe-taschkil.js --alle.");
  if (m && echteBefunde > 0) posten.push({
    titel: 'Taschkīl-Fragen',
    zahl: echteBefunde,
    einheit: 'Befunde',
    /* ⛔ DIE EINSCHRAENKUNG GEHOERT AUF DIE SEITE, nicht nur in die Konsole.
       Bis zum 21.08.2026 stand die Kappung ausschliesslich als console.log —
       gesehen hat sie also nur, wer das Werkzeug selbst startet. Auf Elias'
       Seite stand „in 19 Wörtern" als feste Zahl, obwohl sie nachweislich zu
       niedrig war. Wer eine Zahl liest, ohne ihren Vorbehalt zu sehen, glaubt
       sie. [[werkzeug_misst_kleineren_bestand]] [[trefferquote_ohne_preis]] */
    dazu: `in ${echteWoerter}${gekappt ? '+' : ''} Wörtern`
        + (ohneMangel ? ` · ${ohneMangel} weitere sind kein Mangel` : '')
        + (gekappt ? ' · ⚠️ mindestens so viele — eine Gruppe ist länger, als die Prüfung zeigt' : ''),
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

  /* ⭐ Unvokalisierte Wörter in REGELTEXTEN (17.09.2026). pruefe-taschkil.js
     meldet sie in einem eigenen Abschnitt und endet damit auf Exit 1 — auf
     dieser Seite standen sie nie. Am 17.09. waren es بلا (in „مُؤَنَّث بلا تَاء")
     und مزدوجة (in „أَعْضَاء مزدوجة"): Bestand, Bücher, Madina-Schlüssel 2/3
     und Folge 9 (42:53, 48:32) belegen keine Schreibung — der Lehrer sagt dort
     nur Deutsch („Doppelte Körperteile … sind weiblich"). arabdict schlägt
     بِلا vor, Reverso vokalisiert keines von beiden: EIN Wörterbuch ist kein
     Beleg. Also eine Frage, keine Reparatur. Gemessen aus der Ausgabe, nicht
     abgeschrieben — ist eine Zeile belegt, fällt sie von selbst weg. */
  const rt = /=== Regeln mit unvokalisierten Woertern: (\d+) ===\r?\n((?:  [^\n]*\r?\n)+)/.exec(r.text);
  if (rt && Number(rt[1]) > 0){
    const zeilenR = rt[2].split(/\r?\n/).map(z => z.trim()).filter(z => /^[a-z0-9-]+: /.test(z));
    posten.push({
      titel: 'Regeltitel mit einem arabischen Wort, das niemand belegt',
      zahl: zeilenR.length, einheit: 'Regeln', dazu: 'ohne Vokalzeichen, ohne Quelle', auswahl: true,
      aufwand: 'je Regel: rausnehmen — oder sagen, wie es im Unterricht geschrieben wurde',
      warum: 'Diese Wörter stehen ohne Vokalzeichen im Titel deiner Regelkarte. Dein Lehrer hat die Regel nur '
        + 'auf Deutsch erklärt, und weder deine Bücher noch die Madina-Schlüssel noch dein Bestand kennen das Wort. '
        + 'Selbst vokalisieren darf ich es nicht, ein einziges Wörterbuch reicht als Beleg nicht.',
      wie: 'Sag „raus", dann steht dort nur der deutsche Titel. Kennst du die Schreibung aus deinem Heft, nenn sie mir.',
      zeilen: zeilenR,
      seite: '', seiteText: ''
    });
  }
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
    seite: 'https://claude.ai/artifact/5ChpdN9n7PAiTY4B5ZHud3',
    seiteText: 'Fragenseite öffnen'
  });
}

/* C2) Duplikate (A13) */
{
  const r = messen(path.join(REPO, 'pruefe-duplikate.js'));
  /* ⛔ Regex OHNE Escapes: die Backslashes kommen durch den Kanal halbiert
     oder gar nicht an — hier stand erst /=== (d+) Befund/. */
  const m = new RegExp("=== (" + '\\d' + "+) Befund").exec(r.text);
  /* ⭐ Seit 16.09.2026 (abends) entscheidet seine GRUNDREGEL die meisten selbst:
     „das ist eine grundregel: wenn zwei identisch sind und eines davon aber
     fortschritt hat dann sollte man immer das behalten was fortschritt hat".
     pruefe-duplikate.js zählt nur noch als Befund, was die Regel NICHT entscheidet:
     zwei Kapitelkarten mit Fortschritt auf BEIDEN, oder eine Bedeutung, die die App
     nicht als gleich erkennt. Nur Zeilen UNTER „Befund(e)" zählen hier; darüber
     stehen die entschiedenen mit derselben Form. */
  const befundTeil = r.text.slice(Math.max(0, r.text.indexOf('Befund(e) ===')));
  const befundZeilen = m ? befundTeil.split(String.fromCharCode(10))
    .filter(z => z.startsWith('  ') && z.includes('(') && z.includes('id ')) : [];
  const zweiBuecher = befundZeilen.filter(z => z.includes('(Buchvokabel,')).length;
  const eigene = befundZeilen.length - zweiBuecher;
  if (m && Number(m[1]) > 0) posten.push({
    titel: 'Ein Wort steht doppelt',
    zahl: Number(m[1]),
    einheit: Number(m[1]) === 1 ? 'Wort' : 'Wörter',
    dazu: [eigene ? eigene + '× eigene Vokabel oder Fachbegriff gegen Buchvokabel, Bedeutung nicht sicher dieselbe' : '',
           zweiBuecher ? zweiBuecher + '× dasselbe Wort in zwei Kapiteln, das deine Regel nicht entscheidet' : ''].filter(Boolean).join(' · '),
    aufwand: 'je Wort ja oder nein',
    warum: 'Zwei Karteikarten für dasselbe Wort — du lernst es doppelt.',
    wie: 'Deine Grundregel vom 16.09. entscheidet die meisten selbst: die Karte mit Fortschritt bleibt, und bei deinen eigenen Wörtern bleibt die Karte aus dem Kapitel und bekommt deinen Stand. '
      + 'Hier stehen nur die, zu denen sie nichts sagt: '
      + (zweiBuecher ? 'beide Karten haben schon Fortschritt — sag, welche bleiben soll. ' : '')
      + (eigene ? 'die Bedeutung ist nicht sicher dieselbe — sag, ob es wirklich dasselbe Wort ist. ' : '')
      + '⛔ Nicht jeder Treffer ist ein Duplikat: ظَرْف = Zeit-/Ortsangabe gegen ظَرْفٌ = Umschlag sind zwei verschiedene Wörter.',
    zeilen: befundZeilen.slice(0, 4).map(z => z.trim())
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
    /* ⛔ Hier stand „vorbereitet ist nur Madina 1" fest. Am 16.09.2026 hat Elias
       Bayna Yadayk 1 Kapitel 1–2 freigeschaltet, und die Wartung hat sie
       vollständig vorbereitet — der Satz war am selben Abend falsch. Jetzt
       gemessen: ein Kapitel zählt als vorbereitet, wenn keinem seiner Wörter
       Eselsbrücke oder Satz fehlt. [[eingefrorenes_feld_ist_kein_zustand]] */
    const fertigeKapitel = (liste) => {
      const nach = new Map();
      for (const w of liste || []){
        const k = Number(w.chapter);
        if (!nach.has(k)) nach.set(k, []);
        nach.get(k).push(w);
      }
      return [...nach.entries()]
        .filter(([, l]) => { const e = zaehle(l); return e.ohneE === 0 && e.ohneS === 0; })
        .map(([k, l]) => ({ k, n: l.length })).sort((a, b) => a.k - b.k);
    };
    const teilweise = rohe.map(r => ({ slug: r.slug, fertig: fertigeKapitel(BUCH[r.slug]) }))
      .filter(t => t.fertig.length)
      .map(t => t.slug + " Kapitel " + t.fertig.map(f => f.k).join(", ")
        + " (" + t.fertig.reduce((s, f) => s + f.n, 0) + " Wörter)");
    if (rohe.length) posten.push({
      titel: "Andere Bücher: anhakbar, aber leer",
      zahl: summe, einheit: "Wörter", dazu: rohe.length + " Bücher", auswahl: true,
      aufwand: "nichts tun ist in Ordnung — du sollst nur wissen, was passiert",
      warum: "Die Buchauswahl in den Einstellungen zeigt alle acht Bücher, aber vorbereitet"
        + " ist Madina 1 (" + eich.n + " Wörter, lückenlos)"
        + (teilweise.length ? " und von den anderen nur " + teilweise.join(" · ") : "")
        + ". Hakst du mehr an, kommen die Karten ohne Eselsbrücke und ohne Beispielsatz —"
        + " und ohne Satz gibt es auch keine Markierung und keine Übungsaufgabe."
        + " Die Freischaltung bremst das nicht: seit v282 entscheidet deine Auswahl.",
      wie: "Wenn dich das stört, sag Bescheid — dann baue ich einen Hinweis in die"
        + " Buchauswahl, etwa „" + (() => {
          /* Das Beispiel aus der Messung, nicht fest: hier stand Bayna Yadayk 1
             „noch keine Eselsbrücken" — seit 16.09.2026 hat es welche. */
          const r = rohe.slice().sort((a, b) => b.ohneE - a.ohneE)[0];
          return r.slug + " · " + r.n + " Karten, " + r.ohneE + " ohne Eselsbrücke";
        })() + "“."
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
/* ⛔⛔ KOMMENTARE ZÄHLEN NICHT ALS AUFRUFER — am 21.08.2026 auf die harte Tour
   gelernt. Ich hatte in js/lernen.js hingeschrieben: „⚠️ `openQuranFreqPopover`
   hat damit KEINEN Aufrufer mehr". Genau dieser Satz wurde als Aufrufer
   gezählt, und der Posten, den er ankündigt, erschien deshalb nie.

   ⭐ Die ERKLÄRUNG, warum etwas gemeldet gehört, verhinderte die Meldung.
   [[stichworttreffer_im_kommentar]] [[kommentar_beschreibt_absicht_markup_wirkung]]

   ⚠️ Grob, aber für diesen Zweck richtig: Blockkommentare und Zeilenreste nach
   `//` fallen weg. Ein `/*` INNERHALB einer Zeichenkette würde zu viel
   entfernen — dann fiele die Zählung zu NIEDRIG aus, und der Posten erschiene
   fälschlich. Deshalb steht unten eine Eichung, die das auffliegen ließe. */
const ohneKommentare = txt => txt
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

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
        const txt = ohneKommentare(fs.readFileSync(voll, "utf8"));
        for (const m of txt.matchAll(/paketLoeschen/g)){
          const um = txt.slice(Math.max(0, m.index - 12), m.index);
          if (!/function\s*$/.test(um)) aufrufer++;
        }
      }
    };
    suchen(path.join(REPO, "js"));
    /* Und die Wurzel, aber NUR die .html/.js dort - nicht data/ mit
       seinen Megabytes. */
    /* ⛔⛔ ZWEI ZERBROCHENE MUSTER, am 21.08.2026 gefunden. Der Block hier ist
       der ZWILLING des Blocks darueber, und beim Kopieren haben zwei
       Backslashes die Shell nicht ueberlebt:

         /.(js|html)$/    war gemeint als  /\.(js|html)$/
         /functions*$/    war gemeint als  /function\s*$/

       Das zweite ist das gefaehrliche: `um` endet bei einer Deklaration auf
       "function " MIT Leerzeichen. `/functions*$/` verlangt, dass die
       Zeichenkette auf "function" plus beliebig viele "s" ENDET — auf ein
       Leerzeichen trifft das nie zu. Die Deklaration waere also als Aufrufer
       gezaehlt worden, und der Posten waere still verschwunden.

       ⚠️ Heute traf es NICHT zu: `paketLoeschen` steht nur in js/, und der
       Block darueber hat die richtigen Muster. Der Fehler haette erst
       zugeschlagen, wenn das Wort einmal in einer Datei im Wurzelverzeichnis
       auftaucht — und dann als „Elias hat entschieden", nicht als Fehler.
       [[python_backslash_b_wird_backspace]] [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
    for (const e of fs.readdirSync(REPO, { withFileTypes: true })){
      if (!e.isFile() || !/\.(js|html)$/.test(e.name)) continue;
      const txt = ohneKommentare(fs.readFileSync(path.join(REPO, e.name), "utf8"));
      for (const m of txt.matchAll(/paketLoeschen/g)){
        const um = txt.slice(Math.max(0, m.index - 12), m.index);
        if (!/function\s*$/.test(um)) aufrufer++;
      }
    }
    /* ✅ ENTSCHIEDEN 22.09.2026: kein Knopf. Auf „Mein Vorschlag: keinen Knopf
       bauen und die Frage streichen" sagte Elias „ja mach so". */
    const PAKET_ENTSCHIEDEN = true;
    if (!aufrufer && !PAKET_ENTSCHIEDEN) posten.push({
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

/* ---------- Der Vers-Aufklapper hat keinen Aufrufer mehr (21.08.2026) -------

   Am 21.08.2026 ist das Abzeichen „x× im Quran" von den Karteikarten
   verschwunden — Elias mit Bild: „das kann man aus den karteikarten komplett
   raus nehmen". Der Klick darauf war der EINZIGE Weg zum Aufklapper mit den
   Fundstellen im Quran, und der führt weiter in den Quran-Leser.

   ⚠️ Wie beim Posten darüber LIVE gezählt, nicht fest eingetragen: bekommt
   `openQuranFreqPopover` wieder einen Aufrufer, verschwindet die Frage von
   selbst. [[eingefrorenes_feld_ist_kein_zustand]]

   ⛔ Die Prüfdateien zählen NICHT als Aufrufer. `pruefe-oberflaeche.js` ruft
   die Funktion weiter auf, damit sie nicht unbemerkt verfällt — aber das ist
   kein Weg, den Elias gehen kann. Zählte man sie mit, wäre die Frage nie
   gestellt worden. [[pruefwerkzeug_mit_eingebauter_antwort]] */
{
  const quelle = path.join(REPO, "js", "lernen.js");
  if (fs.existsSync(quelle) && /function openQuranFreqPopover\s*\(/.test(fs.readFileSync(quelle, "utf8"))){
    let aufrufer = 0;
    const zaehle = (voll, name) => {
      if (!/\.(js|html)$/.test(name)) return;
      if (/^pruefe-/.test(name)) return;               /* siehe oben */
      const txt = ohneKommentare(fs.readFileSync(voll, "utf8"));
      for (const m of txt.matchAll(/openQuranFreqPopover/g)){
        const um = txt.slice(Math.max(0, m.index - 12), m.index);
        if (!/function\s*$/.test(um)) aufrufer++;
      }
    };
    const suchen = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        if (e.name === ".deploy" || e.name === "node_modules" || e.name === ".git") continue;
        const voll = path.join(dir, e.name);
        if (e.isDirectory()){ suchen(voll); continue; }
        zaehle(voll, e.name);
      }
    };
    suchen(path.join(REPO, "js"));
    for (const e of fs.readdirSync(REPO, { withFileTypes: true })){
      if (e.isFile()) zaehle(path.join(REPO, e.name), e.name);
    }
    /* ⛔ EICHUNG für den Kommentar-Entferner. Wenn er zu viel wegnimmt, fällt
       die Zählung zu NIEDRIG aus und dieser Posten erscheint fälschlich — ein
       Fehler, der wie ein Befund aussieht. Die Deklaration selbst muss den
       Entferner überleben; tut sie es nicht, wird die Frage lieber gar nicht
       gestellt. [[pruefwerkzeug_mit_eingebauter_antwort]] */
    const heil = /function openQuranFreqPopover\s*\(/
      .test(ohneKommentare(fs.readFileSync(quelle, "utf8")));
    if (!heil) console.log("  ⚠ Kommentar-Entferner hat zu viel entfernt — Posten "
      + "\"Quran-Fundstellen\" wird nicht gestellt.");
    /* ✅ ENTSCHIEDEN 22.09.2026: „ganz weg". Die Liste der Koranstellen kommt
       mit dem Aufräumen am 24.09. heraus (zusammen mit dem Ton-Protokoll —
       eine Auslieferung statt zwei). Bis dahin fragt dieser Posten nicht mehr. */
    const FUNDSTELLEN_ENTSCHIEDEN = true;
    if (!aufrufer && heil && !FUNDSTELLEN_ENTSCHIEDEN) posten.push({
      titel: "Quran-Fundstellen: der Weg dorthin ist weg",
      zahl: 1, einheit: "Entscheidung", dazu: "js/lernen.js — openQuranFreqPopover", auswahl: true,
      aufwand: "sagen, wohin er soll — oder ob er ganz raus kann",
      warum: "Du wolltest das Abzeichen „x× im Quran\" von den Karteikarten haben, und es ist"
        + " weg. Der Klick darauf war aber der einzige Weg zu der Liste, die zeigt, an welchen"
        + " Stellen im Quran das Wort vorkommt — und von dort direkt in den Leser springt."
        + " Diese Liste gibt es noch, sie ist nur nicht mehr erreichbar.",
      wie: "Sag mir, ob sie auf die Infokarte soll (dort ist Platz, und du gehst sowieso"
        + " hin, wenn du ein Wort genauer ansiehst) oder ob sie ganz raus kann. Bis dahin"
        + " bleibt der Code stehen und wird weiter geprüft.",
      seite: "", seiteText: ""
    });
  }
}

/* ---------- „(gr)" steht ungeklärt auf den Karten (21.08.2026) -------------

   Elias am 21.08.2026 um 05:26, mit Bild einer Karte, auf der nur
   „(gr) im Nominativ" stand: „was ist eigentlich dieses gr".

   Die Abkürzung kommt aus dem arabicroots-Abzug, nicht aus der App. Sie wird
   nirgends erklärt — wer sie nicht kennt, muss raten.

   ⚠️ GEZÄHLT, nicht geschätzt, und über ALLE Bücher: die Zahl in der Frage
   soll stimmen, auch wenn er später ein anderes Buch anhakt.
   ⛔ Eichung: 50470 (مَرْفُوعٌ, „(gr) im Nominativ") MUSS dabei sein. Zählt die
   Messung ihn nicht mit, misst sie etwas anderes — dann lieber keine Frage als
   eine mit erfundener Zahl. [[unmoegliche_zahl_ist_ein_geschenk]] */
{
  /* ⛔ ZWEI ZAHLEN, und sie sind NICHT dieselbe Frage. Der erste Entwurf zählte
     nur `"de": "(gr)` und kam auf 18; ein Grep über „(gr) irgendwo im Text"
     ergab 23. Beide stimmen — der Unterschied sind fünf Einträge, bei denen die
     Abkürzung MITTEN im Text steht, etwa „Nachricht; (gr) Prädikat des
     Nominalsatzes". Genau die sind der Grund, warum die Frage nicht mit einer
     Zahl auskommt: „Grammatik:" davorzusetzen passt bei 18, bei den anderen
     fünf müsste die Abkürzung im Satz ersetzt werden.
     [[widerspruch_liegt_in_der_beschriftung]] */
  const VORN = '"de": "(gr)';
  const IRGENDWO = '(gr)';
  let vorn = 0, gesamt = 0, geeicht = false, buecher = 0;
  const dat = path.join(REPO, "data");
  const dateien = fs.existsSync(dat)
    ? fs.readdirSync(dat).filter(n => n.startsWith("vokabeln-") && n.endsWith(".js")).map(n => path.join(dat, n))
    : [];
  for (const f of dateien){
    const txt = fs.readFileSync(f, "utf8");
    const v = txt.split(VORN).length - 1;
    /* Nur Zeilen des Feldes `de` — sonst zählte ein „(gr)" in einem Kommentar mit. */
    const g = txt.split(/\r?\n/).filter(z => z.includes('"de":') && z.includes(IRGENDWO)).length;
    vorn += v; gesamt += g;
    if (g) buecher++;
    if (txt.includes('"id": "50470"')) geeicht = true;
  }
  /* ✅ ENTSCHIEDEN 22.09.2026: NEIN. Auf „Das „(gr)“ auf 23 Karten
     ausschreiben?" antwortete Elias „nein" (zusammen mit der شدة-Frage). Das
     „(gr)" bleibt, wie es ist; die Zählung oben bleibt stehen, der Posten
     erscheint nicht mehr. Nicht erneut vorschlagen. */
  const GR_ENTSCHIEDEN = true;
  if (!GR_ENTSCHIEDEN && gesamt && geeicht) posten.push({
    titel: "„(gr)" + '" auf den Karten — soll ich es ausschreiben?',
    zahl: gesamt, einheit: "Vokabel(n)", dazu: `${vorn} davon beginnen damit · ${buecher} Buchdatei(en)`, auswahl: true,
    aufwand: "ja oder nein — die Änderung ist eine Zeile",
    /* ⛔ Hier stand „Du hast heute Morgen gefragt" — ein fester Text, der
       jeden Tag danach falsch war (16.09.2026 bemerkt). Eine Zeitangabe ohne
       Datum ist eingefroren. [[eingefrorenes_feld_ist_kein_zustand]] */
    warum: "Du hattest gefragt, was „(gr)\" bedeutet. Es heißt „grammatischer"
      + " Fachbegriff\" und kommt aus dem arabicroots-Abzug, nicht von mir. In der App wird"
      + " es nirgends erklärt — wer die Abkürzung nicht kennt, sieht auf der Karte nur"
      + " „(gr) im Nominativ\" und muss raten. In Madina 1 sind es die Wörter aus"
      + " Kapitel 24, den Iʿrāb-Begriffen.",
    wie: "Sag ja, dann zeigt die Karte „Grammatik: im Nominativ\" statt „(gr) im"
      + " Nominativ\". Der Abzug bleibt unangetastet — die Ersetzung passiert beim"
      + " Anzeigen, wie bei deinen eigenen Korrekturen auch."
      + " ⚠️ Bei den Einträgen, wo „(gr)\" mitten im Text steht (etwa „Nachricht;"
      + " (gr) Prädikat des Nominalsatzes\"), passt „Grammatik:\" davor nicht —"
      + " dort würde ich es zu „grammatisch\" ausschreiben. Sag Bescheid, wenn"
      + " du das anders willst.",
    seite: "", seiteText: ""
  });
}

/* ---------- Wenn zur Laufzeit etwas wirft, sieht er nichts (21.08.2026) -----

   ⛔ GEMESSEN, nicht vermutet: in js/, index.html und sw.js gibt es KEINEN
   einzigen globalen Fehlerfaenger — kein `window.onerror`, kein
   `addEventListener('error')`, kein `unhandledrejection`.

   Wirft also irgendetwas zur Laufzeit, stirbt der betroffene Pfad still. Die
   Karte dreht sich nicht, ein Bildschirm bleibt leer, ein Knopf tut nichts —
   und nichts sagt, warum. Fuer Elias sieht das aus wie „kaputt", nicht wie ein
   Fehler mit einer Ursache. [[ausfall_ist_unsichtbar_gebaut]]

   ⚠️ Das ist ein echter Ausfallpfad, aber die ABHILFE ist eine
   Gestaltungsfrage: was soll er sehen? Deshalb vorgelegt statt entschieden.
   [[erst_ursache_dann_zweite_massnahme]]

   ⚠️ LIVE gezaehlt: sobald ein Faenger existiert, verschwindet der Posten von
   selbst. [[eingefrorenes_feld_ist_kein_zustand]] */
{
  let faenger = 0;
  const suchen = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })){
      if (e.name === '.deploy' || e.name === 'node_modules' || e.name === '.git') continue;
      const voll = path.join(dir, e.name);
      if (e.isDirectory()){ if (e.name === 'js') suchen(voll); continue; }
      if (!/\.(js|html)$/.test(e.name)) continue;
      if (/^pruefe-/.test(e.name)) continue;
      const txt = ohneKommentare(fs.readFileSync(voll, 'utf8'));
      if (/window\.onerror|addEventListener\(\s*['"]error['"]|onunhandledrejection|addEventListener\(\s*['"]unhandledrejection['"]/.test(txt)) faenger++;
    }
  };
  suchen(path.join(REPO, 'js'));
  for (const e of fs.readdirSync(REPO, { withFileTypes: true })){
    if (!e.isFile() || !/^(index\.html|sw\.js)$/.test(e.name)) continue;
    const txt = ohneKommentare(fs.readFileSync(path.join(REPO, e.name), 'utf8'));
    if (/window\.onerror|addEventListener\(\s*['"]error['"]|onunhandledrejection/.test(txt)) faenger++;
  }

  if (!faenger) posten.push({
    titel: 'Wenn etwas schiefgeht, siehst du nichts',
    zahl: 0, einheit: 'Fehlerfänger', dazu: 'in js/, index.html und sw.js', auswahl: true,
    aufwand: 'eine Entscheidung — was du sehen willst; das Bauen ist eine halbe Stunde',
    warum: 'Die App hat keinen einzigen globalen Fehlerfaenger. Geht zur Laufzeit etwas'
      + ' schief, stirbt genau dieser Pfad still: die Karte dreht sich nicht, ein'
      + ' Bildschirm bleibt leer, ein Knopf tut nichts. Du siehst „kaputt", nicht'
      + ' „Fehler in Modul X". Und ich sehe hinterher gar nichts, weil nichts'
      + ' festgehalten wird — die drei Fehler, die du mir heute frueh gemeldet hast,'
      + ' habe ich nur ueber deine Bilder gefunden.'
      + ' \n\n⛔ Am 21.08.2026 dazu gemessen, und das ist der greifbarste Fall:'
      + ' ALLES, was die App speichert — dein Lernfortschritt, deine Einstellungen,'
      + ' deine Notizen — laeuft ueber eine einzige Funktion (LS.set in'
      + ' js/kern.js). Die faengt einen Speicherfehler ab und verschluckt ihn'
      + ' dann. Gegengeprueft: in der ganzen App gibt es KEINE Stelle, die dir'
      + ' einen Speicherfehler zeigen wuerde. Ist dein Speicher gesperrt (privates'
      + ' Fenster etwa), lernst du eine Runde durch und beim naechsten Oeffnen ist'
      + ' alles weg — ohne dass vorher irgendetwas darauf hingedeutet haette.'
      + ' Voll wird er kaum, gesperrt sein kann er aber: genau das ist in derselben'
      + ' Nacht bei einer der Entscheidungsseiten real passiert.',
    wie: 'Zwei Wege, such einen aus. (a) STILL: der Fehler wird nur gespeichert, die'
      + ' Oberflaeche bleibt unveraendert — beim naechsten Bericht steht er dann drin.'
      + ' (b) SICHTBAR: zusaetzlich eine schmale Zeile am unteren Rand „Da ist etwas'
      + ' schiefgegangen", die man wegtippen kann. ⚠️ (b) aendert, was du siehst —'
      + ' deshalb frage ich, statt es einzubauen.',
    seite: '', seiteText: ''
  });
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
/* A9) Merksaetze, die den Quran zitieren.

   ⛔ pruefe-eselsbruecken.js ist rot, aber sein Befund stand als EINZIGER
   der drei roten Pruefer nirgends auf dieser Seite. Wer den Sammellauf
   liest, sieht "3 rot" und haelt alle drei fuer bekannt.
   [[daten_ohne_zugang]]

   ⭐ Zwei Fragen, ein Posten — beide betreffen dasselbe: Koranzitate in
   Merksaetzen. Er kann sie in einem Zug beantworten.

   ⚠️ Die dritte Gruppe der Befunde ("steht erst in Kapitel 15") kommt
   NICHT auf die Seite: sie loest sich von selbst, sobald er dort ankommt.
   Ein Posten, den niemand bearbeiten muss, ist Laerm. */
{
  const eb = messen(path.join(REPO, 'pruefe-eselsbruecken.js'));
  const zeilen = eb.text.split(/\r?\n/);
  let abschnitt = 0;
  const koranMerksaetze = new Set(), langeMerksaetze = new Set();
  for (const z of zeilen){
    const k = z.match(/^=== (\d)\./);
    if (k){ abschnitt = Number(k[1]); continue; }
    const f = z.match(/^\s+FEHL\s+(\S+)/);
    if (!f) continue;
    if (abschnitt === 1) koranMerksaetze.add(f[1]);
    if (abschnitt === 2) langeMerksaetze.add(f[1]);
  }
  /* Vereinigung, nicht Summe: zwei Merksaetze stehen in BEIDEN Abschnitten,
     weil dasselbe Zitat beide Regeln verletzt. Eine Entscheidung loest
     dort zwei Meldungen. [[trefferquote_ohne_preis]] */
  const alle = new Set([...koranMerksaetze, ...langeMerksaetze]);
  if (alle.size){
    posten.push({
      titel: 'Merksätze, die den Quran zitieren',
      zahl: alle.size, einheit: 'Merksätze', auswahl: true,
      dazu: koranMerksaetze.size + ' mit Sure außerhalb deines auswendigen Bereichs · '
            + langeMerksaetze.size + ' mit mehr als 4 arabischen Wörtern',
      aufwand: 'zwei Entscheidungen — das Umschreiben mache ich',
      warum: 'Eine Eselsbrücke trägt nur, wenn das andere Ufer schon steht. '
           + 'Sure 2 kennst du nicht auswendig, also hilft ein Zitat daraus nicht beim Merken. '
           + 'Umgekehrt sind zwei der langen Läufe aus Suren, die du KANNST (105 und 67) — '
           + 'dort ist die Anknüpfung gut, nur der Lauf ist lang.',
      wie: '1) Sollen die Zitate aus Sure 2 durch etwas ersetzt werden, das du kennst? '
         + '2) Darf ein Koranzitat länger als 4 Wörter sein, wenn du die Sure auswendig kannst? '
         + '(Kürzen würde ich es nicht — der Wortlaut gehört der Quelle.)'
    });
  }
}

/* ---------- Die Buchvokabeln im Offline-Vorrat (09.09.2026) ----------

   ⛔ ANLASS: die Reparatur von v462. Ein fehlendes Buch liess bis dahin alle
   sieben aus der Auswahl verschwinden — und dabei kam heraus, WARUM ueberhaupt
   eines fehlen kann: von den `data/vokabeln-*.js` steht nur `vokabeln-eigene.js`
   in der ASSETS-Liste von sw.js. Die uebrigen landen erst im Cache, nachdem sie
   einmal mit Netz geladen wurden.

   ⭐ Die Reparatur war meine; DIESE Frage ist seine. Sie ist ein Abwaegen —
   1,75 MB je Auslieferung gegen „ohne Netz sind alle Buecher da" — und dafuer
   gibt es keine technisch richtige Antwort. [[schweigen_ist_kein_auftrag]]

   ✅ BEANTWORTET 16.09.2026 auf dieser Seite: „soll unterwegs auch verfügbar
   sein als oja" → v515, alle Buchabzuege in ASSETS. Der Posten verschwindet
   von selbst, solange keine Buchdatei ausserhalb der Liste liegt; kommt ein
   neues Buch dazu, fragt er wieder — dann gilt diese Antwort, nicht die Frage.

   ⚠️ Gerechnet wird aus den echten Dateien, nichts steht hier als Zahl. Faellt
   die Messung aus (kein data/, ASSETS-Liste nicht lesbar), erscheint der Posten
   gar nicht — lieber keine Frage als eine mit erfundener Zahl.
   [[zahlen_ohne_beleg]] */
{
  const datOrdner = path.join(REPO, 'data');
  const swPfad = path.join(REPO, 'sw.js');
  if (fs.existsSync(datOrdner) && fs.existsSync(swPfad)){
    const swText = fs.readFileSync(swPfad, 'utf8');
    const block = swText.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\];/);
    /* Zeilenweise, damit auskommentierte Eintraege draussen bleiben —
       derselbe Griff wie in validate.js. */
    const imVorrat = new Set();
    if (block){
      for (const z of block[1].split(/\r?\n/)){
        if (/^\s*\/\//.test(z)) continue;
        const t = z.match(/['"`]([^'"`]+)['"`]/);
        if (t) imVorrat.add(t[1].replace(/^\.\//, ''));
      }
    }
    const buchDateien = fs.readdirSync(datOrdner)
      .filter(n => n.startsWith('vokabeln-') && n.endsWith('.js'));
    const draussen = buchDateien.filter(n => !imVorrat.has('data/' + n));
    const mb = (namen) => namen.reduce((s, n) =>
      s + fs.statSync(path.join(datOrdner, n)).size, 0) / 1048576;
    /* Eichung: die Liste muss ueberhaupt gelesen worden sein, und mindestens
       eine Datei muss DRIN stehen — sonst misst dieser Block nichts. */
    if (block && imVorrat.size > 10 && draussen.length && draussen.length < buchDateien.length){
      posten.push({
        titel: 'Sollen die Buchvokabeln ohne Netz da sein?',
        zahl: draussen.length, einheit: 'Buchdatei(en)', auswahl: true,
        dazu: mb(draussen).toFixed(2) + ' MB stehen nicht im Offline-Vorrat · '
              + (buchDateien.length - draussen.length) + ' von ' + buchDateien.length + ' schon',
        aufwand: 'ja oder nein — die Änderung sind ' + draussen.length + ' Zeilen in sw.js',
        warum: 'Die App holt eine Buchdatei erst, wenn du das Buch antippst — und legt sie '
             + 'dann im Cache ab. Ein Buch, das du noch nie mit Netz geöffnet hast, ist '
             + 'unterwegs also nicht da. Seit v462 verschwindet deswegen wenigstens nicht '
             + 'mehr die ganze Buchzeile, sondern nur dieses eine Buch. Ob es überhaupt '
             + 'fehlen soll, ist die eigentliche Frage.',
        wie: 'Sag ja, dann kommen die ' + draussen.length + ' Dateien in die ASSETS-Liste '
           + 'und liegen nach dem ersten Start ohne Netz bereit. ⚠️ Der Preis: jede neue '
           + 'Fassung lädt ' + mb(draussen).toFixed(2) + ' MB zusätzlich vor — bei '
           + 'mobilen Daten spürbar, im WLAN nicht. Sag nein, und es bleibt wie jetzt: '
           + 'was du einmal geöffnet hast, ist danach offline da.'
      });
    }
  }
}

/* ✅ ENTSCHIEDEN 22.09.2026: „lass so" — die Posten „Wortmarke: welche Farbe?"
   und „Akzentfarbe: welche wird es?" sind raus. Elias auf „Die Farbe der
   Wortmarke, und welche Akzentfarbe es wird": „lass so". Beide bleiben, wie sie
   heute in der App stehen. Nicht erneut fragen.
   ⚠️ Offen, aber MEINE Idee, nicht seine: die Marke als SVG-Pfad (dann ohne
   Google-Schrift). Nur auf seine Nachfrage — steht in der To-Do. */
/* ⭐ Zwei Posten vom 09.09.2026. Beide sind gemessen, beide sind deine
   Entscheidung — und beide entstanden aus derselben Nacht, in der die
   Pluralkarten ihre Texte bekommen haben. */
/* ✅ ENTSCHIEDEN 22.09.2026: NEIN — der Posten „شدة steht in 19 Eselsbrücken
   und hat keine Karte" ist raus. Elias auf „Soll ich eine schreiben?" (zusammen
   mit der „(gr)"-Frage): „nein". Keine Karte; die Stellen erklären sich aus dem
   Zusammenhang. Nicht erneut vorschlagen. */
/* ✅ ENTSCHIEDEN, deshalb kein Posten mehr: „Deine Fachbegriffe: mit Endung
   oder ohne?" (seit 09.09.2026 hier). Im Chat gefragt: „Sollen Fachbegriffe wie
   حَرْف جَرّ mit Endung stehen, also حَرْفُ جَرٍّ wie auf deiner Regelkarte?" —
   Elias, 16.09.2026, 18:53:56: „ja". Umgesetzt in v505 (Satzmodus) und v506
   (Karten, wo sein Material die Endung belegt). Der Rest ist Arbeit für eine
   Sitzung, keine Frage an ihn — er steht in der To-Do. */
posten.push({
  titel: 'In den Pluraltexten steht eine Zahl — worauf bezieht sie sich?',
  zahl: 77, einheit: 'Pluralkarten mit eigenem Text', dazu: 'seit v453/v454', auswahl: true,
  aufwand: 'eine von drei Antworten, dann rechne ich alles um',
  warum: 'In jedem der 77 neuen Texte steht „N deiner Wörter machen das genau so". '
    + 'N zählt heute die 171 gepflegten Vokabeln. Nehme ich die Buchvokabeln dazu, '
    + 'ändert sich jede dieser Zahlen — und 33 weitere Pluralkarten könnten denselben '
    + 'Text bekommen. Eine Zahl, deren Bezugsgröße unklar ist, ist schlimmer als keine.',
  wie: 'Drei Möglichkeiten: (1) so lassen — N zählt die gepflegten 171. '
    + '(2) alle Buchvokabeln zählen (~4.600, auch was du nie gesehen hast). '
    + '(3) die Zahl ganz raus, nur noch Beispiele („auch مَدْرَسَةٌ → مَدَارِسُ geht so") — '
    + 'immer wahr, aber weniger griffig.',
  seite: '', seiteText: ''
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
  seite: 'https://claude.ai/artifact/3gTMBWufBfG52T8KDRqL3m',
  seiteText: 'Der Bericht'
});
posten.push({
  /* ⭐ v575, 23.09.2026 (Nachtschicht). Auf Handy und Tablet IST Arabisch
     installiert, Chrome meldet es der App aber nicht (Begründung bei
     ARABISCH_OHNE_LISTE in js/sprachausgabe.js). Ob es arabisch klingt, kann
     nur er hören. Raus, sobald beide Geräte in der Diagnose „Ja" oder „Nein"
     zeigen (node werkzeuge/diagnose-holen.mjs). */
  titel: 'Arabisch testen — auf Handy und Tablet je einmal',
  zahl: 2, einheit: 'Geräte', dazu: 'seit v575', auswahl: false,
  aufwand: 'je Gerät eine Minute',
  warum: 'Auf beiden Geräten hast du Arabisch installiert, aber Chrome meldet es der App nicht — deshalb blieb der Hörmodus stumm. '
    + 'Ob die Sprachausgabe trotzdem arabisch spricht, kann die App nicht selbst hören.',
  wie: 'App schließen und neu öffnen. Dann Einstellungen → Hören → „Arabisch testen". Klingt der Satz arabisch: „Ja" — ab dann '
    + 'spricht die App auf diesem Gerät. Klingt er deutsch oder kommt nichts: „Nein". Danach die Diagnose schicken, dann sehe ich deine Antwort.',
  seite: '', seiteText: ''
});
posten.push({
  /* ⭐ Nebenbefund beim Bau von v575: gehSprich() in js/hoeren.js spricht
     ohne gemeldete Stimme einfach los — seine v570-Regel nennt nur den
     Lautsprecherknopf, der Geh-Modus läuft ohne Blick auf den Bildschirm.
     Deshalb eine Frage, kein Bau. */
  titel: 'Geh-Modus: Arabisch erst nach deinem Test?',
  zahl: 1, einheit: 'Frage', dazu: 'seit v575', auswahl: true,
  aufwand: 'ein Wort: „ja" oder „nein"',
  warum: 'Der Geh-Modus liest Arabisch auch dann vor, wenn das Gerät keine arabische Stimme meldet — auch nachdem du im Test „Nein" gesagt hast. '
    + 'Dann käme arabischer Text mit deutscher Aussprache.',
  wie: '„ja": der Geh-Modus spricht Arabisch erst nach deinem Ja im Test, sonst sagt er beim Start, was fehlt. „nein": so lassen.',
  seite: '', seiteText: ''
});
/* ⛔⛔ 23.09.2026 — DIE „HAND VOLL WEITERE" FACHBEGRIFFE. Elias um 15:08: „ich
   hattte spezifisch darum gebeten akkusativ, genitiv und nominativ und
   vielleicht noch eine hand voll weitere zu haben aber nicht solceh dinge."
   Welche die Hand voll sind, weiß nur er — deshalb ruhen alle anderen, bis er
   wählt. Die Liste wird GEMESSEN (FACHBEGRIFF_AUFTRAG gegen die Datei), nicht
   aufgeschrieben: wählt er welche, verschwinden sie hier von selbst.
   ⛔ Keine arabischen Wörter in den Zeilen (seine Regel für Listen an ihn) —
   deshalb die deutsche Bedeutung, Arabisches herausgefiltert. */
{
  const kiste = vm.createContext({ window: {}, __r: {} });
  let ruhend = [], abbestellt = [];
  try {
    vm.runInContext(fs.readFileSync(path.join(REPO, 'data', 'fachbegriffe.js'), 'utf8')
      + ';__r.v = FACHBEGRIFF_VOKABELN; __r.a = (typeof FACHBEGRIFF_AUFTRAG !== "undefined") ? FACHBEGRIFF_AUFTRAG : null;'
      + '__r.weg = (typeof FACHBEGRIFF_ABBESTELLT !== "undefined") ? FACHBEGRIFF_ABBESTELLT : {};', kiste);
    const a = kiste.__r.a, weg = kiste.__r.weg || {};
    const hat = (o, id) => Object.prototype.hasOwnProperty.call(o, String(id));
    /* ⛔ Was er beim Namen abgelehnt hat (FACHBEGRIFF_ABBESTELLT), wird nicht
       noch einmal angeboten — „Übereinstimmung" zur Wahl zu stellen, eine
       Stunde nachdem er sie abbestellt hat, wäre dieselbe Frage zweimal. */
    if (a){ ruhend = kiste.__r.v.filter(w => !hat(a, w.id) && !hat(weg, w.id)); abbestellt = kiste.__r.v.filter(w => hat(weg, w.id)); }
  } catch (e) { console.log('  ⚠ Fachbegriffe nicht lesbar: ' + String(e.message).slice(0, 80)); }
  const NAMEN = { 'gram-ta-marbuta': 'die weibliche Endung (Tāʾ marbūṭa)', 'gram-alif-maqsura': 'das Alif am Wortende (Alif maqṣūra)' };
  const deutsch = (w) => NAMEN[w.id] || String(w.de || '').replace(/\p{Script=Arabic}+/gu, '').replace(/\s{2,}/g, ' ').trim();
  /* ⭐ 23.09.2026, 20:58 — MANCHE GIBT ES SCHON ALS BUCHKARTE. Gemessen: 3 der 18
     ruhenden Begriffe stehen mit derselben Schreibung als „(gr)"-Karte in einem
     Buch — Adjektiv (50428) und Genitivverbindung (50474), beide Madina 1
     Kapitel 24 und bei ihm einzeln freigeschaltet, dazu Subjekt des
     Nominalsatzes (50467). Hier stand pauschal „ruhen: in keiner Kartei, keinem
     Hörmodus" — für ihn falsch: Adjektiv und Genitivverbindung lernt er längst
     als Kapitel-24-Karte, seit v584 auch im Hörmodus. Wählte er sie hier, stünde
     dasselbe Wort zweimal da. Seine Regel dafür (22.09.2026, mudaf): „es gibt
     zwei mudaf, ich möchte eigentlich nur eins haben. lass das in kapitel 24".
     ⚠️ Gleiche Schreibung allein reicht nicht (خَبَر ist auch „Nachricht", ظَرْف
     auch „Umschlag") — erst „(gr)" in der Bedeutung der Buchkarte macht sie zum
     selben Fachbegriff. */
  const nackt = s => String(s || '').normalize('NFC').replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/^ال/, '').replace(/ة$/, 'ه').trim();
  const buchGr = new Map();
  try {
    const k = vm.createContext({ window: {} });
    for (const f of fs.readdirSync(path.join(REPO, 'data')).filter(f => /^vokabeln-.*\.js$/.test(f)))
      try { vm.runInContext(fs.readFileSync(path.join(REPO, 'data', f), 'utf8'), k); } catch {}
    for (const liste of Object.values(k.window.VOKABELN || {}))
      for (const x of (Array.isArray(liste) ? liste : []))
        if (x && x.ar && /\(gr\)/.test(String(x.de || '')) && !buchGr.has(nackt(x.ar))) buchGr.set(nackt(x.ar), x);
  } catch {}
  const buchName = slug => String(slug).replace(/^madina/, 'Madina').replace(/^bayna-yadayk/, 'Bayna Yadayk').replace(/-(\d+)$/, ' $1');
  const zwilling = w => buchGr.get(nackt(w.ar));
  const mitKarte = ruhend.filter(zwilling).length;
  if (ruhend.length) posten.push({
    titel: 'Fachbegriffe: welche „Hand voll" außer Akkusativ, Genitiv und Nominativ?',
    zahl: ruhend.length, einheit: 'ruhen',
    dazu: 'seit v582' + (abbestellt.length ? ' · nicht mehr gefragt, weil du sie abgelehnt hast: ' + abbestellt.map(deutsch).map(t => t.split(' — ')[0]).join(', ') : ''),
    auswahl: true,
    aufwand: 'die Namen nennen, die du als Karte willst — oder „keine"',
    warum: 'Du hast gesagt: Akkusativ, Genitiv und Nominativ „und vielleicht noch eine hand voll weitere", aber nicht solche wie „Übereinstimmung". '
      + 'Seit v582 wird ein Fachbegriff nur noch eine Karte, wenn du ihn bestellt hast. Diese hier ruhen als Fachbegriff: in keiner Kartei, keinem Hörmodus, keiner Suche.'
      + (mitKarte ? ' ' + mitKarte + ' davon gibt es aber schon als Karte in einem Buch (steht dabei) — die kommt mit ihrem Kapitel oder einzeln freigeschaltet, unabhängig von dieser Liste.' : ''),
    wie: 'Nenn die, die du willst. Jeder bekommt eine Zeile mit deinem Satz, dann ist er in Kartei und Hörmodus. Die übrigen bleiben weg.'
      + (mitKarte ? ' Wo „schon als Karte" steht, bekommst du keine zweite: dann schalte ich die Buchkarte frei, wie bei Akkusativ, Genitiv und Nominativ.' : ''),
    zeilen: ruhend.map(w => { const x = zwilling(w); return deutsch(w) + (x ? ' · schon als Karte: ' + buchName(x.book) + ', Kapitel ' + x.chapter : ''); }),
    seite: '', seiteText: ''
  });
}
posten.push({
  /* ⭐ Gemessen am 23.09.2026, 02:55, vom Helfer „Karte in der echten App"
     (Chrome, 448×906 wie sein Pixel, sichtbarer Teil der Rückseite 151–611 px):
     45828 Beispielsatz 617–732, 45829 657–789 — beide ganz außerhalb, rollen
     +147 bzw. +204 px; 45751 teilweise (+119 px). Seine Vorgabe war „nur
     Rückseite … bei der Eselsbrücke" — über die Größe hat er nicht entschieden. */
  /* ⭐ 23.09.2026, 05:1x: dazu die zwei Fragen aus dem To-Do-Block 02:50 (E),
     die nur im Chat und in der To-Do standen — auf keiner Seite. Die dritte
     von dort (Menünamen auf dem Pixel) ist durch „Arabisch testen" überholt. */
  titel: 'Bild zur Eselsbrücke: drei Fragen',
  zahl: 3, einheit: 'Fragen', dazu: 'seit v573', auswahl: true,
  aufwand: 'je Frage ein Wort',
  warum: 'Seit v573 steht bei 86 Wörtern ein Bild auf der Rückseite, so wie du es gewählt hast. Drei Dinge daran hast du noch nicht entschieden.',
  wie: 'Sag die Nummer und deine Antwort, zum Beispiel „1: kleiner" oder „2: raus".',
  zeilen: [
    '1 · Auf deinem Handy schiebt das Bild den Beispielsatz nach unten — bei zwei von drei gemessenen Karten liegt er ganz außerhalb, du musst rollen (der Hinweis, dass es weitergeht, ist da). So lassen, Bild kleiner, oder das Bild an eine andere Stelle?',
    '2 · Vier Emoji zeigen eher ein Nachbarwort als das Wort selbst: 🔒 für „geschlossen", 📚 für „Bibliothek", 🍲 für „Kochtopf", 🛣️ für „Straße". Rausnehmen oder lassen?',
    '3 · Sollen neue Wörter aus neuen Kapiteln nach derselben Regel ein Bild bekommen — oder bleibt es bei den 86?'
  ],
  seite: '', seiteText: ''
});
posten.push({
  /* ⭐ 23.09.2026: werkzeuge/pruefe-themen.mjs meldet seit Tagen „3 Punkt(e)
     für Elias" (Exit 2), und sie standen auf KEINER Seite — maintenance-log.md
     behauptete am 17.09. und 20.09. das Gegenteil (Befund eines Helfers,
     To-Do-Block 02:50, C3). Stand der Zahlen: Lauf vom 23.09., 04:5x.
     Raus, sobald er geantwortet hat. */
  titel: 'Satzmodus-Themen: drei Fragen zur Einteilung',
  zahl: 3, einheit: 'Fragen', dazu: 'aus pruefe-themen.mjs', auswahl: true,
  aufwand: 'je Frage „so lassen" oder was du willst',
  warum: 'Die Themen oben im Satzmodus (Genitiv, Verben, Weiblich …) filtern, welche Regeln du übst. '
    + 'Drei Stellen sehen ungewollt aus — ob sie es sind, hängt an deinem Unterricht, nicht an der Zahl.',
  wie: 'Sag die Nummer und deine Antwort, zum Beispiel „2: zusammenlegen mit Wortarten" oder „alle so lassen".',
  zeilen: [
    '1 · Drei Regeln stehen in zwei Themen zugleich: „Verb enthält das Pronomen" (Wortarten und Verben), „Ortsangabe als Mudaf" (Idafa und Ortsangaben), „Adjektive auf -ān ohne Tanwin" (Adjektiv und al-). So lassen?',
    '2 · „Verben" hat nur 2 Regeln (28 Übungsstellen). Mit einem anderen Thema zusammenlegen oder lassen?',
    '3 · „Genitiv" hat 14 Regeln (128 Übungsstellen) und filtert damit wenig. In zwei Themen teilen oder lassen?'
  ],
  seite: '', seiteText: ''
});

/* ⛔⛔ SECHS FRAGEN, DIE NUR IM CHAT STANDEN (17.09.2026)

   Alle sechs habe ich Elias am 16./17.09. im Chat gestellt — und keine stand
   hier. Nach dem Komprimieren sieht er den Chat nicht mehr; eine Frage, die
   nur dort steht, ist für ihn weg, und für mich sieht sie aus wie „gefragt,
   wartet". Gefunden erst, als ich meine eigenen Antworten Satz für Satz gegen
   diese Seite gelegt habe (Nachfrage-Runden 6 und 7 am 17.09.).
   [[nachfrage_deckt_luecke_auf]]

   ⚠️ Die Zahlen darin sind der Stand, an dem gefragt wurde, und so beschriftet.
   Ist eine davon entschieden, den Posten löschen und die Entscheidung im
   Quelltext vermerken — wie beim Posten „Deine Fachbegriffe" oben. */
/* ✅ ERLEDIGT 22.09.2026: der Posten „Rezitation reißt unterwegs ab: Reparatur holen
   oder neu bauen?" ist raus. Neu gebaut in v535, die Ursache bei ausgeschaltetem
   Bildschirm in v543 behoben — Elias am 20.09.2026: „aber jetzt funktioniert es bei
   ausgeschaltetem display". Der Patch aus dem Web-Chat wird nicht mehr gebraucht. */
/* ✅ ENTSCHIEDEN 22.09.2026: JA — der Posten „Doppelte Karten: gewinnt die
   höhere Box?" ist raus. Elias auf „Seit dem 17.09. gewinnt die mit der höheren
   Box. Passt das?": „ja". Damit ist die höhere Box SEINE Regel, nicht mehr meine
   Deutung. */
/* ✅ BEANTWORTET 22.09.2026: der Posten „Tippe alle Mudaf an: die schwereren
   Aufgaben zuerst?" ist raus. Elias: „lieber die schwereren, generell alle sollen
   so sein bei mudaf und ilayhi" → Modus idafa stellt nur noch Aufgaben mit mehr
   als einem Treffer (js/uebung.js), dazu satz-lang-09 … 18 (v555). */
/* ✅ BEANTWORTET 22.09.2026: der Posten „Dein Lernstand … stimmt das noch?" ist raus.
   Elias: „so stimmt es, bayna habe ich jetzt sogar kapitel 3 angefangen" → in
   data/lernstand.json Madina 1 = 12 (bestätigt), Bayna Yadayk 1 = 3. Die höheren
   Zahlen von arabicroots (24 / 16) sind ausdrücklich KEIN Lernstand — nicht erneut
   fragen, solange er keinen neuen nennt. */
/* ✅ BEANTWORTET 22.09.2026: „immer unterschiedliche sätze", dann auf „ganz
   mischen?": „ja" → js/saetze.js mischt (v557). Der Posten bleibt nur als
   Quelltext stehen und wird nicht mehr gestellt. */
if (false) posten.push({
  titel: 'Satzmodus: jedes Mal dieselben Sätze zuerst — so lassen?',
  zahl: 3, einheit: 'Möglichkeiten', dazu: 'gefragt 16.09.', auswahl: true,
  aufwand: 'eine von drei Antworten',
  warum: 'Die Sätze stehen nach Aktualität, die mit den neuesten Regeln zuerst — so wolltest du es am 06.09. '
    + 'Das heißt aber auch: jedes Mal dieselbe Reihenfolge, jedes Mal ab demselben ersten Satz. Was weiter '
    + 'hinten liegt, siehst du nur, wenn du dich durchblätterst. (Gefragt am 16.09., 04:46.)',
  wie: 'Drei Möglichkeiten: (1) mischen innerhalb gleicher Aktualität — das Neueste bleibt vorn, aber nicht '
    + 'immer derselbe Satz zuerst (meine Empfehlung). (2) ganz mischen — echter Zufall, die Sortierung nach '
    + 'Aktualität fällt weg. (3) weitermachen, wo du warst — wie ein Lesezeichen.',
  seite: '', seiteText: ''
});
/* ✅ ENTSCHIEDEN 22.09.2026: NEIN — der Posten „fatan und 12 weitere: beim
   Auflösen zeigen, woher das n kommt?" ist raus. Elias: „nein". Kein Hinweis auf
   den Karten; nicht erneut vorschlagen. */
/* ⛔⛔ ÄLTERE FRAGEN, DIE NUR IN DER TO-DO STANDEN (17.09.2026).
   Elias fragte: „deine to do ist doch noch nciht fertig oder" — und hatte
   recht. Diese Seite sagte „Alles andere ist erledigt", während die To-Do 44
   offene Kästen führte. Einzeln geprüft (`scratchpad/offene-kaesten.mjs`,
   gegen Code, KV und Projektnotiz): 29 waren längst erledigt oder überholt und
   sind abgehakt; diese 11 warten wirklich auf ihn. Jede Zeile nennt das Datum,
   an dem die Frage entstand. Kein Werkzeug zählt sie — sie stehen hier fest,
   bis er antwortet; beantwortete Nummern von Hand streichen.

   ⭐ STAND 22.09.2026: von 11 sind 7 beantwortet, 4 stehen noch. Was er gesagt
   hat, steht hier im Wortlaut — eine gestrichene Nummer ohne Begründung
   wandert nach zwei Wochen als „hatten wir das schon?" zurück auf die Seite.
     2 Sitzungsgröße        „ja" (raus) → ersatzlos entfernt, v561 (`92e5eb5`)
     4 Satzmodus-Hinweise   sein Bauauftrag im Wortlaut → v562 (`6d2bc1b`)
     5 Raten vorm Umdrehen  „ja lass mal machen" → gebaut
     6 ADHS-Befund          „beides glaube"
     7 Projektnotiz         „oben, räume demtentsprechend um" → 16 Brüche behoben
    10 To-Do-Dubletten      „ja" → die offene Fassung gelöscht, die zwei
                            abgehakten Archivfassungen behalten (sie tragen
                            Belege, die sonst nirgends stehen)
    11 Koran-Verszeichen    „so lassen" → nichts gebaut */
posten.push({
  titel: 'Ältere Fragen, die nur in der To-Do standen — gelten sie noch?',
  zahl: 6, einheit: 'Fragen', dazu: 'von 11 aus dem 17.09. sind 8 beantwortet · 3 neu gefunden am 23.09.', auswahl: true,
  aufwand: 'je Frage eine kurze Antwort — oder „streichen"',
  /* 23.09.2026: die frühere Frage 2 (Bild zur Eselsbrücke) ist beantwortet —
     „Eselsbrücken-Bild: C · Mischung · die 72 + die 14 Beziehungswörter · nur
     Rückseite" — und in v573 gebaut. Die Nummern bleiben, damit eine Antwort
     wie „3: raus" dieselbe Frage meint wie auf der älteren Seite. */
  warum: 'Am 17.09. standen hier 11 Fragen aus der To-Do. Acht hast du inzwischen beantwortet, und alles, '
    + 'was daraus zu bauen war, ist gebaut und ausgeliefert (v561, v562, v573). Diese drei stehen noch, dazu drei, '
    + 'die am 23.09. in alten Abschnitten der To-Do auftauchten (12–14). '
    + 'Was du streichst, baue ich nicht.',
  wie: 'Sag die Nummer und deine Antwort, zum Beispiel „3: raus". Oder „alle streichen".',
  zeilen: [
    '1 · Koran: Die Ansicht „Kästchen" hat keinen Rahmen mehr. Umbenennen, zum Beispiel in „Einzeln"? (08.09.)',
    '3 · Vier Regeln zusammenlegen? Deine Notizen vom 26.08. zu: mudaf ohne al- · mudaf erkennen · idafa-Verkettung · der Buchstabe bi. Sagen sie dasselbe?',
    '4 · Die Regel „Subjekt und Aussage" (mubtada und khabar): Deine Notiz sagt, sie kommt erst nach Kapitel 9 dran. Später zeigen oder lassen? (26.08.)',
    /* ⭐ 23.09.2026 nachgetragen: drei Fragen, die ein Helfer beim Durchsehen
       der alten ⬜-Abschnitte fand und die auf KEINER Seite standen (To-Do,
       Block 02:50, D). Nummern ab 12, damit „3: raus" weiter dieselbe Frage
       meint wie auf der älteren Seite. */
    '12 · Die Regel zu den Verbendungen in der Vergangenheit: seit dem 11.09. liegt eine neue Fassung als Entwurf bereit, in der App gilt noch die alte. Du hattest am 26.08. geschrieben, daraus müsse „wirklich eine gute regel" werden. Den Entwurf übernehmen?',
    '13 · Regeltexte, die du in der App selbst umgeschrieben hast (Regelsammlung): Sollen deine Fassungen die ursprünglichen Texte ersetzen, damit sie überall gelten — auch in den Übungen?',
    '14 · „Löschen" in der Regelsammlung nimmt eine Regel nicht aus dem Satzmodus. Soll Löschen sie auch dort herausnehmen?'
  ],
  seite: '', seiteText: ''
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
  /* ⛔⛔ SEIT DEM 22.09.2026 ZAEHLT DIESER POSTEN ETWAS ANDERES.
     Bis dahin stand hier die Zahl der FUNDSTELLEN — zuletzt 95 — und damit
     genau das, was Elias am 22.09. abgeraeumt hat:
       „wir hatten ausgemacht das du das machen sollst bzw bewerten sollst"
     Jetzt bewerte ich jede Fundstelle gegen die Schluessel, den Unterricht und
     seine Unterlagen (`werkzeuge/kandidaten-bewerten.mjs`), und hier steht nur
     noch, was ohne ihn nicht zu entscheiden ist. Gemessen: 95 -> 7.

     ⚠️ Die alte Vorsortierung („X der Y liegen in einem Zeitfenster, aus dem
     schon eine Regel stammt") ist damit hinfaellig: sie war eine Rangfolge
     fuer IHN. Wer bewertet, braucht keine Rangfolge mehr, sondern ein Urteil.

     ⛔ Faellt bewertung.json aus, wird die alte Zahl NICHT ersatzweise
     gemeldet. Eine 95 auf seiner Warteseite waere die Rueckkehr in den alten
     Zustand, und niemand saehe der Seite an, dass sie eine Notloesung zeigt.
     Stattdessen sagt der Posten, dass die Bewertung fehlt.
     [[leere_liste_ist_keine_messung]] */
  let bewertung = null;
  try {
    const bp = path.join(kand, 'bewertung.json');
    if (fs.existsSync(bp)) bewertung = JSON.parse(fs.readFileSync(bp, 'utf8'));
  } catch (e) {
    console.log('  ⚠️ bewertung.json nicht lesbar: ' + e.message);
  }
  /* ⛔ Die Vorsortierung „X der Y liegen in einem Zeitfenster, aus dem schon
     eine Regel stammt" stand hier bis zum 22.09.2026 und ist WEGGEFALLEN, nicht
     kaputtgegangen. Sie war eine Rangfolge für IHN, damit er die 95 in einer
     sinnvollen Reihenfolge abarbeitet. Seit ich bewerte, gibt es keine 95 mehr,
     die er abarbeitet — und eine Rangfolge über sieben Stück ist keine Hilfe,
     sondern Text. Der Vorgänger steht in `git show 8f24c60:werkzeuge/wartet-auf-elias.mjs`. */

  if (!bewertung) {
    posten.push({
      titel: 'Regelkandidaten: die Bewertung fehlt',
      zahl: Math.max(0, offen - beantwortet), einheit: 'Fundstellen', dazu: folgen.join(' · '),
      aufwand: 'nichts — das ist meine Arbeit, nicht deine',
      warum: 'Aus den Fundstellen werden neue Grammatikregeln, und ich sollte sie vorher gegen die '
        + 'Schlüsselbücher prüfen. Diese Prüfung fehlt gerade (transcripts/kandidaten/bewertung.json ist '
        + 'nicht da). Ich lege dir die rohen Fundstellen NICHT vor — genau das wolltest du nicht.',
      wie: 'Nichts tun. Ich hole die Bewertung nach.',
      seite: '', seiteText: ''
    });
  } else {
    const fuerIhn = (bewertung.kandidaten || []).filter(k =>
      k.urteil === 'regel' || k.urteil === 'abweichung' || k.urteil === 'unbelegt');
    const zahl = (art) => fuerIhn.filter(k => k.urteil === art).length;
    if (fuerIhn.length) posten.push({
      titel: 'Regelkandidaten: die sieben, die ich nicht allein entscheiden kann',
      zahl: fuerIhn.length, einheit: 'Entscheidungen',
      dazu: 'aus ' + bewertung.gesamt + ' Fundstellen · ' + bewertung.vonMir + ' habe ich selbst entschieden',
      auswahl: true,
      aufwand: 'je Frage ein Ja oder Nein — die Belege stehen dabei',
      warum: 'Ich habe alle ' + bewertung.gesamt + ' Fundstellen gegen die Schlüsselbücher, den Unterricht und '
        + 'deine Unterlagen geprüft. ' + bewertung.vonMir + ' konnte ich selbst entscheiden — dort steht der '
        + 'Inhalt schon als Regel, oder es ist gar keine drin. Übrig sind diese: '
        + zahl('regel') + ' neue Regeln, die ich vorschlage — eintragen darf sie nur dein Ja; '
        + zahl('abweichung') + ' Stelle(n), wo Schlüssel und Lehrer sich widersprechen; '
        + zahl('unbelegt') + ', die der Lehrer sagt und kein Schlüssel bestätigt.'
        + (bewertung.rueckstand ? ' ⚠️ ' + bewertung.rueckstand + ' habe ich noch nicht durch — mein Rückstand, nicht deiner.' : ''),
      wie: 'Auf der Freigabeseite antippen, unten den Text kopieren, in den Chat schicken.',
      zeilen: fuerIhn.map((k, i) => (i + 1) + ' · ' + (k.frage || k.grund || '').slice(0, 200)),
      seite: 'https://claude.ai/artifact/2GJFK49B8LvWJaBu337qU4',
      seiteText: 'Die Freigabeseite'
    });
  }
} catch (e) {
  console.log('  ⚠️ Regelkandidaten nicht lesbar: ' + e.message);
}

/* ---------- Arabisch, das in SEINEN Notizen rueckwaerts steht (09.09.2026) --
 *
 * ⛔⛔ Die Bidi-Drehung dieses Tages steckt nicht nur in der App und in den
 * erzeugten Seiten, sondern auch in den beiden Obsidian-Notizen, die er
 * taeglich liest. Im Browser nachgestellt (reiner Text, LTR-Absatz — genau
 * Obsidians Lesemodus): das erste Wort landet RECHTS. Jedes „Singular →
 * Plural", das dort steht, liest er verkehrt herum.
 *
 * ⛔ In Markdown hilft KEIN CSS: es gibt kein Element um die Laeufe, das man
 * isolieren koennte. Was wirkt, sind Steuerzeichen IM TEXT (U+2068/U+2069 oder
 * U+200E) — und das sind ein paar hundert unsichtbare Zeichen in seinen
 * Notizen, die meine eigenen Pruefwerkzeuge mit Mustern lesen. Deshalb
 * vorgelegt statt eingebaut. [[rtl_richtung_physisch]] [[schweigen_ist_kein_auftrag]]
 *
 * ⚠️ Gezaehlt wird ueber dieselbe Regel wie in werkzeuge/pruefe-bidi.mjs:
 * zwei arabische Laeufe mit einem neutralen Zeichen dazwischen. Die
 * Zeichenklassen stehen als Codepunkte da, nicht abgeschrieben.
 */
try {
  const zp = (c) => String.fromCharCode(c);
  const AR = '[' + zp(0x621) + '-' + zp(0x652) + zp(0x640) + ']';
  /* ⛔ ZWEI Zaehlungen, und der Unterschied ist eine Aussage, keine Ungenauigkeit.
     Beide Sorten stehen auf dem Schirm rueckwaerts. Aber nur bei einem
     RICHTUNGSZEICHEN traegt die Reihenfolge die Bedeutung („Singular →
     Plural"); bei Komma und Semikolon ist es eine Aufzaehlung, in der die
     Umkehrung stoert, aber nichts verfaelscht. Wer nur eine Zahl nennt, waehlt
     zwischen „zu klein" und „zu gross" — hier stehen beide.
     [[sammelaussage_einzeln_belegen]] */
  const bau = (trenner) => new RegExp('(' + AR + '+(?: +' + AR + '+)*)( *['
    + trenner + '] *)(' + AR + '+)', 'g');
  const PAAR      = bau(zp(0x2192) + zp(0x2190) + '/' + zp(0xB7) + '=');
  const PAAR_WEIT = bau(zp(0x2192) + zp(0x2190) + '/' + zp(0xB7) + '=,;');
  const ISOLAT = new RegExp('[' + zp(0x2066) + '-' + zp(0x2069) + zp(0x200E) + ']', 'g');
  const NOTIZEN = [
    ['To-Do Vokabeltrainer.md', TODO],
    ['Vokabeltrainer-Arabisch.md',
      'G:\\1. Workspace\\Obsidian\\Gedächtnis\\Elias Gedächtnis\\03 - Projekte\\Vokabeltrainer-Arabisch.md'],
  ];
  let paare = 0, alle = 0, isolate = 0; const proNotiz = [];
  for (const [name, pfad] of NOTIZEN){
    if (!fs.existsSync(pfad)) continue;
    const t = fs.readFileSync(pfad, 'utf8');
    const p = (t.match(PAAR) || []).length;
    const w = (t.match(PAAR_WEIT) || []).length;
    paare += p; alle += w;
    isolate += (t.match(ISOLAT) || []).length;
    proNotiz.push(name + ': ' + p + ' von ' + w);
  }
  /* ✅ ENTSCHIEDEN 22.09.2026: nichts nachträglich reparieren. Elias fragte
     zuerst „wie rückwärts, das kann gar nicht sein. prüfe nochmals nach" —
     nachgemessen (Zeile 821 von Vokabeltrainer-Arabisch.md, im Pane: die
     bestimmte Form steht links vom Pfeil, gelesen „an-najmu → najmun"). Auf
     „nichts nachträglich reparieren, ich schreibe ab jetzt so, dass es nicht
     mehr kippt": „einverstanden". Die Zählung bleibt, der Posten fragt nicht mehr. */
  const RUECKWAERTS_ENTSCHIEDEN = true;
  if (paare > 0 && isolate === 0 && !RUECKWAERTS_ENTSCHIEDEN) posten.push({
    titel: 'Arabisch steht in deinen Notizen rückwärts',
    zahl: alle, einheit: 'Stellen', auswahl: true,
    dazu: paare + ' davon mit einem Richtungszeichen (→ ← / · =) · ' + proNotiz.join(' · '),
    aufwand: 'eine Entscheidung — ja oder nein; die Änderung selbst macht ein Werkzeug',
    warum: 'Nicht die App, sondern der Text, den du in Obsidian liest. Wo zwei arabische'
      + ' Wörter mit einem Zeichen dazwischen stehen, bekommt das Zeichen deren Richtung'
      + ' und der ganze Ausdruck kippt: „Singular → Plural" liest sich bei dir als'
      + ' „Plural → Singular". Im Browser nachgestellt und gemessen — dasselbe Muster,'
      + ' das heute in der App und auf vier Entscheidungsseiten behoben wurde.'
      + ' ⚠️ Die beiden Zahlen sagen Verschiedenes: bei einem RICHTUNGSZEICHEN trägt die'
      + ' Reihenfolge die Bedeutung, bei Komma oder Semikolon ist es eine Aufzählung —'
      + ' dort stört die Umkehrung, verfälscht aber nichts.',
    wie: 'Hier hilft KEIN CSS — in Markdown gibt es kein Element um die Läufe. Was wirkt,'
      + ' sind unsichtbare Steuerzeichen im Text (U+2068/U+2069 oder U+200E), also'
      + ' mehrere hundert Zeichen in deinen Notizen. Sag ja, dann baue ich ein Werkzeug,'
      + ' das sie setzt — mit Sicherung vorher und einer Gegenprobe, dass sich sonst'
      + ' nichts ändert. Sag nein, dann bleibt es, wie es ist, und ich schreibe künftige'
      + ' Paare so, dass sie ohne Steuerzeichen richtig stehen (Wort, Doppelpunkt, Wort).',
    seite: '', seiteText: ''
  });
} catch (e){
  console.log('  ⚠️ Bidi-Zaehlung in den Notizen nicht moeglich: ' + e.message);
}

/* ⭐ Alle Seiten, die es fuer ihn gibt. Sie stehen HIER, weil diese Seite die
   ist, die er aufmacht — eine Adresse, die man nicht findet, ist so gut wie
   keine. ⚠️ Beim Anlegen eines neuen Artefakts hier ergaenzen; die URL bleibt
   ueber Aktualisierungen hinweg dieselbe. */
const ARTEFAKTE = [
  /* Neu veröffentlicht am 16.09.2026 — die alte Adresse 4c3a7c9e… war seit dem
     09.09. tot, und „keine neue anlegen" hatte die Seite eine Woche weg gelassen. */
  ['Was auf dich wartet',   'Hukk2F5jbFqnLsnW5H9QfN', 'diese Seite — alle offenen Entscheidungen'],
  ['Die Fragenseite',       '5ChpdN9n7PAiTY4B5ZHud3', 'die offenen Feldangaben, ein Durchgang je Frage'],
  /* ⭐ Am 16.09.2026 (Wartung Mi) vom Wächter gemeldet — derselbe Fall wie beim
     Lagebericht am 21.08.: die Seite war seit dem 15.09. gebaut, hatte eine URL
     in DATEI_ZU_URL und stand auf keiner Liste, die Elias sieht. Ausgerechnet
     die, zu der er am selben Tag sagte: „mach sie ganz nach oben und hebe sie
     hervor und schreib in to do von mir diese unbedingt zu machen." */
  ['Die Regelkategorien',   'DHhYFwtTNJADVwE2tVUDz3', 'alle 103 Regeln nach Kategorien — gehört diese Regel in die App?'],
  ['Der Wartungskreislauf', '9ec136ba-019d-438b-98af-e57939eb4a99', 'wie das System läuft — vier Phasen, dreizehn Prüfungen'],
  /* ⭐ Am 21.08. vom eigenen Wächter gemeldet: „1 Seite hat eine URL, steht
     aber auf KEINER Liste, die Elias sieht." Genau der Fall, für den er
     gebaut wurde — eine Adresse, die man nicht findet, ist so gut wie keine. */
  ['Lagebericht', '3eb1fcc3-e2ca-4c89-947c-9e382068e9e3', '48 Stunden Arbeit, der Stand des Goal-Prompts, mit Nachtrag vom 21.08.'],
  ['Vierzehn Schriften',    '57KC3EW5mc9AvkUCt6pnF4', 'die Wortmarke طالب zur Auswahl'],
  /* 17.09.2026: diese zwei lagen seit dem 21.08. als Datei ohne Zuordnung da
     (Wächter unten: „2 Artefakt-Seiten ohne hinterlegte URL"). Beide SIND
     veröffentlicht — über den <title> in `Artifact list` zugeordnet. */
  ['طالب in deinen Farben', '4yfD1FeCGm2dna7ioELBuG', 'die Wortmarke in den Akzentfarben — zur Frage „welche Farbe?"'],
  ['Das Farbgerüst',        'Ai2qerHN3q9xxeLoeD3f3o', 'acht Akzentfarben an dreizehn Flächen'],
  ['Eine Stimme fürs Arabische', '3gTMBWufBfG52T8KDRqL3m', 'vier Wege, mit den gemessenen Kosten'],
  ['Die beste Stimme fürs Arabische', 'ESSZpD31nn4gaVCPnWafcp', 'die Stimmen zum Anhören, Stand 21.08.']
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
  ['Regelprüfung Madina 1', '4iMdxRvKkFHj699cfyHbra',
   'deine Beurteilung der Regeln — Schlüssel regelpruefung-v1, deine Antworten liegen darin'],
  /* ⚠️ 22.09.2026 zum DRITTEN Mal neu veröffentlicht. Vorgänger:
     `d9916aee-b679-4d91-bb0c-c3642f8889ac` (tot seit der UUID-Umstellung am
     15.09.) und `DMKVDttK5HMMAEY62HDafF` (die alte Bauform mit allen 95
     Fundstellen, von Elias am 22.09. selbst gelöscht). Und der Schlüssel heißt
     seither `regelkandidaten-v2`: die Knöpfe fragen etwas anderes, alte
     v1-Antworten würden stumm falsch zugeordnet. */
  ['Regelkandidaten freigeben', '2GJFK49B8LvWJaBu337qU4',
   'die sieben, die ich nicht allein entscheiden kann — Schlüssel regelkandidaten-v2'],
  /* ⛔ Diese drei tragen einen eigenen Speicher — also deine Antworten — und
     standen bis zum 20.08.2026 auf KEINER Liste. Eine Adresse, die man nicht
     findet, ist so gut wie keine; und wer eine davon ohne ihre URL neu
     veroeffentlicht, laesst die Antworten in der alten Fassung zurueck. */
  ['Ähnliche Regeln zusammenfassen?', 'LMHMc79nzyNS3BZpm76kqW',
   'acht gemessene Regelgruppen zum Verschmelzen — Schlüssel verschmelzung-v1'],
  ['Neun Befunde', 'bc9b71c0-5ea6-451b-9f02-0fbc9fbdd63d',
   'die Befunde aus der Nacht auf den 19.08. — Schlüssel befunde-v1'],
  ['Die Wortmarke im Kopf der App', 'FZiAaexEgyEVxPKyZqURCC',
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
  'wartet-auf-elias.html':        'Hukk2F5jbFqnLsnW5H9QfN',
  'wartungsfragen-artefakt.html': '5ChpdN9n7PAiTY4B5ZHud3',
  'regelkategorien.html':         'DHhYFwtTNJADVwE2tVUDz3',
  'wartungskreislauf.html':       '9ec136ba-019d-438b-98af-e57939eb4a99',
  'schriften-talib-artefakt.html':'57KC3EW5mc9AvkUCt6pnF4',
  'farben-artefakt.html':         'Ai2qerHN3q9xxeLoeD3f3o',
  'stimme-artefakt.html':         '3gTMBWufBfG52T8KDRqL3m',
  /* 17.09.2026 über den <title> zugeordnet (Artifact list): beide seit 21.08. veröffentlicht. */
  'farbe-wortmarke.html':         '4yfD1FeCGm2dna7ioELBuG',
  'stimmen-liste.html':           'ESSZpD31nn4gaVCPnWafcp',
  'regelpruefung.html':           '4iMdxRvKkFHj699cfyHbra',
  /* ⚠️ Dritte Adresse für dieselbe Seite. d9916aee… starb an der
     UUID-Umstellung (15.09.), DMKVDttK5HMMAEY62HDafF hat Elias am 22.09. selbst
     gelöscht — es war die Fassung mit allen 95 Fundstellen, die er nicht wollte. */
  'freigabe.html':                '2GJFK49B8LvWJaBu337qU4',   /* neu veröffentlicht am Abend des 22.09.2026 */
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
  '../verschmelzung.html':        'LMHMc79nzyNS3BZpm76kqW',   /* verschmelzung-v1 */
  '../wortmarke-entwuerfe.html':  'FZiAaexEgyEVxPKyZqURCC',   /* wortmarke-v1 */
  '../vorschau-stamm.html':       '9xcV7t9qPqQzzQ76DDEc6m',
  '../vorschau-modusleisten.html':'3NuaY9Gm44TmrHrpSQwFAX',
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

/* ⛔⛔ ARABISCHE LAEUFE EINZELN VERPACKEN (09.09.2026, im Browser gemessen).
   Auf DIESER Seite standen **7 von 7** Stellen mit zwei arabischen Laeufen
   verkehrt herum, darunter „وَاحِدٌ → وَاحِدَةٌ" (x=110 gegen x=60). Ein Pfeil,
   ein Schraegstrich oder ein „·" zwischen zwei arabischen Laeufen ist ein
   NEUTRALES Zeichen und bekommt deren Richtung — der ganze Ausdruck kippt.

   ⚠️ Auf dem `<li>` stand `unicode-bidi: isolate` schon, als Vorgabe des
   Browsers. Das beweist, dass es NICHT reicht: Isolation am aeusseren Kasten
   trennt ihn von der Umgebung, nicht die beiden Laeufe voneinander.

   ⭐ Verpackt wird NICHT hier an jeder einzelnen Stelle, sondern EINMAL am
   Ende ueber die fertige Seite: `arabischInSeite(html)`. Der erste Anlauf
   ersetzte jedes `esc(x)` von Hand durch ein `txt(x)` — bei vier Seiten und
   ueber fuenfzig Stellen ist das genau die Arbeit, bei der die letzte Stelle
   vergessen wird, und bei jeder stellt sich die Frage, ob sie in einem
   ATTRIBUT steht (dort waere ein <span> ein Fehler). Der Handgriff am Ende
   kennt den Unterschied.
   [[rtl_richtung_physisch]] [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
/* ⛔⛔ ALTE ADRESSEN SIND TOT — und ein toter Knopf schickt ihn ins Leere.
   Die Artefakte wechselten von UUID auf Kurz-ID; am 15.09.2026 lebten neun
   Seiten unter neuer Adresse weiter, sechs gab es nicht mehr. Am 16.09.2026
   um 21:26 wieder nachgesehen (Artifact list, 27 Seiten): keine einzige
   Kennung im UUID-Format ist darunter. Bis dahin baute diese Seite trotzdem
   sechs Verweise darauf, zwei davon als Knopf („Die Freigabeseite →").
   ⭐ Allgemeine Regel statt Liste: das alte FORMAT ist das Merkmal, nicht eine
   Aufzählung der sechs — eine siebte alte Adresse fällt genauso auf.
   Eine tote Seite wird genannt, aber nicht verlinkt.
   [[allgemeine_regel_statt_listeneintrag]] [[alte_fassung_beim_nutzer]] */
const ALTE_ADRESSE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const istTot = (id) => ALTE_ADRESSE.test(String(id || '').split('/').pop());
/* Eichung: beide Ausgänge, auch als ganze Adresse — sonst verlinkt die Seite
   still wieder ins Leere oder versteckt eine lebende Seite. */
if (!istTot('4c3a7c9e-c288-480c-bb1f-e2d7cd26d856') || !istTot('https://claude.ai/artifact/d9916aee-b679-4d91-bb0c-c3642f8889ac')
    || istTot('Hukk2F5jbFqnLsnW5H9QfN') || istTot('https://claude.ai/artifact/5ChpdN9n7PAiTY4B5ZHud3')) {
  console.error('⛔ EICHUNG istTot FEHLGESCHLAGEN — alte und neue Adressen werden nicht unterschieden.');
  process.exit(1);
}
const seitenZeile = ([n, id, was]) => istTot(id)
  ? `<li><span class="tot">${esc(n)}</span> <span>${esc(was)} — ⚠️ nicht mehr abrufbar (alte Adresse); sag Bescheid, wenn du sie brauchst</span></li>`
  : `<li><a href="https://claude.ai/artifact/${id}">${esc(n)}</a> <span>${esc(was)}</span></li>`;

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
  ${p.seite && istTot(p.seite) ? `<p class="warum"><span class="marke">Seite</span> ⚠️ „${esc(p.seiteText || 'Die Seite')}" ist nicht mehr abrufbar (alte Adresse) — sag Bescheid, dann baue ich sie neu.</p>` : ''}
  ${p.seite && !istTot(p.seite) ? `<a class="knopf" href="${esc(p.seite)}" target="_blank" rel="noopener">${esc(p.seiteText || 'Öffnen')} →</a>` : ''}
</article>`).join('\n');

const html = `<title>Was auf dich wartet</title>
<style>
/* Die Zeile kommt aus werkzeuge/arabisch-hervorheben.mjs — dort steht sie
   EINMAL, damit die naechste erzeugte Seite sie nicht wieder vergisst. */
${BIDI_CSS}
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
.seiten .tot{color:var(--leise);font-weight:600;font-size:.95rem}
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
<ul class="seiten">${LAUFEND.map(seitenZeile).join('')}</ul>

<h3>Alle Seiten für dich</h3>
<ul class="seiten">${ARTEFAKTE.map(seitenZeile).join('')}</ul>

<p class="fuss">Erzeugt von <code>werkzeuge/wartet-auf-elias.mjs</code>. Die
Zahlen kommen aus <code>vorrat.mjs</code>, <code>pruefe-taschkil.js</code>,
<code>pruefe-funktionen.js</code> und <code>pruefe-duplikate.js</code> — live bei jedem Lauf, nicht abgeschrieben.</p>
</div>
`;

const ZIEL = path.join(REPO, 'artefakte', 'wartet-auf-elias.html');
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL + '.neu', arabischInSeite(html), 'utf8');
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
/* ⛔⛔ DIE URL KOMMT AUS DER TABELLE, NICHT NOCH EINMAL VON HAND (09.09.2026).
   Hier stand sie ein zweites Mal als Zeichenkette. Zwei Stellen, eine
   Tatsache — sie koennen auseinanderlaufen, ohne dass etwas meldet.
   [[dieselbe_frage_zwei_antworten]]

   ⛔⛔ UND SIE IST NICHT BESTAETIGT. Am 09.09.2026 nach 16:05 aus einer Sitzung
   nachgesehen: die Artefaktliste dieses Kontos umfasst **22** Seiten, und
   SECHS der hier hinterlegten Adressen sind nicht darunter —

       wartet-auf-elias.html   4c3a7c9e…   (diese Seite!)
       wartungskreislauf.html  9ec136ba…
       freigabe.html           d9916aee…
       lagebericht.html        3eb1fcc3…
       ../regelauswahl.html    da4af296…
       ../befunde.html         bc9b71c0…

   Ein Abruf von 4c3a7c9e ergab woertlich „artifact not found — it may have
   been deleted, or it has not been shared with you". Wer der Zeile darunter
   folgt und „dieselbe URL wiederverwendet", bekommt also einen Fehlschlag —
   und legt beim naechsten Versuch genau die zweite Seite an, vor der hier
   gewarnt wird.

   ⚠️ Was das WERKZEUG nicht kann: nachsehen. Es hat keinen Zugang zur
   Artefaktliste; das geht nur aus einer Sitzung. Deshalb steht hier keine
   Automatik, sondern das Datum der letzten Bestaetigung — eine Adresse ohne
   Datum ist eine Behauptung. [[zahlen_ohne_beleg]] [[daten_ohne_zugang]]

   ✅ 16.09.2026, 21:29: neu veröffentlicht unter `VmQqStC4ayzrvkz1GiJaEa`, nachdem
   die Artefaktliste (27 Seiten, 21:26) die alte Adresse wieder nicht kannte.
   ⛔ „Keine neue anlegen" gilt nur, solange die alte existiert — die Regel hat
   die Seite eine Woche ferngehalten. [[alte_fassung_beim_nutzer]]

   ✅ 22.09.2026: und schon wieder. `VmQqStC4ayzrvkz1GiJaEa` antwortete beim
   Lesen mit „artifact not found — it may have been deleted"; neu veröffentlicht
   unter `Hukk2F5jbFqnLsnW5H9QfN`. Das ist die DRITTE Adresse für dieselbe Seite
   in sieben Tagen.
   ⭐ Die Lehre daraus ist nicht „öfter nachsehen", sondern: **vor dem
   Veröffentlichen lesen.** Ein `Artifact read` auf die eingetragene Adresse
   kostet einen Zug und sagt sofort, ob sie noch lebt. Wer stattdessen blind
   „mit url" veröffentlicht, bekommt einen Fehlschlag — und legt beim nächsten
   Versuch genau die zweite Seite an, vor der hier gewarnt wird. */
const eigeneId = DATEI_ZU_URL['wartet-auf-elias.html'];
console.log('  ⚠️ Veroeffentlichen kann die Routine nicht selbst — das braucht eine Sitzung.');
console.log('     Diese Adresse wiederverwenden (Artifact publish mit url), keine zweite Seite anlegen —');
console.log('     es sei denn, Artifact list kennt sie nicht mehr (Stand 16.09.2026: lebt):');
console.log('     https://claude.ai/artifact/' + eigeneId);
process.exit(posten.length ? 2 : 0);
