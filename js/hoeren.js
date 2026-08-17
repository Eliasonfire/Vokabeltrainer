/* hoeren.js -- Hoerverstehen: das Wort nur hoeren, dann die Bedeutung waehlen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   Warum ein eigener Modus: im Lernmodus steht das arabische Wort immer da.
   Wer es liest, uebt Lesen - nicht Hoeren. Hier ist die Schrift bis zur
   Antwort weg, es gibt nur den Ton.

   Die Ablenker sind nicht beliebig gewuerfelt. Sie kommen bevorzugt aus
   demselben Kapitel und, wenn es geht, mit derselben Wortart - Woerter, die
   Elias gerade wirklich lernt und die sich aehnlich anhoeren koennen. Ein
   Ablenker aus einem Buch, das er nie geoeffnet hat, macht die Aufgabe nur
   scheinbar schwerer.

   Der Fortschritt aus dem Leitner-System wird hier NICHT angefasst: Hoeren
   und Lesen sind verschiedene Faehigkeiten, und eine falsche Hoerantwort
   soll eine sicher gelesene Vokabel nicht zurueckwerfen. Der Modus zaehlt
   nur seine eigene Runde. */

const HOER = { wort: null, optionen: [], beantwortet: false, richtig: 0, gesamt: 0, fertig: false };

/* ---------- Tagesziel (Elias, 17.08.2026) ----------

   "es sollte beim hören auch ein tagesziel geben wie auch bei den wurzeln oder
   auch bei den karteikarten. einfach so ein paar machen ums tagesziel zu machen
   und es reicht. aktuell sieht es aus als gäbe es da kein ende."

   Er hatte recht: `naechsteHoerfrage()` rief sich schlicht immer weiter auf, es
   gab keinen Punkt, an dem man fertig war.

   ⭐ TAG, nicht Runde - und das ist der Unterschied zu den Karteikarten, wo
   beides existiert (20 Karten = Runde, leerer Vorrat = Tagesziel). Hier gibt es
   keinen "Vorrat", der leer werden koennte: die Fragen werden aus dem ganzen
   Wortschatz gewuerfelt und gingen nie aus. Deshalb ist die Zahl selbst das
   Ziel.

   ⚠️ Nach dem Ziel wird NICHT gesperrt. "es reicht" heisst: er soll wissen,
   wann genug ist - nicht, dass ihm die Uebung weggenommen wird. Der Zaehler
   laeuft weiter ("12 von 10"), der Zustand sieht nur deutlich anders aus. */
const HOER_TAGESZIEL = 10;

function hoerTag(){
  const heute = todayStr(0);
  let t = LS.get('vt_hoerTag', null);
  if (!t || t.tag !== heute) t = { tag: heute, gesamt: 0, richtig: 0 };
  return t;
}
function hoerTagSpeichern(t){ LS.set('vt_hoerTag', t); }

/* Die Standzeile fuehrt das Tagesziel mit - vorher stand dort nur "x von y
   richtig", also die Trefferquote der laufenden Sitzung. Die sagt nichts
   darueber, wie weit man ist. */
function hoerStandSchreiben(){
  const t = hoerTag();
  const geschafft = t.gesamt >= HOER_TAGESZIEL;
  document.getElementById('hoerStand').textContent = geschafft
    ? `Tagesziel geschafft — ${t.gesamt} Wörter, ${t.richtig} richtig`
    : `Tagesziel ${t.gesamt} von ${HOER_TAGESZIEL}` + (t.gesamt ? ` · ${t.richtig} richtig` : '');
}

/* Nur Vokabeln mit brauchbarer deutscher Bedeutung - ohne die gaebe es keine
   Antwortmoeglichkeiten. */
function hoerbareVokabeln(){
  /* ⚠️ `bekannteVokabeln()` und nicht `buchVokabeln()` — seit dem 17.08.2026.
     Elias: "sind beim hörmodus wirklich mit allen wörtern die ich aktuell
     lerne? es wäre wichtig das er alle hat aber auch immer mehr unlockt mit den
     kapiteln die ich dann auch kann. halt nur das was ich bereits weiß."

     Gemessen war der Vorrat **311** Wörter, davon **140 ausserhalb seines
     Lernbestands** — allein Kapitel 24 steuerte 67 bei, Kapitel 12–23 weitere.
     Der Modus fragte also Wörter ab, die er nie gesehen hat, und zwar sowohl
     als Frage wie als Ablenker. Beim Hören ist das schlimmer als beim Lesen:
     man kann nicht einmal raten, wenn man das Wort nie gehört hat.

     `bekannteVokabeln()` (js/kern.js) ist genau die gesuchte Menge und waechst
     von selbst mit: freigeschaltete Kapitel des jeweiligen Buchs + eigene
     Wörter + der handverlesene Lernbestand aus vocab-data.js. */
  let pool = bekannteVokabeln().filter(w => w.ar && w.de && String(w.de).trim().length > 1);
  /* Die Kapitelauswahl von der Startseite gilt auch hier - sonst uebt man das
     halbe Buch, obwohl oben "Kapitel 3" eingestellt ist. Nur wenn dabei zu
     wenig uebrig bleibt, um vier Antworten zu bilden, wird sie ignoriert;
     eine leere Karte waere unbrauchbarer als ein Ablenker aus Kapitel 4. */
  /* ⚠️ Seit dem 11.08.2026 je Buch: ein Wort zaehlt, wenn SEIN Buch keine
     Kapitel eingeengt hat oder sein Kapitel darin steht. Eine gemeinsame Liste
     waere hier falsch - Kapitel 3 aus Madina 1 wuerde sonst Kapitel 3 aus
     Bayna Yadayk freischalten. */
  if (typeof irgendwoEingeengt === 'function' && irgendwoEingeengt()){
    const eng = pool.filter(w => {
      if (w.chapter === 'personal') return true;
      const sel = kapitelAuswahl(w.book);
      return !sel.length || sel.indexOf(w.chapter) >= 0;
    });
    if (eng.length >= 4) pool = eng;
  }
  return pool;
}

