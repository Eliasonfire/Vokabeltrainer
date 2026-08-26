/* regelpruefung-seite.mjs -- baut das Regelpruefungs-Artefakt (SPEICHER "regelpruefung-v1").
 *
 * Am 19.08.2026 aus dem Sitzungsordner ins Repo geholt. Vorher lag die Datei
 * nur unter AppData/Local/Temp — der Sitzungsordner wird irgendwann geleert,
 * und dann waere das Artefakt, an dem Elias gerade arbeitet, nicht mehr neu
 * baubar gewesen. Frueherer Name: baue-pruefstrecke2.mjs
 *
 * Zwischenstaende und fertige Seiten liegen jetzt unter artefakte/ im Repo.
 * ⛔ Der Ordner gehoert in .gitignore, falls er es noch nicht ist: die
 * gebauten Seiten enthalten Elias' Vokabeln und Beispielsaetze und fallen
 * damit unter Regel 7a (arabicroots-AGB Ziffer 9 und 3.7).
 */
import fs from 'node:fs';

/* ⛔ Das Datum stand FEST als "Stand 19.08.2026" in der Seite — derselbe
   Fehler wie in freigabe-artefakt.mjs, eine Datei daneben. Eine erzeugte
   Seite, die immer denselben Tag behauptet, sieht so alt aus wie eine
   handgeschriebene, und niemand merkt, wann zuletzt gemessen wurde.
   [[eingefrorenes_feld_ist_kein_zustand]]
   [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
const STAND_HEUTE = new Date().toLocaleDateString('de-DE',
  { day: '2-digit', month: '2-digit', year: 'numeric' });
const S = 'artefakte/';
const regeln = JSON.parse(fs.readFileSync(S + 'regeln.json', 'utf8'));

const esc = s => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Erster Satz als Kern, Rest hinter „ausführlich" — genau wie die App es im
   Regel-Pop-up macht. Ohne das sind 84 Regeln eine Textwand. */
function kernUndRest(t){
  const s = String(t || '');
  const m = /^(.{40,320}?[.!?])\s/.exec(s);
  if (!m) return [s, ''];
  return [m[1], s.slice(m[1].length).trim()];
}

/* Im Beispielsatz die markierte Stelle hervorheben — das ist die Stelle, an
   der Elias die Regel in der App tatsächlich sieht. */
function satzHtml(satz){
  if (!satz) return '';
  const ar = String(satz.ar || '');
  const t  = String(satz.treffer || '').replace(/[.،؟!]$/, '');
  let inner = esc(ar);
  if (t && ar.includes(t)) {
    const i = ar.indexOf(t);
    inner = esc(ar.slice(0, i)) + '<u>' + esc(t) + '</u>' + esc(ar.slice(i + t.length));
  }
  /* ⭐ WAS DIE MARKIERTE STELLE BEDEUTET (26.08.2026). Elias an
     مَا اسْمُكِ؟ — "Wie heisst du?": dass das ـكِ die WEIBLICHE Anrede ist,
     steht in der Uebersetzung nirgends, weil das deutsche "dein" gar kein
     Geschlecht hat. Nicht versteckt, sondern gar nicht vorhanden. */
  const gl = satz.bedeutung
    ? `<div class="satz-bedeutung">${esc(satz.bedeutung)}</div>` : '';
  return `<div class="satz"><div class="satz-ar">${inner}</div>`
       + `<div class="satz-de">${esc(satz.de)}</div>${gl}</div>`;
}

const KAPITEL_NAME = {
  1: 'Hinweiswörter und der einfache Satz',
  2: 'Fragewörter',
  3: 'Der Artikel اَلْ, Sonnen- und Mondbuchstaben',
  4: 'Die Genitivpartikeln',
  5: 'Die Anfügung مُضاف',
  6: 'Weibliche Formen, هَذِهِ',
  7: 'Das ferne Hinweiswort تِلْكَ',
  8: 'Ortsangaben',
  9: 'Das Adjektiv نَعْت',
  10: 'Besitz-Fürwörter (ـكَ, ـهُ, ـهَا, ـي)',
};

const kap = {};
regeln.forEach(r => (kap[r.kapitel ?? 0] ||= []).push(r));
const kapNummern = Object.keys(kap).map(Number).sort((a, b) => a - b);

