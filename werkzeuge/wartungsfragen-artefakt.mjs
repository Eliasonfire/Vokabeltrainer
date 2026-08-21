/* wartungsfragen-artefakt.mjs — alles, was nach dem Wartungslauf noch auf
 * Elias wartet, auf einer Seite, in einem Durchgang beantwortbar.
 *
 *   node werkzeuge/wartungsfragen-artefakt.mjs
 *
 * Ergebnis: artefakte/wartungsfragen.html
 *
 * ================== WOZU ===================================================
 *
 * Elias am 20.08.2026:
 *
 *   „sobald alles automatisch funktioniert und fertig abläuft und nur noch das
 *    übrig ist was ich erledigen muss in dem zusammenhang, soll mir die
 *    bearbeitung der restlichen aufgaben sehr leicht gemacht werden und
 *    angenehm für mich erledigbar gestaltet werden, auf dass ich das jedes mal
 *    mit so geringem zeit und arbeitaufwand wie nur möglich erledigen kann."
 *
 * Und am 19.08.2026, nachdem er 55 von 95 Regeln durchgegangen war:
 *
 *   „die entscheidung zu treffen muss so leicht sein wie das artefakt das ich
 *    heute bearbeitet habe, am besten so in der art machen wir es oder auch
 *    genauso."
 *
 * Bis heute standen diese Fragen im Bericht des Wartungslaufs und in der
 * To-Do-Datei — 6376 Zeilen, in der er suchen und dann im Chat antworten muss.
 * [[verbesserung_hinter_dem_aufklapper]]
 *
 * ⭐ EIN DURCHGANG JE FELD, NICHT JE WORT. Am 20.08. gemessen: 25 der 48 Fragen
 * betreffen dasselbe (hat das Wort einen Plural?), und 15 davon sind Länder-
 * und Städtenamen. Als 48 Einzelfragen ist das eine halbe Stunde; als vier
 * Abschnitte mit „alle auswählen" sind es zwei Minuten.
 *
 * ⛔ EIGENER SPEICHERSCHLUESSEL: 'wartungsfragen-v1'.
 * NICHT 'regelpruefung-v1' (dort liegen seine 55 Regelurteile), nicht
 * 'regelkandidaten-v1', nicht 'satzmodus-auswahl-v1'. Zwei Seiten auf einem
 * Schlüssel löschen einander die Antworten, und ich kann seinen localStorage
 * weder lesen noch sichern — der Schaden wäre unumkehrbar und unbemerkt.
 * [[vier_neue_artefakte]]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIEL = path.join(REPO, 'artefakte', 'wartungsfragen.html');
const TMP  = path.join(REPO, '.wartungsfragen.json');

/* ---------- Fragen holen ---------- */
/* ⛔ vorrat.mjs beendet sich mit Exitcode 2, wenn etwas offen ist — das ist
   hier der NORMALFALL, nicht der Fehler. execFileSync würde darauf werfen. */
try {
  execFileSync(process.execPath, [path.join(REPO, 'werkzeuge', 'vorrat.mjs'), '--offene-fragen', TMP],
    { cwd: REPO, stdio: 'pipe' });
} catch (e) {
  if (!fs.existsSync(TMP)) { console.error('vorrat.mjs lieferte keine Fragen:', e.message); process.exit(1); }
}
const daten = JSON.parse(fs.readFileSync(TMP, 'utf8'));
fs.unlinkSync(TMP);

const fragen = daten.fragen || [];
/* ⛔ ZWEI verschiedene Zahlen, und sie zu verwechseln ergibt eine falsche
   Auskunft: `anzahl` sind die fehlenden ANGABEN, `betroffen` die Wörter.
   Ein Wort kann zwei Angaben vermissen (اليوم fehlt femSg, andere fehlt pl
   und root). Am 20.08. stand deshalb erst „141 vollständig" auf der Seite,
   während vorrat.mjs 152 meldete. [[widerspruch_liegt_in_der_beschriftung]] */