function waehleAblenker(ziel, pool, anzahl){
  const anders = w => w.id !== ziel.id && w.de !== ziel.de;
  const gleichesKapitel = pool.filter(w => anders(w) && w.chapter === ziel.chapter);
  const gleicheWortart  = gleichesKapitel.filter(w => w.type === ziel.type);
  /* Erst Kapitel + Wortart, dann nur Kapitel, dann alles - so bleibt die
     Auswahl auch in kleinen Kapiteln vollstaendig. */
  const stufen = [gleicheWortart, gleichesKapitel, pool.filter(anders)];
  const raus = [];
  const gesehen = new Set();
  for (const stufe of stufen){
    for (const w of shuffle(stufe)){
      if (raus.length >= anzahl) break;
      if (gesehen.has(w.de)) continue;
      gesehen.add(w.de);
      raus.push(w);
    }
    if (raus.length >= anzahl) break;
  }
  return raus;
}

function naechsteHoerfrage(){
  const pool = hoerbareVokabeln();
  const leer = document.getElementById('hoerLeer');
  const karte = document.getElementById('hoerKarte');
  if (pool.length < 4){
    karte.classList.add('hidden');
    leer.classList.remove('hidden');
    /* Alle gewaehlten Buecher nennen, nicht nur das erste - sonst sucht man in
       einem Buch nach der Ursache, waehrend die Auswahl aus dreien besteht. */
    const namen = (typeof aktiveBuecher === 'function' ? aktiveBuecher() : [aktivesBuch()])
      .map(buchTitel).join(', ');
    leer.textContent = `In ${namen} stehen zu wenige Vokabeln mit Bedeutung `
      + `(${pool.length}), um vier Antworten anzubieten. Waehle oben auf der Startseite mehr aus.`;
    return;
  }
  karte.classList.remove('hidden');
  leer.classList.add('hidden');

  HOER.wort = shuffle(pool)[0];
  HOER.optionen = shuffle([HOER.wort, ...waehleAblenker(HOER.wort, pool, 3)]);
  HOER.beantwortet = false;
  HOER.fertig = false;

  hoerStandSchreiben();
  document.getElementById('hoerHinweis').textContent = 'Was bedeutet das Wort?';
  document.getElementById('hoerLoesung').classList.add('hidden');
  document.getElementById('hoerOptionen').innerHTML = HOER.optionen.map((w, i)=>
    `<button class="hoer-option" data-hoerwahl="${i}">${escapeHtml(w.de)}</button>`).join('');

  hoerAbspielen();
}

function hoerAbspielen(){
  if (!HOER.wort) return;
  const knopf = document.getElementById('btnHoerPlay');
  knopf.classList.add('spielt');
  setTimeout(()=>knopf.classList.remove('spielt'), 600);
  /* Die Vollform mit Endung sprechen, nicht die nackte Schreibweise - so
     hoert Elias das Wort, wie es im Satz klingt. */
  speakArabic(HOER.wort.sg || HOER.wort.ar);
}

