#!/usr/bin/env node
/* pruefe-durchklicken.mjs — öffnet die App im unsichtbaren Browser und klickt sie durch (12.11.2026)
 * ==========================================================================
 *
 *   node werkzeuge/pruefe-durchklicken.mjs
 *
 * Elias, 12.11.2026, in der Sitzung zur Russisch-App, auf die Liste fehlender Prüfer (Punkt 5:
 * „ein Prüfer, der die App selbst öffnet und jeden Bildschirm durchklickt“): „alle hören sich gut
 * an, der letzte wäre auch für arabisch sicherlich gut“ und „mach den 5ten prüfer auch für
 * arabisch“. Gegenstück: Vokabeltrainer-Russisch/werkzeuge/pruefe-durchklicken.mjs.
 *
 * Ohne Installation: Edge über das DevTools-Protokoll (werkzeuge/browser.mjs), LEERES Profil
 * (nie Elias' Lernstand, nie sein Service Worker), eigener Port 8149. Bei 375×812 und 1024×768:
 *   1. Jeder Bildschirm: öffnet sich, zeigt Text, nichts ragt quer hinaus.
 *   2. Lernen: „Jetzt lernen“ → Karte → weiter; Wort oder Zähler ändert sich.
 *   3. Satz-Modus: eine Aufgabe beantworten → Rückmeldung → „Weiter“ bringt eine neue.
 *   4. Hören: der Abspielknopf spricht (gemessen als Aufruf von speakArabic).
 *   5. Suche: „Buch“ bringt Treffer.
 *   6. Ohne Netz: jede Datei der Liste in sw.js ist abrufbar, der Service Worker legt den Vorrat an.
 *   7. Über alles: kein Fehler in der Konsole.
 *   8. ⭐ Einmal (bei 375 px): pruefe-oberflaeche.js — der Regressionslauf, der bis heute NIE
 *      automatisch lief („er braucht ein DOM und die geladene App“, siehe dessen Kopf und
 *      NUR_IM_BROWSER in alle-pruefer.mjs). Im leeren Profil darf er schreiben, was er will.
 * Störtest: Seite zu breit, ein Fehler in der Konsole, ein toter Knopf — jede Störung muss rot.
 *
 * Was das NICHT prüft: wie es aussieht, Ton am Handy, Anmeldung und Geräteabgleich.
 */
import { oeffneApp } from './browser.mjs';