const anzahl = fragen.reduce((s, f) => s + f.woerter.length, 0);
const betroffen = new Set(fragen.flatMap(f => f.woerter.map(w => String(w.id)))).size;
if (!anzahl) {
  /* ⛔ „Keine Seite bauen" ist NICHT dasselbe wie „die Seite sagt, dass
     nichts offen ist". Die alte Fassung bliebe liegen — lokal UND als
     veroeffentlichtes Artefakt — und zeigte ihm Fragen, die er laengst
     beantwortet hat. Der beste Zustand darf nicht der irrefuehrendste sein.
     [[flaeche_nur_im_gefuellten_zustand]] [[eingefrorenes_feld_ist_kein_zustand]] */
  const leer = [
    '<title>Offene Fragen der Wartung</title>',
    '<style>:root{color-scheme:dark}body{margin:0;background:#000;color:#f4f4f6;'
      + 'font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'
      + 'padding:38px 16px}.h{max-width:640px;margin:0 auto}h1{font-size:2rem;margin:0 0 16px}'
      + 'p{color:#9a9aa4}b{color:#f4f4f6}</style>',
    '<div class="h">',
    '<h1>✓ Nichts offen</h1>',
    '<p><b>Alle Angaben sind da.</b> Zu keiner Vokabel im Fenster fehlt noch'
      + ' ein Feld, das ich nicht selbst entscheiden darf.</p>',
    '<p>Diese Seite wird bei jedem Wartungslauf neu erzeugt. Sobald eine neue'
      + ' Vokabel dazukommt, der etwas fehlt, stehen die Fragen wieder hier.</p>',
    '<p style="color:#6b6b75;font-size:.85rem">Stand ' + new Date().toLocaleString('de-DE') + '</p>',
    '</div>',
  ].join(String.fromCharCode(10));
  /* ⚠️ ZIEL_ART wird erst weiter unten deklariert; `const` ist nicht
     gehoistet, ein Zugriff hier wirft ReferenceError. Der Stoertest hat
     genau das gefunden — der Leerzweig waere im Ernstfall abgestuerzt,
     und der Ernstfall ist der Tag, an dem nichts mehr offen ist.
     [[befund_vor_dem_ende_der_funktion]] */
  const zielArtLeer = path.join(REPO, 'artefakte', 'wartungsfragen-artefakt.html');
  fs.writeFileSync(ZIEL, leer, 'utf8');
  fs.writeFileSync(zielArtLeer, leer, 'utf8');
  console.log('Nichts offen — alle Angaben da. Seite zeigt jetzt "✓ Nichts offen".');
  console.log('  ' + path.relative(REPO, zielArtLeer));
  console.log('  ⚠️ Trotzdem veroeffentlichen, sonst zeigt das Artefakt die alten Fragen:');
  console.log('     https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd');
  process.exit(0);
}

/* ---------- Seite bauen ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Wortarten für die type-Frage. Genau die Werte, die js/kern.js kennt —
   ein erfundener Wert fiele durch jede Kategorie. */
const WORTARTEN = [
  ['noun', 'Nomen (اِسْم)'], ['verb', 'Verb (فِعْل)'], ['adjective', 'Adjektiv (صِفَة)'],
  ['particle', 'Partikel (حَرْف)'], ['adverb', 'Adverb'], ['expression', 'Wendung']
];

/* ⛔⛔ WELCHE FRAGE EINE WORTART VORAUSSETZT
 *
 * „Wie lautet die weibliche Form?" ist nur beantwortbar, wenn das Wort ein
 * Adjektiv IST. Stimmt die Wortart nicht, ist die Frage nicht schwer, sondern
 * unbeantwortbar — und Elias sitzt davor und überlegt, was er falsch versteht.
 *
 * Am 20.08.2026 an الْيَوْمُ („heute", id 48402) aufgefallen: der Abzug führt
 * es als `adjective`, es ist ein Nomen (يَوْمٌ, adverbial gebraucht). Die
 * Seite hätte nach seiner weiblichen Form gefragt.
 *
 * ⭐ Deshalb bekommt JEDE dieser Fragen einen Ausweg — nicht nur die eine, an
 * der es auffiel. [[allgemeine_regel_statt_listeneintrag]]
 */
/* Genau die zwei Werte, die js/uebung.js kennt. Ein dritter waere in
   Übung 11 stillschweigend „männlich". */
const GESCHLECHTER = [['masculine', 'männlich (مُذَكَّر)'], ['feminine', 'weiblich (مُؤَنَّث)']];

const SETZT_VORAUS = {
  gender: ['noun', 'Nomen'], sg: ['noun', 'Nomen'], pl: ['noun', 'Nomen'],
  femSg: ['adjective', 'Adjektiv'], femPl: ['adjective', 'Adjektiv'],
  past: ['verb', 'Verb'], present: ['verb', 'Verb'],
  imperative: ['verb', 'Verb'], masdar: ['verb', 'Verb']
};