function beantworteHoerfrage(i){
  if (HOER.beantwortet) return;
  HOER.beantwortet = true;
  HOER.gesamt++;
  const gewaehlt = HOER.optionen[i];
  const richtig = gewaehlt.id === HOER.wort.id;
  if (richtig) HOER.richtig++;

  document.querySelectorAll('#hoerOptionen .hoer-option').forEach((b, j)=>{
    b.disabled = true;
    if (HOER.optionen[j].id === HOER.wort.id) b.classList.add('richtig');
    else if (j === i) b.classList.add('falsch');
  });

  const w = HOER.wort;
  const l = document.getElementById('hoerLoesung');
  l.innerHTML = `<div class="hl-ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</div>`
    /* ⚠️ Die Wurzel stand hier bis zum 30.07.2026 dahinter. Elias: "bei dem
       hoerverstehen sollen die wurzeln weg, da soll einfach nur die uebersetzung
       stehen." Dieselbe Entscheidung wie bei den Wortfeldern, wo er den
       Wurzel-Reiter abgewaehlt hat: "3 random arabische Buchstaben machen fuer
       mich als Wortstamm keinen Sinn." Die Wurzel bleibt in den Daten. */
    + `<div class="hl-de">${escapeHtml(w.de)}</div>`;
  l.classList.remove('hidden');

  /* Tageszaehler fortschreiben, BEVOR die Standzeile neu geschrieben wird -
     sonst zeigt sie den Stand von vor dieser Antwort. */
  const t = hoerTag();
  const vorher = t.gesamt;
  t.gesamt++;
  if (richtig) t.richtig++;
  hoerTagSpeichern(t);
  hoerStandSchreiben();

  const zielJetztErreicht = vorher < HOER_TAGESZIEL && t.gesamt >= HOER_TAGESZIEL;
  if (zielJetztErreicht){
    HOER.fertig = true;
    document.getElementById('hoerHinweis').textContent =
      'Tagesziel geschafft — tippe, wenn du trotzdem weitermachen willst.';
    /* Der Anlass ist `einmalig` je Tag, siehe js/feier.js - zweimal am selben
       Tag zu feiern wuerde die Feier entwerten. */
    if (typeof feiere === 'function') feiere('hoer-tagesziel', { zahl: t.gesamt, richtig: t.richtig });
  } else {
    document.getElementById('hoerHinweis').textContent = richtig
      ? 'Richtig — tippe für das nächste Wort.'
      : 'Nicht ganz — tippe für das nächste Wort.';
  }

  /* Nach der Antwort noch einmal vorsprechen: jetzt sieht man die Schrift
     dazu, und genau dabei praegt sich der Klang ein. */
  setTimeout(()=>speakArabic(w.sg || w.ar), 320);
}

document.getElementById('hoerOptionen').addEventListener('click', (e)=>{
  const b = e.target.closest('[data-hoerwahl]');
  if (!b || HOER.beantwortet) return;
  /* ⚠️ Diesen einen Klick markieren. Er blubbert gleich weiter zur Karte, und
     dort steht `beantwortet` dann schon auf true - ohne die Marke wuerde
     derselbe Fingertipp erst antworten und sofort weiterschalten, die Loesung
     waere nie zu sehen. Am ZIEL des Klicks ist das nicht zu unterscheiden: nach
     dem Antworten liegt der Knopf am selben Fleck und ist dann abgeschaltet. */
  e._hatBeantwortet = true;
  beantworteHoerfrage(Number(b.dataset.hoerwahl));
});
/* ---------- Weiter durch Tippen auf die Karte (Elias, 17.08.2026) ----------

   "ich will aber eigentlich sobald ich eine antwort gegeben habe auf dem grauen
   feld auf der karte einfach klicken damit das nächste kommt."

   Vorher hoerten nur zwei kleine Ziele darauf: der Lautsprecher und die
   Hinweiszeile. Der Hinweis sagte zwar schon "tippe für das nächste Wort", die
   Flaeche dazu war aber nur die Textzeile selbst - man tippt aber dorthin, wo
   man gerade hinschaut, und das sind die Antwortfelder.

   ⚠️ EIN Zuhoerer an der Karte statt drei einzelne. Der Lautsprecher liegt auf
   der Karte; ein eigener Zuhoerer dort wuerde zusaetzlich hochblubbern und
   naechsteHoerfrage() zweimal ausloesen - also ein Wort ueberspringen, ohne
   dass es wie ein Fehler aussieht. Deshalb entscheidet eine Stelle, was der
   Klick bedeutet.

   ⚠️ Ein Klick auf ein Antwortfeld ist KEIN Weiter: `#hoerOptionen` beantwortet
   die Frage, danach setzt der Browser die Knoepfe auf `disabled`. Damit die
   Karte darunter den Klick trotzdem bekommt, tragen abgeschaltete Knoepfe
   `pointer-events:none` (siehe index.html). */
document.getElementById('hoerKarte').addEventListener('click', (e)=>{
  if (e._hatBeantwortet) return;                        /* genau dieser Klick war die Antwort */
  if (HOER.beantwortet){ naechsteHoerfrage(); return; } /* egal wo auf der Karte, auch nach dem Tagesziel */
  if (e.target.closest('#btnHoerPlay')) hoerAbspielen();
});

function openHoeren(){
  /* Ohne arabische Stimme waere der Modus stumm und damit sinnlos - das
     lieber sagen als eine leere Karte zeigen. */
  if (!('speechSynthesis' in window)){
    document.getElementById('hoerKarte').classList.add('hidden');
    const leer = document.getElementById('hoerLeer');
    leer.classList.remove('hidden');
    leer.textContent = 'Dieser Browser kann keine Sprachausgabe. Ohne sie funktioniert der Hörmodus nicht.';
    return;
  }
  HOER.richtig = 0; HOER.gesamt = 0;
  naechsteHoerfrage();
}
