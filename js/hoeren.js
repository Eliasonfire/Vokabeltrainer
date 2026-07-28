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

const HOER = { wort: null, optionen: [], beantwortet: false, richtig: 0, gesamt: 0 };

/* Nur Vokabeln mit brauchbarer deutscher Bedeutung - ohne die gaebe es keine
   Antwortmoeglichkeiten. */
function hoerbareVokabeln(){
  let pool = buchVokabeln().filter(w => w.ar && w.de && String(w.de).trim().length > 1);
  /* Die Kapitelauswahl von der Startseite gilt auch hier - sonst uebt man das
     halbe Buch, obwohl oben "Kapitel 3" eingestellt ist. Nur wenn dabei zu
     wenig uebrig bleibt, um vier Antworten zu bilden, wird sie ignoriert;
     eine leere Karte waere unbrauchbarer als ein Ablenker aus Kapitel 4. */
  const sel = SETTINGS.selectedChapters || [];
  if (sel.length){
    const eng = pool.filter(w => sel.includes(w.chapter));
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
    leer.textContent = `In ${buchTitel(aktivesBuch())} stehen zu wenige Vokabeln mit Bedeutung `
      + `(${pool.length}), um vier Antworten anzubieten. Wechsle oben auf der Startseite das Buch.`;
    return;
  }
  karte.classList.remove('hidden');
  leer.classList.add('hidden');

  HOER.wort = shuffle(pool)[0];
  HOER.optionen = shuffle([HOER.wort, ...waehleAblenker(HOER.wort, pool, 3)]);
  HOER.beantwortet = false;

  document.getElementById('hoerStand').textContent = HOER.gesamt
    ? `${HOER.richtig} von ${HOER.gesamt} richtig`
    : 'Tippe auf den Lautsprecher.';
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
    + `<div class="hl-de">${escapeHtml(w.de)}${w.root ? ` · Wurzel ${escapeHtml(w.root)}` : ''}</div>`;
  l.classList.remove('hidden');
  document.getElementById('hoerStand').textContent = `${HOER.richtig} von ${HOER.gesamt} richtig`;
  document.getElementById('hoerHinweis').textContent = richtig
    ? 'Richtig — tippe für das nächste Wort.'
    : 'Nicht ganz — tippe für das nächste Wort.';

  /* Nach der Antwort noch einmal vorsprechen: jetzt sieht man die Schrift
     dazu, und genau dabei praegt sich der Klang ein. */
  setTimeout(()=>speakArabic(w.sg || w.ar), 320);
}

document.getElementById('hoerOptionen').addEventListener('click', (e)=>{
  const b = e.target.closest('[data-hoerwahl]');
  if (b) beantworteHoerfrage(Number(b.dataset.hoerwahl));
});
document.getElementById('btnHoerPlay').addEventListener('click', ()=>{
  if (HOER.beantwortet) naechsteHoerfrage(); else hoerAbspielen();
});
document.getElementById('hoerHinweis').addEventListener('click', ()=>{
  if (HOER.beantwortet) naechsteHoerfrage();
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