function abschnitt(f, nr){
  const eingabe = ['pl', 'sg', 'femSg', 'root', 'past', 'present', 'imperative', 'masdar'].includes(f.feld);
  const zeilen = f.woerter.map(w => {
    const knopfliste = f.feld === 'type' ? WORTARTEN
                     : f.feld === 'gender' ? GESCHLECHTER : null;
    const wahl = knopfliste
      ? `<div class="wahl">` + knopfliste.map(([v, t]) =>
          `<button type="button" data-wert="${v}">${esc(t)}</button>`).join('') +
        (SETZT_VORAUS[f.feld]
          ? `<button type="button" data-wert="__falschertyp__" class="falschertyp">ist kein ${esc(SETZT_VORAUS[f.feld][1])}</button>`
          : '') +
        `<button type="button" data-wert="" class="spaeter">später</button></div>`
      : `<div class="wahl">` +
        (eingabe ? `<input type="text" inputmode="text" placeholder="${esc(f.feld)} eintragen" data-eingabe>` : '') +
        `<button type="button" data-wert="__nein__">${esc(f.neinText)}</button>` +
        /* ⭐ Der Ausweg: die Frage ist falsch gestellt, weil die Wortart nicht
           stimmt. Nur wo eine Wortart überhaupt vorausgesetzt wird. */
        (SETZT_VORAUS[f.feld]
          ? `<button type="button" data-wert="__falschertyp__" class="falschertyp">ist kein ${esc(SETZT_VORAUS[f.feld][1])}</button>`
          : '') +
        `<button type="button" data-wert="" class="spaeter">später</button></div>`;
    /* ⭐⭐ DER BELEG AUS DEM BESTAND — er spart die Hälfte der Arbeit.

       `vorrat.mjs` sucht zu jeder Frage, ob DASSELBE Wort anderswo im Bestand
       die Antwort schon trägt (gleiche Schreibung UND passende Bedeutung).
       Am 20.08.2026 traf das auf 12 von 70 Fragen zu.

       ⛔ Es ist ein BELEG, kein Vorschlag, und er wird bewusst NICHT
       vorausgewählt: ein vorausgewählter Knopf lädt zum Durchklicken ein, und
       dann steht am Ende eine Angabe da, die niemand geprüft hat. Sichtbar
       machen, entscheiden lassen. */
    const beleg = w.beleg
      /* ⛔ KEINE Mehrfach-Leerzeichen im Template — sie landen im SICHTBAREN
         Text: „schon mit␣␣␣␣␣␣ل ح م". Sie waren hier aus der Einrueckung des
         erzeugenden Skripts hereingeraten. Gegenprobe auf der fertigen Seite:
         /S {2,}S/ [[nutztext_nie_in_shell_strings]] */
      /* ⭐⭐ ZWEI BELEGARTEN, UND SIE DÜRFEN NICHT GLEICH AUSSEHEN.
         Der Bestandsbeleg kommt aus SEINEM Abzug — dieselbe Quelle, mit der er
         lernt. Der Außenbeleg kommt von en.wiktionary und ist eine fremde
         Meinung: nützlich, aber nicht dasselbe. Wer beide gleich darstellt,
         nimmt ihm die Grundlage, verschieden genau hinzusehen.
         ⚠️ Der Außenbeleg nennt deshalb die dort geführte FORM mit — nur weil
         sie mit seiner Karte übereinstimmt, gilt der Beleg überhaupt. */
      ? (w.beleg.aussen
          ? `<div class="beleg aussen"><b dir="${/[؀-ۿ]/.test(w.beleg.wert) ? 'rtl' : 'ltr'}">${esc(w.beleg.wert)}</b> — ${esc(w.beleg.woher)} ${w.beleg.grund ? esc(w.beleg.grund) + ' (' + esc(w.beleg.form || w.ar) + ')' : 'führt ' + esc(w.beleg.form || w.ar)}${w.beleg.de ? ', „' + esc(w.beleg.de) + '"' : ''}${w.beleg.knopf ? ' — antippen: <b class="knopf-tipp">' + esc(w.beleg.knopf) + '</b>' : ''}${w.beleg.url ? ' <a href="' + esc(w.beleg.url) + '" target="_blank" rel="noopener">nachsehen</a>' : ''}</div>`
          : `<div class="beleg">Im Bestand steht dasselbe Wort schon mit <b>${esc(w.beleg.wert)}</b> — <i>${esc(w.beleg.woher)}</i>${w.beleg.de ? ', „' + esc(w.beleg.de) + '"' : ''}</div>`)
      : '';

    return `<div class="wort" data-feld="${esc(f.feld)}" data-id="${esc(w.id)}">
  <div class="kopf"><span class="ar">${esc(w.ar)}</span><span class="de">${esc(w.de)}</span></div>
  <div class="herkunft">${esc(w.quelle)}${w.kapitel ? ' · Kapitel ' + w.kapitel : ''}${w.type ? ' · ' + esc(w.type) : ''}</div>
  ${w.folgt ? `<div class="folgt">⭐ Entf\u00e4llt, wenn du oben <b>${esc(w.folgt)}</b> gew\u00e4hlt hast \u2014 ein ${esc(w.folgt)} hat keine Wurzel.</div>` : ''}
  ${beleg}
  ${wahl}
</div>`;
  }).join('\n');

  return `<section class="block" data-feld="${esc(f.feld)}">
  <h2><span class="knr">Frage ${nr}</span><span class="ktitel">${esc(f.titel)}</span>
      <span class="kzahl"><b data-fertig>0</b>/${f.woerter.length}</span></h2>
  ${f.hilfe ? `<p class="hilfe">${esc(f.hilfe)}</p>` : ''}
  ${f.folge ? `<p class="folge">Ohne die Angabe fällt aus: <b>${esc(f.folge)}</b></p>` : ''}
  ${SETZT_VORAUS[f.feld] ? `<p class="voraus">Diese Frage setzt voraus, dass das Wort ein <b>${esc(SETZT_VORAUS[f.feld][1])}</b> ist. Stimmt das nicht, ist sie nicht beantwortbar — dann „ist kein ${esc(SETZT_VORAUS[f.feld][1])}" wählen; das Wort kommt dann bei der Wortart wieder.</p>` : ''}
  ${(f.feld !== 'type' && f.feld !== 'gender') ? `<button type="button" class="alle" data-alle="__nein__">Alle auf „${esc(f.neinText)}"</button>` : ''}
  ${zeilen}
</section>`;
}

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offene Fragen der Wartung</title>
<style>
/* Gleiche Bauform wie das Regelprüfungs- und das Freigabe-Artefakt:
   OLED-Schwarz, ein Thema, alles ausdrücklich gemalt. */
:root{
  --bg:#000; --flaeche:#111114; --hoch:#17171c; --rand:#26262c; --rand2:#1c1c21;
  --text:#f4f4f6; --leise:#9a9aa4; --still:#6b6b75;
  --rot:#ff3355; --gruen:#2fd27a; --gelb:#ffc44d; --blau:#5aa9ff;
  --sp1:6px; --sp2:10px; --sp3:16px; --sp4:24px; --sp5:38px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
     font-size:17px;line-height:1.55;padding:var(--sp5) var(--sp3) 90px}
.huelle{max-width:760px;margin:0 auto}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase;color:var(--still);margin:0 0 var(--sp2)}
h1{font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1;letter-spacing:-.025em;
   margin:0 0 var(--sp3);text-wrap:balance}
.vorspann{color:var(--leise);margin:0 0 var(--sp3);max-width:60ch}
.vorspann strong{color:var(--text)}
code{font-family:var(--mono);font-size:.86em;color:var(--leise)}

.fortschritt{position:sticky;top:0;z-index:10;background:var(--bg);
             padding:var(--sp2) 0;margin-bottom:var(--sp3);
             border-bottom:1px solid var(--rand)}
.balken{height:6px;background:var(--rand2);border-radius:99px;overflow:hidden}
.balken i{display:block;height:100%;width:0;background:var(--gruen);transition:width .2s ease}
.fzeile{display:flex;justify-content:space-between;align-items:center;gap:var(--sp2);
        margin-top:var(--sp1);font-size:.85rem;color:var(--leise);flex-wrap:wrap}
.fzeile b{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--text)}
.fzeile button{font:inherit;font-size:.82rem;font-weight:600;color:var(--bg);
               background:var(--gruen);border:0;border-radius:99px;padding:6px 14px;cursor:pointer}
.fzeile button:disabled{background:var(--rand);color:var(--still);cursor:default}
.fzeile button:focus-visible{outline:2px solid var(--text);outline-offset:2px}

h2{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;
   font-size:1.05rem;font-weight:600;margin:var(--sp5) 0 var(--sp2);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.knr{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;
     text-transform:uppercase;color:var(--blau)}
.kzahl{margin-left:auto;font-family:var(--mono);font-size:.75rem;color:var(--still);
       font-variant-numeric:tabular-nums}
.hilfe{color:var(--leise);font-size:.92rem;margin:0 0 var(--sp2);max-width:62ch}
.folge{color:var(--gelb);font-size:.88rem;margin:0 0 var(--sp3)}
.voraus{color:var(--leise);font-size:.85rem;margin:0 0 var(--sp3);max-width:62ch;
        padding-left:var(--sp2);border-left:2px solid var(--rand)}
.voraus b{color:var(--text)}
/* Der Ausweg sieht anders aus als die Antwort — er beendet die Frage nicht,
   er stellt sie neu. */
.wahl button.falschertyp{border-style:dashed;color:var(--gelb)}
.wort[data-beantwortet="__falschertyp__"]{border-left-color:var(--gelb)}
.folge b{color:var(--gelb)}
.alle{font:inherit;font-size:.85rem;font-weight:600;color:var(--text);
      background:var(--hoch);border:1px solid var(--rand);border-radius:99px;
      padding:7px 16px;cursor:pointer;margin:0 0 var(--sp3)}
.alle:focus-visible{outline:2px solid var(--text);outline-offset:2px}

.wort{background:var(--flaeche);border:1px solid var(--rand);border-radius:14px;
      padding:var(--sp3);margin-bottom:var(--sp2);border-left:3px solid var(--rand)}
.wort[data-beantwortet]{border-left-color:var(--gruen)}
.wort[data-beantwortet="__spaeter__"]{border-left-color:var(--gelb);opacity:.66}
.kopf{display:flex;align-items:baseline;gap:var(--sp3);flex-wrap:wrap;margin-bottom:2px}
/* ⛔ line-height nicht 1: Kasrah und Tanwīn Kasrah stehen UNTER der Grundlinie
   und würden abgeschnitten. Und kein break-word — Arabisch bricht nie mitten
   im Wort, das kippt die Buchstabenformen. */
.ar{font-size:1.5rem;line-height:1.9;direction:rtl;unicode-bidi:isolate;
    word-break:normal;overflow-wrap:normal}
.de{color:var(--leise);font-size:.95rem}
.herkunft{font-family:var(--mono);font-size:.72rem;color:var(--still);margin-bottom:var(--sp2)}
/* Der Beleg aus dem Bestand. Bewusst ruhig gehalten und NICHT wie ein
   gewaehlter Knopf aussehend — er ist ein Hinweis, keine Antwort. */
.beleg{font-size:.8rem;color:var(--text);background:var(--hoch);
       border-left:3px solid var(--still);border-radius:0 6px 6px 0;
       padding:6px 10px;margin:0 0 var(--sp2)}
.beleg b{font-family:var(--mono);font-size:.82rem}
.beleg i{font-style:normal;color:var(--still)}
/* Der Beleg von aussen (en.wiktionary). Noch zurueckhaltender als der aus dem
   Bestand — gestrichelt statt durchgezogen: eine fremde Quelle, kein Auszug
   aus seinem eigenen Kurs. Die arabische FORM steht rechtslaeufig isoliert,
   sonst zieht sie das lateinische Drumherum durcheinander.
   [[rtl_richtung_physisch]] */
.beleg.aussen{border-left-style:dashed;background:transparent;color:var(--leise)}
.beleg.aussen b{unicode-bidi:isolate;font-family:inherit;
                font-size:.9rem;color:var(--text)}
.beleg.aussen a{color:var(--still);text-decoration:underline}
/* Der Knopfname, den Elias antippen soll — bewusst in der Schrift der
   Knoepfe selbst, damit die Verbindung ohne Erklaerung sichtbar ist. */
.knopf-tipp{font-family:var(--mono);font-size:.82rem;color:var(--text);
            background:var(--rand);padding:1px 6px;border-radius:5px}
.beleg.aussen a:hover,.beleg.aussen a:focus-visible{color:var(--text)}
/* Der Hinweis auf eine Frage, die sich von selbst erledigen kann. Bewusst
   leiser als der Beleg: er sagt nichts ueber DIESES Wort, sondern ueber die
   Reihenfolge. */
.folgt{font-size:.8rem;color:var(--still);margin:0 0 var(--sp2)}
.folgt b{color:var(--leise);font-family:var(--mono);font-size:.82rem}
.wahl{display:flex;gap:var(--sp1);flex-wrap:wrap;align-items:center}
.wahl button{font:inherit;font-size:.85rem;color:var(--text);background:var(--hoch);
             border:1px solid var(--rand);border-radius:99px;padding:7px 14px;cursor:pointer}
.wahl button:hover{border-color:var(--still)}
.wahl button[aria-pressed="true"]{background:var(--gruen);color:var(--bg);border-color:var(--gruen);font-weight:600}
.wahl button.spaeter[aria-pressed="true"]{background:var(--gelb);border-color:var(--gelb)}
.wahl button:focus-visible{outline:2px solid var(--text);outline-offset:2px}
.wahl input{font:inherit;font-size:1.05rem;color:var(--text);background:var(--bg);
            border:1px solid var(--rand);border-radius:10px;padding:7px 12px;
            min-width:12ch;flex:1 1 14ch;direction:rtl;text-align:right;line-height:1.9}
.wahl input:focus{outline:2px solid var(--blau);outline-offset:1px}

.ergebnis{margin-top:var(--sp5);background:var(--flaeche);border:1px solid var(--rand);
          border-radius:14px;padding:var(--sp3)}
.ergebnis h2{margin-top:0}
.ergebnis textarea{width:100%;min-height:180px;font-family:var(--mono);font-size:.8rem;
                   color:var(--leise);background:var(--bg);border:1px solid var(--rand2);
                   border-radius:10px;padding:var(--sp2);resize:vertical}
.warnkasten{background:#1a1206;border:1px solid #4a3410;border-left:3px solid var(--gelb);
            border-radius:12px;padding:var(--sp3);margin:0 0 var(--sp4);
            color:#e8d5ac;font-size:.92rem}
.warnkasten b{color:var(--gelb)}
</style>
</head>
<body>
<div class="huelle">
<p class="eyebrow">Wartungslauf · Freischaltstand ${esc(daten.freischaltstand || '')}</p>
<h1>Was ich nicht allein entscheiden kann</h1>
<p class="vorspann">Von <strong>${daten.geprueft}</strong> Wörtern in deinem Fenster sind
<strong>${daten.geprueft - betroffen}</strong> vollständig. Bei <strong>${betroffen}</strong>
fehlt etwas, das ich nur raten könnte — zusammen <strong>${anzahl}</strong> Angaben.
Ob اليَابَان einen Plural hat, ist eine Frage an die Sprache, nicht an die Daten.</p>

<div class="warnkasten"><b>Ein Durchgang je Frage, nicht je Wort.</b> Wo eine ganze
Gruppe dieselbe Antwort hat — Länder- und Städtenamen etwa haben keinen Plural —
reicht der Knopf oben am Abschnitt. Was du hier als „gibt es nicht" einträgst,
wird nie wieder gefragt.<br><br>
⚠️ <b>Eine Antwort kann neue Fragen erzeugen</b>, und das ist kein Fehler:
Sagst du bei لَحْمٌ „Nomen", wird ab da auch nach Geschlecht und Plural gefragt —
vorher war das gar nicht entscheidbar. Die Wortart ist die Wurzel, an der vier
weitere Angaben hängen.</div>

<div class="fortschritt">
  <div class="balken"><i id="fortschrittBalken"></i></div>
  <div class="fzeile"><span><b id="fertigZahl">0</b> von <b>${anzahl}</b> beantwortet</span>
    <button type="button" id="kopieren" disabled>Ergebnis kopieren</button></div>
</div>

${fragen.map((f, i) => abschnitt(f, i + 1)).join('\n')}

<div class="ergebnis">
  <h2><span class="ktitel">Ergebnis</span></h2>
  <p class="hilfe">Deine Antworten liegen im Speicher dieses Browsers — sie erreichen mich
  <b>erst, wenn du den Text unten kopierst und in den Chat schickst</b>.</p>
  <textarea id="ausgabe" readonly></textarea>
</div>
</div>

<script>
(function(){
  'use strict';
  /* ⛔ localStorage kann WERFEN (gesperrter Speicher). Ohne try stirbt das
     Skript in Zeile 2 und die Seite ist stumm, ohne Fehlermeldung. */
  var SPEICHER = 'wartungsfragen-v1';
  var stand = {};
  try { stand = JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch(e){ stand = {}; }

  var GESAMT = ${anzahl};
  var woerter = Array.prototype.slice.call(document.querySelectorAll('.wort'));

  function schluessel(el){ return el.dataset.feld + '|' + el.dataset.id; }

  /* ⛔ Der Ladeversuch oben steht in einem try — das Speichern schluckte
     seinen Fehler bis zum 21.08.2026 aber stumm. Ist der Speicher gesperrt,
     verschwinden Elias' Antworten lautlos, und beim naechsten Oeffnen faengt
     er von vorn an.

     Uebernommen aus werkzeuge/freigabe-seite.mjs, wo die Loesung seit einem
     echten Vorfall steht ("Storage is disabled inside data: URLs") und nie
     zu den Nachbarseiten gewandert ist.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[ausfall_ist_unsichtbar_gebaut]] */
  var SPEICHER_GEHT = false;
  try {
    localStorage.setItem(SPEICHER + '-probe', '1');
    SPEICHER_GEHT = localStorage.getItem(SPEICHER + '-probe') === '1';
    localStorage.removeItem(SPEICHER + '-probe');
  } catch(e){ SPEICHER_GEHT = false; }

  function warneSpeicher(){
    if (SPEICHER_GEHT || document.getElementById('speicherwarnung')) return;
    var d = document.createElement('div');
    d.id = 'speicherwarnung';
    d.style.cssText = 'background:#210d0c;border:1px solid #5a1f1c;border-left:3px solid #c4483f;'
      + 'padding:.7rem .9rem;border-radius:6px;margin:0 0 1rem;font-size:.9rem;line-height:1.5';
    d.innerHTML = '<b style="color:#e0776d">Dieser Browser behält hier nichts.</b> '
      + 'Deine Antworten stehen nur im Arbeitsspeicher — beim Neuladen oder Schließen '
      + 'sind sie weg. Kopier dir den Text unten heraus, bevor du die Seite verlässt.';
    var anker = document.getElementById('fortschrittBalken') || document.getElementById('ausgabe');
    if (anker && anker.parentNode) anker.parentNode.insertBefore(d, anker);
  }

  function sichern(){
    if (!SPEICHER_GEHT) return;
    try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); }
    catch(e){ SPEICHER_GEHT = false; warneSpeicher(); }
  }

  function malen(el){
    var k = schluessel(el), a = stand[k];
    var knoepfe = el.querySelectorAll('.wahl button');
    var feld = el.querySelector('[data-eingabe]');
    for (var i = 0; i < knoepfe.length; i++){
      var w = knoepfe[i].dataset.wert;
      knoepfe[i].setAttribute('aria-pressed', a !== undefined && a === w ? 'true' : 'false');
    }
    if (a === undefined) el.removeAttribute('data-beantwortet');
    else if (a === '') el.setAttribute('data-beantwortet', '__spaeter__');
    else if (a === '__falschertyp__') el.setAttribute('data-beantwortet', '__falschertyp__');
    else el.setAttribute('data-beantwortet', 'ja');
    if (feld && a !== undefined && a !== '__nein__' && a !== '__falschertyp__'
        && a !== '' && feld.value !== a) feld.value = a;
  }

  function zaehlen(){
    var n = 0;
    woerter.forEach(function(el){ if (stand[schluessel(el)] !== undefined) n++; });
    document.getElementById('fertigZahl').textContent = n;
    document.getElementById('fortschrittBalken').style.width = (GESAMT ? n / GESAMT * 100 : 0) + '%';
    document.getElementById('kopieren').disabled = n === 0;
    document.querySelectorAll('.block').forEach(function(b){
      var m = 0, ws = b.querySelectorAll('.wort');
      ws.forEach(function(el){ if (stand[schluessel(el)] !== undefined) m++; });
      b.querySelector('[data-fertig]').textContent = m;
    });
    ausgabeBauen();
  }

  function ausgabeBauen(){
    var z = ['Antworten aus dem Wartungsfragen-Artefakt (' + new Date().toLocaleDateString('de-DE') + ')', ''];
    document.querySelectorAll('.block').forEach(function(b){
      var feld = b.dataset.feld, zeilen = [];
      b.querySelectorAll('.wort').forEach(function(el){
        var a = stand[schluessel(el)];
        if (a === undefined || a === '') return;
        var ar = el.querySelector('.ar').textContent;
        var de = el.querySelector('.de').textContent;
        zeilen.push('  ' + el.dataset.id + '  ' + ar + '  (' + de + ')  -> ' +
                    (a === '__nein__' ? 'GIBT ES NICHT'
                   : a === '__falschertyp__' ? 'WORTART FALSCH' : a));
      });
      if (zeilen.length){ z.push(feld + ':'); z.push.apply(z, zeilen); z.push(''); }
    });
    document.getElementById('ausgabe').value = z.join('\\n');
  }

  woerter.forEach(function(el){
    el.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-wert]');
      if (!b) return;
      var k = schluessel(el), w = b.dataset.wert;
      if (stand[k] === w) delete stand[k]; else stand[k] = w;
      sichern(); malen(el); zaehlen();
    });
    var feld = el.querySelector('[data-eingabe]');
    if (feld) feld.addEventListener('input', function(){
      var k = schluessel(el), v = feld.value.trim();
      if (v) stand[k] = v; else delete stand[k];
      sichern(); malen(el); zaehlen();
    });
    malen(el);
  });

  document.querySelectorAll('.alle').forEach(function(b){
    b.addEventListener('click', function(){
      var block = b.closest('.block');
      block.querySelectorAll('.wort').forEach(function(el){
        /* ⛔ Nur was noch unbeantwortet ist — sonst überschreibt ein
           versehentlicher Tipp bereits eingetippte Formen. */
        var k = schluessel(el);
        if (stand[k] === undefined) stand[k] = b.dataset.alle;
        malen(el);
      });
      sichern(); zaehlen();
    });
  });

  document.getElementById('kopieren').addEventListener('click', function(){
    var t = document.getElementById('ausgabe');
    t.removeAttribute('readonly'); t.select(); t.setSelectionRange(0, 999999);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){}
    t.setAttribute('readonly', '');
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(t.value);
    var b = this;
    b.textContent = (ok || navigator.clipboard) ? 'kopiert \\u2713' : 'bitte von Hand markieren';
    setTimeout(function(){ b.textContent = 'Ergebnis kopieren'; }, 1800);
  });

  zaehlen();
  /* ⛔ AUCH BEIM START warnen. War der Speicher von Anfang an gesperrt, ist
     SPEICHER_GEHT schon false, sichern() kehrt sofort um und die Warnung
     kaeme nie — der haeufigere Fall also stumm. Genau das war beim ersten
     Anlauf an wortmarke-seite.mjs passiert (21.08.2026) und hier zunaechst
     wiederholt. */
  warneSpeicher();
})();
</script>
</body>
</html>`;

fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
/* ⛔ erst .neu, dann umbenennen: ein Abbruch beim Schreiben hinterliesse sonst
   eine leere Datei, und die besteht jeden Test. [[leere_datei_besteht_jeden_test]] */
const tmp = ZIEL + '.neu';
fs.writeFileSync(tmp, html, 'utf8');
fs.renameSync(tmp, ZIEL);

/* ---------- Zweite Fassung für die Veröffentlichung als Artefakt ----------

   ⛔ Ein Artefakt bekommt seinen Dokumentrahmen von der Umgebung: <!doctype>,
   <html>, <head> und <body> werden beim Veröffentlichen umgelegt. Sind sie im
   Inhalt schon drin, stehen sie doppelt.

   ⭐ Warum es überhaupt zwei Fassungen gibt: Die Datei oben öffnet Elias am PC
   per Doppelklick — kein Server, kein Port, nichts, was erst laufen muss. Am
   Handy geht das nicht, und genau dort will er die Fragen durchgehen. Dafür
   die Fassung hier, die ich als Artefakt veröffentliche.

   ⚠️ Die Routine kann das NICHT selbst: Artefakte veröffentlicht nur eine
   Sitzung mit dem Artifact-Werkzeug. Der Bericht muss deshalb sagen, dass eine
   neue Fassung bereitliegt — sonst sieht Elias am Handy den Stand von letzter
   Woche und hält ihn für aktuell. [[alte_fassung_beim_nutzer]] */
const ZIEL_ART = path.join(REPO, 'artefakte', 'wartungsfragen-artefakt.html');
const nurInhalt = html
  .replace(/^[\s\S]*?<title>/, '<title>')
  .replace(/<\/head>\s*<body>/, '')
  .replace(/<\/body>\s*<\/html>\s*$/, '')
  .replace(/<meta[^>]*>\s*/g, '');
const tmp2 = ZIEL_ART + '.neu';
fs.writeFileSync(tmp2, nurInhalt, 'utf8');
fs.renameSync(tmp2, ZIEL_ART);

console.log('Seite gebaut: ' + path.relative(REPO, ZIEL));
console.log('  zum Veröffentlichen: ' + path.relative(REPO, ZIEL_ART));
/* ⛔ Die URL gehoert HIERHER, nicht nur in den Wartungsprompt.
   Wer die Seite ohne sie veroeffentlicht, legt eine ZWEITE an - und die
   Warteseite verlinkt weiter auf die alte, die dann nie wieder aktuell
   wird. Beim Schwesterwerkzeug wartet-auf-elias.mjs stand die Warnung
   laengst; hier fehlte sie, einen Abschnitt daneben.
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
console.log('  ⚠️ Veroeffentlichen kann die Routine nicht selbst - das braucht eine Sitzung.');
console.log('     DIESELBE URL wiederverwenden, keine neue anlegen:');
console.log('     https://claude.ai/code/artifact/724ee9bc-adb7-4dcd-ad75-6a56a552adbd');
console.log('  ' + fragen.length + ' Frage(n), ' + anzahl + ' Wörter.');
fragen.forEach(f => console.log('    ' + f.feld.padEnd(9) + String(f.woerter.length).padStart(3) + '  ' + f.titel));