let blöcke = '';
let nr = 0;
for (const k of kapNummern){
  const liste = kap[k];
  blöcke += `\n<section class="kapitel" data-kap="${k}">\n`
    + `<h2><span class="knr">Kapitel ${k}</span> ${esc(KAPITEL_NAME[k] || '')}`
    + `<span class="kzahl" data-kap-zahl="${k}">0/${liste.length}</span></h2>\n`;
  for (const r of liste){
    nr++;
    const [kern, rest] = kernUndRest(r.text);
    blöcke += `<article class="regel c-${esc(r.id)}" data-id="${esc(r.id)}" data-kap="${k}" data-farbe="${esc(r.farbe || '')}"${r.neu ? ' data-neu="1"' : ''}>
  <div class="rkopf">
    <span class="rnr">${nr}</span>
    <h3>${esc(r.name)}</h3>
    ${r.neu ? '<span class="marke neu">neu</span>' : ''}
    ${r.ergaenzung ? '<span class="marke buch">📖 Buch</span>' : ''}
    ${r.ausgeblendet ? '<span class="marke aus">ausgeblendet</span>' : ''}
  </div>
  <p class="kern">${esc(kern)}</p>
  ${rest ? `<details><summary>ausführlich</summary><p class="rest">${esc(rest)}</p></details>` : ''}
  ${satzHtml(r.satz)}
  <div class="quelle">${esc(r.quelle)}${r.buch ? ' · ' + esc(r.buch) : ''}</div>
  <div class="urteil" role="group" aria-label="Karteikarte: ${esc(r.name)}">
    <span class="ulabel">Karteikarte</span>
    <button type="button" data-u="passt">passt</button>
    <button type="button" data-u="aendern">ändern</button>
    <button type="button" data-u="streichen">streichen</button>
    <input type="text" class="notiz" placeholder="Notiz (nur bei ändern/streichen nötig)">
  </div>
  <div class="urteil satzmodus" role="group" aria-label="Satzmodus: ${esc(r.name)}">
    <span class="ulabel">Satzmodus</span>
    <button type="button" data-s="drin">drin</button>
    <button type="button" data-s="aendern">ändern</button>
    <button type="button" data-s="raus">raus</button>
    <input type="text" class="snotiz" placeholder="Notiz zum Satzmodus">
  </div>
</article>\n`;
  }
  blöcke += `</section>\n`;
}