const DURCHGANG = (stoerung) => `(async () => {
  const warte = ms => new Promise(r => setTimeout(r, ms));
  const b = [];
  const sichtbar = el => !!el && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && el.getBoundingClientRect().width > 0;
  const rufe = []; window.speakArabic = t => rufe.push(String(t));
  const quer = () => {
    if (document.documentElement.scrollWidth > innerWidth + 1) return 'Seite ' + document.documentElement.scrollWidth + ' px';
    const aktiv = document.querySelector('.screen.active');
    if (!aktiv) return '';
    for (const el of aktiv.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right <= innerWidth + 1 || !r.width || !sichtbar(el)) continue;
      let p = el.parentElement, rollt = false;
      while (p && p !== aktiv) { if (/auto|scroll/.test(getComputedStyle(p).overflowX)) { rollt = true; break; } p = p.parentElement; }
      if (!rollt) return (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' reicht bis ' + Math.round(r.right) + ' px';
    }
    return '';
  };
  const stoerung = ${JSON.stringify(stoerung)};
  if (stoerung === 'breit') { const p = document.createElement('div'); p.style.cssText = 'width:2000px;height:4px'; document.getElementById('screen-hoeren').appendChild(p); }
  if (stoerung === 'fehler') setTimeout(() => { throw new Error('Probe-Fehler'); }, 0);
  if (stoerung === 'tot') window.addEventListener('click', e => { if (e.target.closest('#btnStartLearning')) e.stopImmediatePropagation(); }, true);

  // 1. jeder Bildschirm (learn, wordlist und quranfull erreicht man nur über einen Weg; fertig, „Runde geschafft“,
  //    seit 24.11.2026 nur am Ende einer Lernrunde — js/abschluss.js, bewacht von test-abschluss.mjs)
  const bildschirme = [...document.querySelectorAll('.screen')].map(s => s.id.replace('screen-', ''));
  for (const s of bildschirme) {
    if (['learn', 'wordlist', 'quranfull', 'fertig'].includes(s)) continue;
    showScreen(s); await warte(300);
    const el = document.getElementById('screen-' + s);
    if (!el.classList.contains('active')) { b.push('Bildschirm ' + s + ' lässt sich nicht öffnen'); continue; }
    if (s !== 'suche' && el.innerText.trim().length < 20) b.push('Bildschirm ' + s + ' ist leer');
    const q = quer(); if (q) b.push('Bildschirm ' + s + ' zu breit: ' + q);
  }
  showScreen('categories'); await warte(300);
  const kapitel = [...document.querySelectorAll('#screen-categories .list-row')].find(sichtbar);
  if (!kapitel) b.push('Kapitelliste ohne Eintrag'); else {
    kapitel.click(); await warte(500);
    if (!document.getElementById('screen-wordlist').classList.contains('active')) b.push('Kapitel antippen öffnet die Wortliste nicht');
    else { const q = quer(); if (q) b.push('Wortliste zu breit: ' + q); }
  }

  // 2. Lernen
  showScreen('home'); await warte(300);
  document.getElementById('btnStartLearning').click(); await warte(600);
  const lern = document.getElementById('screen-learn');
  if (!lern.classList.contains('active')) b.push('„Jetzt lernen“ öffnet das Lernen nicht');
  else {
    const stand = () => (lern.innerText.match(/\\d+\\s*\\/\\s*\\d+/) || [''])[0] + '|' + document.getElementById('flashcard').innerText.trim();
    const vorher = stand();
    if (document.getElementById('flashcard').innerText.trim().length < 1) b.push('Lernkarte ohne Wort');
    const q = quer(); if (q) b.push('Lernen zu breit: ' + q);
    for (let i = 0; i < 6 && stand() === vorher; i++) {
      const weiter = () => ['btnInfoWeiter', 'btnRight', 'btnLeicht'].map(id => document.getElementById(id)).find(sichtbar);
      if (!weiter()) { document.getElementById('flashcard').click(); await warte(400); }
      if (weiter()) { weiter().click(); await warte(500); }
    }
    if (stand() === vorher) b.push('Lernen: weder anderes Wort noch Zähler weiter (' + vorher.slice(0, 40) + ')');
    document.getElementById('btnExitLearn').click(); await warte(400);
  }

  // 3. Satz-Modus
  showScreen('sentences'); await warte(500);
  const box = document.getElementById('uebBox');
  const frage = () => (document.getElementById('uebFrage') || {}).innerText + '|' + (document.getElementById('uebHerkunft') || {}).innerText + '|' + box.innerText.length;
  if (!sichtbar(box)) b.push('Satz-Modus: keine Aufgabe zu sehen');
  else {
    const f0 = frage();
    let geantwortet = false;
    for (let runde = 0; runde < 6 && !geantwortet; runde++) {
      const option = [...box.querySelectorAll('.ueb-option')].find(sichtbar) || [...box.querySelectorAll('#uebBank .ueb-wort')].find(sichtbar);
      const eingabe = document.getElementById('uebEingabe');
      if (option) { option.click(); await warte(300); }
      else if (sichtbar(eingabe)) { eingabe.value = 'Probe'; eingabe.dispatchEvent(new Event('input', { bubbles: true })); }
      const pruefen = document.getElementById('btnUebPruefen');
      if (sichtbar(pruefen) && !pruefen.disabled) { pruefen.click(); await warte(300); }
      geantwortet = sichtbar(document.getElementById('btnUebWeiter')) || !!box.querySelector('.richtig, .falsch');
    }
    if (!geantwortet) b.push('Satz-Modus: nach einer Antwort keine Rückmeldung');
    const weiter = document.getElementById('btnUebWeiter');
    if (sichtbar(weiter)) { weiter.click(); await warte(500); if (frage() === f0) b.push('Satz-Modus: „Weiter“ bringt keine neue Aufgabe'); }
  }

  // 4. Hören
  showScreen('hoeren'); await warte(400);
  const t0 = rufe.length;
  if (!sichtbar(document.getElementById('btnHoerPlay'))) {
    const start = [...document.querySelectorAll('#screen-hoeren button')].find(k => sichtbar(k) && /start|los|hören/i.test(k.innerText));
    if (start) { start.click(); await warte(600); }
  }
  if (sichtbar(document.getElementById('btnHoerPlay'))) { document.getElementById('btnHoerPlay').click(); await warte(300); }
  if (rufe.length === t0) b.push('Hören: der Abspielknopf spricht nicht');
  { const q = quer(); if (q) b.push('Hören zu breit: ' + q); }
  showScreen('home'); await warte(300);

  // 5. Suche
  const suche = document.getElementById('startSuche');
  const zaehle = () => document.body.innerText.split('Buch').length;
  const vor = zaehle();
  suche.value = 'Buch'; suche.dispatchEvent(new Event('input', { bubbles: true })); await warte(700);
  if (zaehle() <= vor + 1) b.push('Suche nach „Buch“ bringt keine Treffer');
  suche.value = ''; suche.dispatchEvent(new Event('input', { bubbles: true })); await warte(200);

  // 6. Dateien der Liste in sw.js
  const sw = await (await fetch('sw.js', { cache: 'no-store' })).text();
  const liste = [...sw.matchAll(/^\\s*'(\\.\\/[^']*)',?\\s*$/gm)].map(m => m[1]);
  if (liste.length < 30) b.push('Liste in sw.js nicht gelesen (' + liste.length + ' Einträge)');
  for (const p of liste) { const r = await fetch(p, { cache: 'no-store', method: 'HEAD' }); if (!r.ok) b.push('sw.js nennt ' + p + ', aber der Abruf gibt ' + r.status); }

  return { befunde: b, bildschirme: bildschirme.length, dateien: liste.length };
})()`;