const html = `<title>Regelprüfung Madina 1</title>
<style>
/* Farbraum der App selbst: --bg/--flaeche/--rand/--text/--leise aus index.html,
   dazu die fünf Grammatikfarben, die Elias in der App an den Sätzen sieht.
   Bewusst EIN Thema (OLED-Schwarz), aber alles explizit gemalt. */
:root{
  --bg:#000; --flaeche:#111114; --hoch:#17171c; --rand:#26262c; --rand2:#1c1c21;
  --text:#f4f4f6; --leise:#9a9aa4; --still:#6b6b75;
  --rot:#ff3355; --gruen:#2fd27a; --gelb:#ffc44d;
  --sp1:7px; --sp2:12px; --sp3:18px; --sp4:26px; --sp5:40px;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,Menlo,Consolas,monospace;
  --ar:"Noto Naskh Arabic","Amiri","Segoe UI Historic",serif;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;font-size:19px}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
     font-size:1.07rem;line-height:1.6;padding:var(--sp5) var(--sp3) 80px}
.huelle{max-width:760px;margin:0 auto}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
         text-transform:uppercase;color:var(--still);margin:0 0 var(--sp2)}
h1{font-size:clamp(1.9rem,7vw,2.5rem);line-height:1.1;letter-spacing:-.025em;
   margin:0 0 var(--sp3);text-wrap:balance}
.vorspann{color:var(--leise);margin:0 0 var(--sp3);max-width:60ch}
.vorspann strong{color:var(--text)}

.warnkasten{background:#1a1206;border:1px solid #4a3410;border-left:3px solid var(--gelb);
            border-radius:12px;padding:var(--sp3);margin:0 0 var(--sp4);
            color:#e8d5ac;font-size:.92rem}
.warnkasten b{color:var(--gelb)}

.fortschritt{position:sticky;top:0;z-index:10;background:var(--bg);
             padding:var(--sp2) 0;margin-bottom:var(--sp3);
             border-bottom:1px solid var(--rand)}
.balken{height:6px;background:var(--rand2);border-radius:99px;overflow:hidden}
.balken i{display:block;height:100%;width:0;background:var(--gruen);
          transition:width .2s ease}
.fzeile{display:flex;justify-content:space-between;align-items:center;
        gap:var(--sp2);margin-top:var(--sp1);font-size:.85rem;color:var(--leise)}
.fzeile b{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--text)}
.fzeile button{font:inherit;font-size:.82rem;font-weight:600;color:var(--bg);
               background:var(--gruen);border:0;border-radius:99px;
               padding:6px 14px;cursor:pointer}
.fzeile button:disabled{background:var(--rand);color:var(--still);cursor:default}
.fzeile button:focus-visible{outline:2px solid var(--text);outline-offset:2px}

h2{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;
   font-size:1.05rem;font-weight:600;margin:var(--sp5) 0 var(--sp3);
   padding-bottom:var(--sp1);border-bottom:1px solid var(--rand)}
.knr{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;
     text-transform:uppercase;color:var(--rot)}
.kzahl{margin-left:auto;font-family:var(--mono);font-size:.78rem;color:var(--still);
       font-variant-numeric:tabular-nums}

.regel{background:var(--flaeche);border:1px solid var(--rand);border-radius:14px;
       padding:var(--sp3);margin-bottom:var(--sp2);border-left:3px solid var(--rand)}
.regel[data-urteil="passt"]{border-left-color:var(--gruen)}
.regel[data-urteil="aendern"]{border-left-color:var(--gelb)}
.regel[data-urteil="streichen"]{border-left-color:var(--rot)}
.rkopf{display:flex;align-items:baseline;gap:var(--sp2);flex-wrap:wrap;margin-bottom:var(--sp1)}
.rnr{font-family:var(--mono);font-size:.74rem;color:var(--still);
     font-variant-numeric:tabular-nums;min-width:2ch}
.regel h3{font-size:1.02rem;font-weight:600;margin:0;flex:1 1 auto;min-width:0;
          letter-spacing:-.01em}
.marke{font-family:var(--mono);font-size:.68rem;font-weight:600;letter-spacing:.05em;
       padding:2px 7px;border-radius:5px;border:1px solid var(--rand);
       background:var(--hoch);white-space:nowrap}
.marke.buch{color:var(--gelb);border-color:rgba(255,196,77,.32)}
.marke.aus{color:var(--still)}
.marke.neu{color:var(--gruen);border-color:rgba(47,210,122,.35);background:#0b1a12}

/* Filter: drei Knöpfe über der Liste. Sie ändern NUR die Sichtbarkeit —
   gezählt wird immer über alle 95, sonst springt der Fortschritt. */
.filter{display:flex;flex-wrap:wrap;gap:var(--sp1);margin-top:var(--sp2)}
.filter button{font:inherit;font-size:.78rem;font-weight:500;color:var(--leise);
               background:var(--hoch);border:1px solid var(--rand);
               border-radius:99px;padding:5px 13px;cursor:pointer}
.filter button:hover{color:var(--text)}
.filter button:focus-visible{outline:2px solid var(--rot);outline-offset:2px}
.filter button[aria-pressed="true"]{background:var(--text);border-color:var(--text);color:var(--bg)}
.regel.verborgen,.kapitel.verborgen{display:none}
.leermeldung{color:var(--still);font-size:.88rem;margin:var(--sp4) 0;display:none}
.leermeldung.an{display:block}
.kern{margin:0 0 var(--sp1);color:var(--text);font-size:1rem;line-height:1.6}
details{margin:0 0 var(--sp1)}
summary{cursor:pointer;color:var(--leise);font-size:.85rem;
        font-family:var(--mono);letter-spacing:.04em}
summary:focus-visible{outline:2px solid var(--rot);outline-offset:2px}
.rest{margin:var(--sp1) 0 0;color:var(--leise);font-size:.97rem;line-height:1.6}

.satz{background:var(--hoch);border:1px solid var(--rand2);border-radius:10px;
      padding:var(--sp2) var(--sp3);margin:var(--sp2) 0}
.satz-ar{font-family:var(--ar);direction:rtl;unicode-bidi:isolate;
         font-size:1.6rem;line-height:2;text-align:right}
.satz-ar u{text-decoration:none;color:var(--gelb);
           border-bottom:2px solid var(--gelb);padding-bottom:2px}
.satz-de{color:var(--leise);font-size:.95rem;margin-top:6px}
/* ⛔ KEIN direction:rtl — der Text ist gemischt ("ـكِ = dein (weiblich)")
   und ueberwiegend deutsch; rtl wuerfe das Gleichheitszeichen ans falsche
   Ende. Der Bidi-Algorithmus setzt das arabische Stueck von selbst richtig.
   line-height 1.9, weil die Kasrah UNTER der Grundlinie steht — und genau
   sie unterscheidet hier "dein (m.)" von "dein (w.)". */
.satz-bedeutung{margin-top:8px;padding:.4rem .65rem;border-radius:8px;
  background:#1a1206;border:1px solid #4a3410;color:var(--gelb);
  font-family:var(--ar),serif;font-size:1rem;line-height:1.9;
  direction:ltr;text-align:left}

.quelle{font-family:var(--mono);font-size:.72rem;color:var(--still);
        margin-top:var(--sp2);word-break:break-word}
.urteil{display:flex;flex-wrap:wrap;gap:var(--sp1);margin-top:var(--sp2);
        padding-top:var(--sp2);border-top:1px solid var(--rand2)}
.urteil button{font:inherit;font-size:.85rem;font-weight:500;color:var(--leise);
               background:var(--hoch);border:1px solid var(--rand);
               border-radius:99px;padding:6px 14px;cursor:pointer}
.urteil button:hover{color:var(--text)}
.urteil button:focus-visible{outline:2px solid var(--rot);outline-offset:2px}
.urteil button[aria-pressed="true"]{background:var(--text);border-color:var(--text);color:var(--bg)}
.notiz{flex:1 1 190px;min-width:0;font:inherit;font-size:.85rem;color:var(--text);
       background:#08080a;border:1px solid var(--rand);border-radius:10px;padding:6px 12px}
.notiz:focus-visible{outline:2px solid var(--rot);outline-offset:1px}
/* ⭐ Zwei Entscheidungen je Regel (25.08.2026). Die Beschriftung ist noetig,
   seit es zwei Reihen sind — „passt/ändern/streichen" allein sagte vorher
   schon, worum es geht, „drin/raus" daneben waere ohne Label mehrdeutig. */
.ulabel{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;
        text-transform:uppercase;color:var(--still);align-self:center;
        min-width:8.5ch}
.urteil.satzmodus{border-top:0;padding-top:var(--sp1);margin-top:0}
.urteil.satzmodus button[aria-pressed="true"][data-s="drin"]{background:var(--gruen);border-color:var(--gruen);color:var(--bg)}
.urteil.satzmodus button[aria-pressed="true"][data-s="raus"]{background:var(--rot);border-color:var(--rot);color:var(--bg)}
.regel[data-satz="raus"]{opacity:.72}
.regel[data-satz="aendern"]{border-left-color:var(--gelb)}
/* ⭐ Eigene Klasse, gleiche Gestalt: der input-Handler unterscheidet die
   beiden Notizfelder daran, in welchen Stand er schreibt. */
.snotiz{flex:1 1 190px;min-width:0;font:inherit;font-size:.85rem;color:var(--text);
        background:#08080a;border:1px solid var(--rand);border-radius:10px;padding:6px 12px}
.snotiz:focus-visible{outline:2px solid var(--gruen);outline-offset:1px}
.urteil.satzmodus button[aria-pressed="true"][data-s="aendern"]{background:var(--gelb);border-color:var(--gelb);color:var(--bg)}
@media (max-width:520px){.ulabel{min-width:auto;width:100%}}
/* Handy: Raender schmaler, damit die groessere Schrift nicht Zeilenlaenge
   frisst. Die Zahlen stehen im Kommentar von schmal.mjs. */
@media (max-width:520px){
  body{padding:var(--sp4) 12px 80px}
  .regel{padding:14px}
  .satz{padding:8px 12px}
  .huelle{max-width:none}
}

#ergebnis{width:100%;height:230px;margin-top:var(--sp2);background:#08080a;
          color:var(--leise);border:1px solid var(--rand);border-radius:12px;
          padding:var(--sp3);font-family:var(--mono);font-size:.78rem}
.fuss{margin-top:var(--sp5);padding-top:var(--sp3);border-top:1px solid var(--rand);
      color:var(--still);font-size:.86rem}
.fuss code{color:var(--leise);font-family:var(--mono)}
.klarkasten{border:1px solid var(--rand);border-left:3px solid var(--akzent);
  border-radius:8px;padding:.85rem 1rem;margin:1.1rem 0;background:var(--flaeche);
  font-size:.94rem;line-height:1.55}
.klarkasten b{color:var(--text)}
.klarkasten em{color:var(--leise)}
.klarkasten p{margin:.6rem 0 0}
.klarkasten .klar-technik{margin-top:.7rem;font-size:.86rem;color:var(--leise)}
.klarkasten code{font-family:var(--mono);font-size:.9em}
</style>

<div class="huelle">
<p class="eyebrow">Stand ${STAND_HEUTE} · ${regeln.length} Regeln · Karteikarte und Satzmodus</p>
<h1>Regelprüfung Madina 1</h1>
<p class="vorspann">Dein Wunsch vom 29.07.: <em>„die regeln selbst aussuchen und
absegnen damit sie wirklich richtig sind und tatsächlich das sind was mein
lehrer auch meint."</em> Je Regel steht hier der Regeltext, die Fundstelle und
— wo es sie gibt — der Beispielsatz, an dem du sie in der App siehst.
<strong>Nicht in einem Rutsch.</strong> Ein Kapitel pro Sitzung reicht; sonst
wird es eine Abnicke-Übung statt einer Entscheidung.</p>

<p class="vorspann">⭐ <strong>Seit deiner letzten Sitzung sind
${regeln.filter(r=>r.neu).length} Regeln dazugekommen</strong> — sie tragen die
Marke <span class="marke neu">neu</span>. <strong>Was du schon beurteilt hast,
steht noch</strong>: die Seite erkennt deine Häkchen an derselben Regel-Kennung
wie vorher. Mit „nur neue" springst du direkt zu den
${regeln.filter(r=>r.neu).length}.</p>

<div class="klarkasten">
<b>Zwei Entscheidungen je Regel — eine Erklärung.</b>
Dein Wunsch vom 25.08.: <em>„warum nicht dieses artefakt mit dem wo ich die
regeln für die sätze im modus bestimmen soll so verschmelzen damit ich nur
einmal die regel lesen muss und für beides direkt entscheiden kann und nicht
immer doppelt lesen muss."</em>
<p>Am 19.08. waren es noch zwei getrennte Fragen (<em>„seperat mache ich das
mit dem satzmodus bzw übungsmodus"</em>) — getrennt bleiben sie, nur der Weg
dorthin ist jetzt einer. Deine bisherigen Antworten aus <b>beiden</b> Seiten
sind übernommen; sie liegen weiter in ihren eigenen Speichern.</p>
<p><b>„Streichen" heißt hier also:</b> die Regel wird beim Lernen der Vokabel
<b>nicht mehr als Erklärung eingeblendet</b> — das Wort im Beispielsatz ist
nicht mehr unterstrichen, das Regel-Pop-up erscheint nicht mehr.</p>
<p><b>Was „streichen" NICHT tut:</b> Die Regel bleibt in den Daten, mit Beleg und
Fundstelle, und sie ist <b>umkehrbar</b> — ein einziges Kennzeichen, das man
wieder wegnimmt. Ob sie im <b>Satzmodus</b> bleibt, entscheidest du in der
zweiten Reihe darunter, unabhängig davon.</p>
<p><b>Die zweite Reihe — Satzmodus:</b> „drin" heißt, die Regel ist im Satzmodus
als Thema wählbar und erzeugt Übungsaufgaben. „raus" nimmt sie dort heraus,
ohne die Karteikarte anzutasten. Beides ist unabhängig: eine Regel kann als
Karteikarte gestrichen und im Satzmodus drin sein, und umgekehrt.</p>
<p class="klar-technik">Technisch: Karteikarte → <code>nichtAufKarteikarten: true</code>,
Satzmodus → die Regel fällt aus dem gewählten Thema. Bewusst <b>nicht</b>
<code>ausgeblendet</code> — das nähme sie aus beidem auf einmal.<br>
Speicher: <code>regelpruefung-v1</code> und <code>satzmodus-auswahl-v1</code>,
beide unverändert — die alten Seiten funktionieren weiter.</p>
</div>

<div class="warnkasten">
<b>⚠️ Deine Häkchen bleiben auf dieser Seite.</b> Sie werden im Browser
gespeichert, damit nichts verlorengeht — aber sie erreichen mich
<b>erst, wenn du den Text unten kopierst und schickst.</b> Diese Seite rechnet
nicht mit und ändert nichts an deiner App.
</div>

<div class="fortschritt">
  <div class="balken"><i id="balken"></i></div>
  <div class="fzeile">
    <span><b id="zahl">0</b> von <b>${regeln.length}</b> beurteilt</span>
    <button type="button" id="kopieren" disabled>Ergebnis kopieren</button>
  </div>
  <div class="fzeile" id="satzzeile" style="color:var(--leise);font-size:.85rem"></div>
  <div class="filter" role="group" aria-label="Ansicht">
    <button type="button" data-f="alle" aria-pressed="true">alle ${regeln.length}</button>
    <button type="button" data-f="neu" aria-pressed="false">nur neue ${regeln.filter(r=>r.neu).length}</button>
    <button type="button" data-f="offen" aria-pressed="false">noch offen</button>
  </div>
</div>
<p class="leermeldung" id="leer">Hier ist gerade nichts — in dieser Ansicht ist alles beurteilt.</p>
${blöcke}
<h2><span class="knr">Ergebnis</span> zum Kopieren und Schicken</h2>
<textarea id="ergebnis" readonly placeholder="Sobald du die erste Regel beurteilt hast, steht hier der Text."></textarea>

<div class="fuss">
<p><strong>Was „ändern" auslöst:</strong> Ich lege dir die Regel neu formuliert
vor, mit derselben Fundstelle. <strong>„streichen":</strong> die Regel bekommt
<code>ausgeblendet: true</code> — sie verschwindet aus der App, bleibt aber in
den Daten und lässt sich mit einem Wort zurückholen.</p>
<p><strong>neu</strong> heißt: diese Regel gab es beim ersten Öffnen dieser
Seite noch nicht. <strong>📖 Buch</strong> heißt: diese Regel stammt <em>nicht</em> aus dem
Unterricht, sondern aus Sharḥ Madīnah oder Bayna Yadayk. Du hast sie am 18.08.
freigegeben. <strong>ausgeblendet</strong> heißt: sie ist schon jetzt nicht in
der App zu sehen, weil ihr ein Beispielsatz fehlt.</p>
</div>
</div>

<script>
(function(){
  var SPEICHER = 'regelpruefung-v1';
  var stand = {};
  try { stand = JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch(e){ stand = {}; }

  /* ⭐ Der Satzmodus hat seinen EIGENEN Schluessel — denselben wie die alte
     Auswahlseite, damit dort schon Entschiedenes hier wieder auftaucht.
     ⛔ Nicht zusammenlegen: ein gemeinsamer Schluessel haette beide
     Bestaende auf einmal verworfen. [[vier_neue_artefakte]]
     Format der alten Seite: ein Array der AUSSORTIERTEN Ids. Der Zusatz -drin
     kommt dazu, damit „ausdruecklich drin" von „noch nicht entschieden"
     unterscheidbar bleibt — sonst waere der Fortschritt eine Luege. */
  var S_SATZ = 'satzmodus-auswahl-v1';   /* das ALTE Array — bleibt in Betrieb */
  var S_SATZ2 = 'satzmodus-v2';          /* das neue Format: {id: {u, n}} */

  /* ⭐ Erst das neue Format lesen. Gibt es das noch nicht, wird aus den
     beiden alten Listen uebernommen — so ist beim ersten Oeffnen alles da,
     was er in der alten Auswahlseite entschieden hat. */
  var satz = {};
  try { satz = JSON.parse(localStorage.getItem(S_SATZ2) || 'null') || null; } catch(e){ satz = null; }
  var ausAlt = 0;
  if (!satz){
    satz = {};
    try { (JSON.parse(localStorage.getItem(S_SATZ) || '[]') || []).forEach(function(i){ satz[i] = {u:'raus'}; ausAlt++; }); } catch(e){}
    try { (JSON.parse(localStorage.getItem(S_SATZ + '-drin') || '[]') || []).forEach(function(i){ satz[i] = {u:'drin'}; ausAlt++; }); } catch(e){}
  }
  var satzGefunden = Object.keys(satz).length;
  var ausAltEcht = ausAlt;   /* nur beim ERSTEN Oeffnen ungleich 0 */

  var regeln = [].slice.call(document.querySelectorAll('.regel'));
  var zahl = document.getElementById('zahl');
  var balken = document.getElementById('balken');
  var feld = document.getElementById('ergebnis');
  var knopf = document.getElementById('kopieren');

  /* ⛔ Der Ladeversuch oben steht in einem try — das Speichern schluckte
     seinen Fehler bis zum 21.08.2026 aber stumm. Ist der Speicher gesperrt,
     verschwinden Elias' Urteile lautlos, und beim naechsten Oeffnen faengt
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
      + 'Deine Urteile stehen nur im Arbeitsspeicher — beim Neuladen oder Schließen '
      + 'sind sie weg. Kopier dir das Ergebnis heraus, bevor du die Seite verlässt.';
    var anker = document.getElementById('balken') || document.getElementById('ergebnis');
    if (anker && anker.parentNode) anker.parentNode.insertBefore(d, anker);
  }

  function sichern(){
    if (!SPEICHER_GEHT) return;
    try {
      localStorage.setItem(SPEICHER, JSON.stringify(stand));
      localStorage.setItem(S_SATZ2, JSON.stringify(satz));
      /* ⛔ Die alten Listen WEITER mitschreiben — sonst saehe die alte
         Auswahlseite ab jetzt nichts mehr von dem, was er hier entscheidet.
         'aendern' zaehlt dort nicht als 'raus': die Regel bleibt drin, sie
         soll nur ueberarbeitet werden. */
      var aRaus = [], aDrin = [];
      Object.keys(satz).forEach(function(i){
        if (satz[i].u === 'raus') aRaus.push(i);
        else if (satz[i].u === 'drin' || satz[i].u === 'aendern') aDrin.push(i);
      });
      localStorage.setItem(S_SATZ, JSON.stringify(aRaus));
      localStorage.setItem(S_SATZ + '-drin', JSON.stringify(aDrin));
    }
    catch(e){ SPEICHER_GEHT = false; warneSpeicher(); }
  }

  function zeichnen(){
    var n = 0;
    var proKap = {};
    regeln.forEach(function(el){
      var id = el.dataset.id, k = el.dataset.kap;
      proKap[k] = proKap[k] || { fertig: 0, gesamt: 0 };
      proKap[k].gesamt++;
      var e = stand[id];
      if (e && e.u){ n++; proKap[k].fertig++; el.setAttribute('data-urteil', e.u); }
      else el.removeAttribute('data-urteil');
      el.querySelectorAll('.urteil button').forEach(function(b){
        b.setAttribute('aria-pressed', String(!!e && e.u === b.dataset.u));
      });
      var notiz = el.querySelector('.notiz');
      if (e && e.n !== undefined && notiz.value !== e.n) notiz.value = e.n;
      /* Die zweite Frage. Sie zaehlt bewusst NICHT in den Fortschrittsbalken:
         der misst seit dem 18.08. die Karteikarten-Durchsicht, und eine
         Zahl, die ploetzlich etwas anderes bedeutet, ist schlimmer als
         keine. Der Satzmodus bekommt seine eigene Zeile darunter. */
      var se = satz[id];
      var sWert = (se && se.u) || '';
      if (sWert) el.setAttribute('data-satz', sWert); else el.removeAttribute('data-satz');
      el.querySelectorAll('.urteil.satzmodus button').forEach(function(b){
        b.setAttribute('aria-pressed', String(sWert === b.dataset.s));
      });
      var sn = el.querySelector('.snotiz');
      if (sn && se && se.n !== undefined && sn.value !== se.n) sn.value = se.n;
    });
    zahl.textContent = n;
    balken.style.width = (regeln.length ? (n / regeln.length * 100) : 0) + '%';

    /* Eigene Zeile fuer die zweite Frage. Sie steht NICHT im Balken:
       der misst die Karteikarten-Durchsicht, und eine Zahl, die ihre
       Bedeutung wechselt, ist schlimmer als keine.
       [[widerspruch_liegt_in_der_beschriftung]] */
    var sZeile = document.getElementById('satzzeile');
    if (sZeile){
      var raus = 0, drin = 0, aend = 0;
      Object.keys(satz).forEach(function(i){
        if (satz[i].u === 'raus') raus++;
        else if (satz[i].u === 'drin') drin++;
        else if (satz[i].u === 'aendern') aend++;
      });
      var off = regeln.length - raus - drin - aend;
      sZeile.innerHTML = 'Satzmodus: <b>' + drin + '</b> drin · <b>' + aend + '</b> ändern · <b>'
        + raus + '</b> raus · <b>' + off + '</b> offen'
        + (ausAltEcht ? ' <span style="color:var(--still)">(' + ausAltEcht
            + ' aus der alten Auswahlseite übernommen)</span>'
          : satzGefunden ? ''
          : ' <span style="color:var(--still)">— aus der alten Auswahlseite kam nichts an.'
            + ' Entweder stand dort nichts, oder die beiden Seiten teilen ihren'
            + ' Speicher nicht. Beides sieht hier gleich aus.</span>');
    }
    Object.keys(proKap).forEach(function(k){
      var z = document.querySelector('[data-kap-zahl="' + k + '"]');
      if (z) z.textContent = proKap[k].fertig + '/' + proKap[k].gesamt;
    });
    /* ⛔ Vorher hing beides an n (den Karteikarten-Urteilen). Wer nur den
       Satzmodus durchgegangen waere, haette einen toten Kopierknopf gehabt
       und keinen Text — seine Arbeit waere im Browser gefangen geblieben.
       [[daten_ohne_zugang]] */
    var sGesamt = Object.keys(satz).length;
    knopf.disabled = (n === 0 && sGesamt === 0);
    feld.value = (n === 0 && sGesamt === 0) ? '' : text();
  }

  /* Der Text ist der eigentliche Zweck der Seite: kurz genug zum Schicken,
     vollständig genug, dass ich ohne Rückfrage weiterarbeiten kann. */
  function text(){
    var zeilen = ['Regelprüfung — ' + Object.keys(stand).length + ' beurteilt', ''];
    var nachU = { passt: [], aendern: [], streichen: [] };
    regeln.forEach(function(el){
      var e = stand[el.dataset.id];
      if (!e || !e.u) return;
      var t = el.dataset.id + (e.n && e.n.trim() ? '  — ' + e.n.trim() : '');
      nachU[e.u].push(t);
    });
    if (nachU.passt.length){
      zeilen.push('PASST (' + nachU.passt.length + '):');
      nachU.passt.forEach(function(t){ zeilen.push('  ' + t); });
      zeilen.push('');
    }
    ['aendern', 'streichen'].forEach(function(u){
      if (!nachU[u].length) return;
      zeilen.push(u.toUpperCase() + ' (' + nachU[u].length + '):');
      nachU[u].forEach(function(t){ zeilen.push('  ' + t); });
      zeilen.push('');
    });
    /* ⭐ Beide Entscheidungen in EINEM Text — er schickt ihn einmal, und ich
       habe alles. Vorher waren es zwei Seiten mit zwei Kopierkaesten. */
    var nachS = { drin: [], aendern: [], raus: [] };
    regeln.forEach(function(el){
      var e2 = satz[el.dataset.id];
      if (!e2 || !e2.u) return;
      nachS[e2.u].push(el.dataset.id + (e2.n && e2.n.trim() ? '  — ' + e2.n.trim() : ''));
    });
    if (nachS.drin.length || nachS.aendern.length || nachS.raus.length){
      zeilen.push('— — — SATZMODUS — — —', '');
      ['drin', 'aendern', 'raus'].forEach(function(u){
        if (!nachS[u].length) return;
        zeilen.push(u.toUpperCase() + ' (' + nachS[u].length + '):');
        nachS[u].forEach(function(x){ zeilen.push('  ' + x); });
        zeilen.push('');
      });
    }
    return zeilen.join('\\n');
  }

  /* Filter. Gezählt wird weiter über alle Regeln — hier geht es nur um
     Sichtbarkeit. Ein Kapitel, aus dem nichts übrig bleibt, verschwindet mit. */
  var ansicht = 'alle';
  var leer = document.getElementById('leer');

  function filtern(){
    var sichtbar = 0;
    regeln.forEach(function(el){
      var e = stand[el.dataset.id];
      var zeigen = ansicht === 'alle'
        || (ansicht === 'neu' && el.dataset.neu === '1')
        /* ⭐ „offen" heisst jetzt: mindestens EINE der beiden Fragen fehlt.
           Sonst verschwaende die Ansicht genau die Regeln, bei denen nur
           noch der Satzmodus fehlt — und die sind der Grund, warum diese
           Seite ueberhaupt verschmolzen wurde. */
        || (ansicht === 'offen' && (!(e && e.u)
            || !((satz[el.dataset.id] || {}).u)));
      el.classList.toggle('verborgen', !zeigen);
      if (zeigen) sichtbar++;
    });
    [].slice.call(document.querySelectorAll('.kapitel')).forEach(function(sec){
      var offen = sec.querySelectorAll('.regel:not(.verborgen)').length;
      sec.classList.toggle('verborgen', offen === 0);
    });
    leer.classList.toggle('an', sichtbar === 0);
  }

  document.addEventListener('click', function(ev){
    var f = ev.target.closest('.filter button');
    if (f){
      ansicht = f.dataset.f;
      [].slice.call(document.querySelectorAll('.filter button')).forEach(function(b){
        b.setAttribute('aria-pressed', String(b.dataset.f === ansicht));
      });
      filtern();
      return;
    }
    var b = ev.target.closest('.urteil button');
    if (!b) return;
    var el = b.closest('.regel'), id = el.dataset.id;

    /* ⛔ Die Satzmodus-Knoepfe liegen im SELBEN .urteil-Behaelter und muessen
       deshalb VOR der Karteikarten-Logik abgefangen werden — sonst schriebe
       ein Klick auf „drin" ein leeres Urteil in den Karteikarten-Stand und
       loeschte das Urteil, das dort schon stand. */
    if (b.dataset.s){
      satz[id] = satz[id] || {};
      /* Nochmal auf dasselbe tippen nimmt es zurueck — wie bei der Karteikarte. */
      satz[id].u = (satz[id].u === b.dataset.s) ? null : b.dataset.s;
      if (!satz[id].u && !(satz[id].n || '').trim()) delete satz[id];
      sichern(); zeichnen(); filtern();
      return;
    }

    stand[id] = stand[id] || {};
    /* Nochmal auf dasselbe tippen nimmt das Urteil zurück — sonst kommt man aus
       einem Fehlgriff nicht mehr heraus. */
    stand[id].u = (stand[id].u === b.dataset.u) ? null : b.dataset.u;
    if (!stand[id].u && !(stand[id].n || '').trim()) delete stand[id];
    sichern(); zeichnen(); filtern();
  });

  document.addEventListener('input', function(ev){
    /* ⛔ ZUERST die Satzmodus-Notiz. Sie traegt eine eigene Klasse, weil der
       Handler darunter sonst in den Karteikarten-Stand schriebe. */
    if (ev.target.classList.contains('snotiz')){
      var sEl = ev.target.closest('.regel'), sId = sEl.dataset.id;
      satz[sId] = satz[sId] || {};
      /* ⛔ ROH speichern, NICHT trimmen. zeichnen() schreibt den gespeicherten
         Wert ins Feld zurueck — ein hier weggeschnittenes Leerzeichen wird
         dadurch im selben Wimpernschlag aus dem Feld geloescht, und die
         Leertaste sieht aus, als tue sie nichts. Getrimmt wird bei der
         AUSGABE, siehe text(). */
      satz[sId].n = ev.target.value;
      if (!satz[sId].n.trim() && !satz[sId].u) delete satz[sId];
      sichern(); zeichnen();
      return;
    }
    if (!ev.target.classList.contains('notiz')) return;
    var el = ev.target.closest('.regel'), id = el.dataset.id;
    stand[id] = stand[id] || {};
    /* Gleiche Behandlung wie oben — hier faellt der trim() nur nicht auf,
       weil dieser Zweig kein zeichnen() ruft. Ein Unterschied, der keiner
       sein soll. */
    stand[id].n = ev.target.value;
    if (!stand[id].n.trim() && !stand[id].u) delete stand[id];
    sichern();
    feld.value = Object.keys(stand).length ? text() : '';
  });

  knopf.addEventListener('click', function(){
    feld.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){}
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(feld.value).catch(function(){});
    knopf.textContent = 'kopiert';
    setTimeout(function(){ knopf.textContent = 'Ergebnis kopieren'; }, 1400);
  });

  zeichnen(); filtern();
  /* ⛔ AUCH BEIM START warnen. War der Speicher von Anfang an gesperrt, ist
     SPEICHER_GEHT schon false, sichern() kehrt sofort um und die Warnung
     kaeme nie — der haeufigere Fall also stumm. */
  warneSpeicher();
})();
</script>
`;

fs.writeFileSync(S + 'regelpruefung.html', html, 'utf8');
console.log('geschrieben:', Math.round(html.length / 1024), 'KB');
console.log('Regeln:', regeln.length, '| Kapitel:', kapNummern.join(', '));
console.log('mit Beispielsatz:', regeln.filter(r => r.satz).length);