const VORRAT = `(async () => {
  const b = [];
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 20000))]);
  if (!reg) return ['Service Worker wird nicht bereit'];
  const name = ((await (await fetch('sw.js', { cache: 'no-store' })).text()).match(/CACHE_NAME *= *'([^']+)'/) || [])[1];
  for (let i = 0; i < 150 && !(await caches.keys()).includes(name); i++) await new Promise(r => setTimeout(r, 200));
  if (!(await caches.keys()).includes(name)) b.push('Vorrat ' + name + ' wird nicht angelegt');
  else { const n = (await (await caches.open(name)).keys()).length; if (n < 30) b.push('Vorrat ' + name + ' hat nur ' + n + ' Dateien'); }
  return b;
})()`;

const OBERFLAECHE = `(async () => {
  const text = await (await fetch('pruefe-oberflaeche.js', { cache: 'no-store' })).text();
  const erg = await (0, eval)(text);
  return { fehler: erg.fehler, liste: erg.ergebnis.filter(e => e.status === 'FEHLER').map(e => JSON.stringify(e).slice(0, 200)), zahl: erg.ergebnis.length };
})()`;

async function durchgang(breite, hoehe, stoerung, mitOberflaeche) {
  const app = await oeffneApp({ breite, hoehe });
  try {
    const erg = await app.rechne(DURCHGANG(stoerung));
    if (!stoerung) {
      erg.befunde.push(...await app.rechne(VORRAT));
      if (mitOberflaeche) {
        await app.laden();
        const o = await app.rechne(OBERFLAECHE);
        erg.oberflaeche = o.zahl;
        erg.befunde.push(...o.liste.map(x => 'pruefe-oberflaeche.js: ' + x));
      }
    }
    await new Promise(r => setTimeout(r, 200));
    erg.befunde.push(...app.fehler.map(f => 'Fehler im Browser: ' + f));
    return erg;
  } finally { await app.schliessen(); }
}

const gesamt = [];
let info = '';
try {
  for (const [breite, hoehe, mitO] of [[375, 812, true], [1024, 768, false]]) {
    const erg = await durchgang(breite, hoehe, null, mitO);
    if (mitO) info = erg.bildschirme + ' Bildschirme, ' + erg.dateien + ' Dateien aus sw.js, pruefe-oberflaeche.js mit ' + erg.oberflaeche + ' Prüfpunkten';
    gesamt.push(...erg.befunde.map(x => breite + ' px · ' + x));
  }
} catch (e) { console.log('⛔ pruefe-durchklicken: ' + e.message); process.exit(1); }

console.log('Durchgang bei 375 und 1024 px: ' + info);
for (const x of gesamt) console.log('   BEFUND ' + x);
let rot = 0;
const stoerungen = ['breit', 'fehler', 'tot'];
for (const s of stoerungen) {
  const erg = await durchgang(375, 812, s, false);
  if (erg.befunde.length) rot++; else console.log('   ⛔ Störtest NICHT rot: ' + s);
}
console.log('Störtest: ' + rot + ' von ' + stoerungen.length + ' rot');
const ok = !gesamt.length && rot === stoerungen.length;
console.log(ok ? 'pruefe-durchklicken: grün' : 'pruefe-durchklicken: ROT');
process.exitCode = ok ? 0 : 1;
