#!/usr/bin/env node
/* test-tippen-tablet.mjs — arabische Tasten unter dem Tippfeld: am Tablet ja, am Handy nein.
 * ==========================================================================
 *
 * ⛔⛔ DER SATZ, DEN DIESER PRÜFSTAND BEWACHT — VON ELIAS, 11.10.2026
 *
 *   „wenn ich bei karteikarten das arabische schreiben soll will ich das sich bei mir
 *   automatisch die arabische tastatur öffnet" — und auf meinen Vorschlag, eigene Tasten
 *   unter das Feld zu bauen: „für mein tablet wäre das praktisch, für mein handy will
 *   ich das nicht".
 *
 * Die AUSNAHME ist der Kern: am Handy darf sich NICHTS ändern — kein Tastenkasten, kein
 * `inputmode` am Feld (sonst ginge dort seine Tastatur nicht mehr auf).
 *
 * Alles läuft am ECHTEN Quelltext von js/lernen.js: die Funktionen werden herausgeschnitten
 * und gegen ein Doppel der Seite gefahren.
 *   A  Geräteerkennung (Handy, Tablet hoch und quer, PC ohne Berührung, Grenze 600)
 *   B  Handy: Feld da, Tasten verborgen und leer, kein inputmode
 *   C  Tablet: Tasten da, inputmode none; zurück am Handy ist beides wieder weg
 *   D  die 36 Tasten: das ganze Alphabet, keine Vokalzeichen, jede Taste einmal
 *   E  Schreiben an der Schreibmarke: einfügen, Auswahl ersetzen, löschen, prüfen
 *   F  Verdrahtung in index.html und js/lernen.js
 *   G  Störtests: der Quelltext wird verändert, die Prüfung MUSS es merken
 *
 * Aufruf: node test-tippen-tablet.mjs      Exit 0 = alles in Ordnung
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const lies = p => fs.readFileSync(path.join(HIER, p), 'utf8');
const LERNEN = lies('js/lernen.js');
const HTML = lies('index.html');

let fehler = 0, geprueft = 0;
function pruefe(ok, was) {
  geprueft++;
  if (!ok) { fehler++; console.log('  ⛔ ' + was); }
  return ok;
}

/* Schneidet einen Block aus dem Quelltext: von `kopf` bis zum ersten `ende` danach. */
function schneide(quelle, kopf, ende = '\n}') {
  const i = quelle.indexOf(kopf);
  if (i < 0) throw new Error('nicht gefunden im Quelltext: ' + kopf);
  const j = quelle.indexOf(ende, i);
  if (j < 0) throw new Error('Ende nicht gefunden: ' + kopf);
  return quelle.slice(i, j + ende.length);
}

const HANDY  = [{ maxTouchPoints: 5 }, { width: 412, height: 915 }];
const TABLET = [{ maxTouchPoints: 5 }, { width: 924, height: 1480 }];
const QUER   = [{ maxTouchPoints: 5 }, { width: 1480, height: 924 }];
const PC     = [{ maxTouchPoints: 0 }, { width: 1920, height: 1080 }];

/* Ein Doppel der Seite: nur, was die geschnittenen Funktionen fragen. */
function element(klassen) {
  const k = new Set(klassen || []);
  const attr = {};
  return {
    value: '', selectionStart: 0, selectionEnd: 0, innerHTML: '', textContent: '', className: '', dataset: {},
    classList: {
      add: x => k.add(x), remove: x => k.delete(x), contains: x => k.has(x),
      toggle: (x, an) => { const soll = an === undefined ? !k.has(x) : !!an; if (soll) k.add(x); else k.delete(x); return soll; },
    },
    setAttribute: (n, v) => { attr[n] = String(v); }, removeAttribute: n => { delete attr[n]; },
    getAttribute: n => (n in attr ? attr[n] : null), hasAttribute: n => n in attr,
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; },
  };
}

function stand(quelle) {
  const els = {
    cardTippBox: element(['tipp-box', 'hidden']), cardTippEingabe: element(), cardTippAntwort: element(),
    cardTippTasten: element(['tipp-tasten', 'hidden']),
  };
  const zustand = { geraet: HANDY, richtung: 'de-ar', geprueft: 0 };
  const ctx = {
    document: { getElementById: id => els[id] || null },
    SETTINGS: { tippenAbBox4: true }, PROGRESS: { k4: { box: 4 }, k3: { box: 3 } },
    SESSION: { idx: 0, words: [{ id: 'k4' }, { id: 'k3' }] },
    cardDirection: () => zustand.richtung,
    /* „Prüfen" geht seit v701 über tippPruefenUndUmdrehen(), wie die Eingabetaste — was die dann
       tut, prüft test-tippen-umdrehen.mjs. Hier zählt nur, dass die Taste sie aufruft. */
    pruefeTippen: () => { zustand.geprueft++; },
    tippPruefenUndUmdrehen: () => { zustand.geprueft++; },
  };
  Object.defineProperty(ctx, 'navigator', { get: () => zustand.geraet[0], enumerable: true });
  Object.defineProperty(ctx, 'screen', { get: () => zustand.geraet[1], enumerable: true });
  vm.createContext(ctx);
  vm.runInContext([
    schneide(quelle, 'const TIPP_TASTEN = [', '\n];'),
    schneide(quelle, 'function istTablet('),
    schneide(quelle, 'function baueTippTasten('),
    schneide(quelle, 'function zeigeTippTasten('),
    schneide(quelle, 'function tippTaste('),
    schneide(quelle, 'function renderTippfeld('),
  ].join('\n'), ctx);
  const hole = code => vm.runInContext(code, ctx);
  return {
    els, zustand, hole,
    istTablet: g => hole('istTablet(' + JSON.stringify(g[0]) + ',' + JSON.stringify(g[1]) + ')'),
    zeige: (geraet, wort = 0) => { zustand.geraet = geraet; ctx.SESSION.idx = wort; hole('renderTippfeld(SESSION.words[SESSION.idx])'); },
    taste: wert => hole('tippTaste(' + JSON.stringify(wert) + ')'),
    tasten: () => hole('TIPP_TASTEN.flat()'),
  };
}

/* Die Prüfungen als Funktionen, damit die Störtests genau die eine wiederholen können. */
const erkennung = s => s.istTablet(HANDY) === false && s.istTablet(TABLET) === true && s.istTablet(QUER) === true
  && s.istTablet(PC) === false
  && s.istTablet([{ maxTouchPoints: 5 }, { width: 599, height: 1200 }]) === false
  && s.istTablet([{ maxTouchPoints: 5 }, { width: 600, height: 960 }]) === true;
function handyUnveraendert(s) {
  s.zeige(HANDY);
  return !s.els.cardTippBox.classList.contains('hidden') && s.els.cardTippTasten.classList.contains('hidden')
    && s.els.cardTippTasten.innerHTML === '' && !s.els.cardTippEingabe.hasAttribute('inputmode')
    && !s.els.cardTippBox.classList.contains('mit-tasten');
}
function tabletHatTasten(s) {
  s.zeige(TABLET);
  return !s.els.cardTippBox.classList.contains('hidden') && !s.els.cardTippTasten.classList.contains('hidden')
    && s.els.cardTippEingabe.getAttribute('inputmode') === 'none' && s.els.cardTippBox.classList.contains('mit-tasten')
    && (s.els.cardTippTasten.innerHTML.match(/<button /g) || []).length === 39;
}
function zurueckAmHandy(s) {
  s.zeige(TABLET); s.zeige(HANDY);
  return s.els.cardTippTasten.classList.contains('hidden') && !s.els.cardTippEingabe.hasAttribute('inputmode')
    && !s.els.cardTippBox.classList.contains('mit-tasten');
}

const S = stand(LERNEN);

console.log('A  Geräteerkennung');
pruefe(S.istTablet(HANDY) === false, 'ein Handy (412 × 915, Berührung) gilt als Tablet — er will die Tasten am Handy NICHT');
pruefe(S.istTablet(TABLET) === true, 'ein Tablet (924 × 1480, Berührung) wird nicht erkannt');
pruefe(S.istTablet(QUER) === true, 'ein Tablet im Querformat wird nicht erkannt');
pruefe(S.istTablet(PC) === false, 'ein PC ohne Berührung gilt als Tablet');
pruefe(erkennung(S), 'die Grenze liegt nicht bei 600 Punkten der kürzeren Seite');

console.log('B  Handy: alles wie bisher');
pruefe(handyUnveraendert(S), 'am Handy hat sich etwas geändert: Tasten sichtbar, Kasten gefüllt, inputmode gesetzt oder Kasten verbreitert');

console.log('C  Tablet: eigene Tasten');
pruefe(tabletHatTasten(stand(LERNEN)), 'am Tablet fehlen die Tasten, das inputmode none oder eine der 39 Tasten');
pruefe(zurueckAmHandy(stand(LERNEN)), 'nach einem Tablet-Aufruf bleibt am Handy etwas hängen (inputmode, sichtbare Tasten)');
{
  const s = stand(LERNEN);
  s.zeige(TABLET, 1);
  pruefe(s.els.cardTippBox.classList.contains('hidden'), 'eine Karte in Box 3 zeigt am Tablet das Tippfeld');
  s.zustand.richtung = 'ar-de'; s.zeige(TABLET, 0);
  pruefe(s.els.cardTippBox.classList.contains('hidden'), 'fragt die Karte auf Arabisch, steht am Tablet trotzdem das Tippfeld da');
}

console.log('D  Die 36 Tasten');
const T = S.tasten();
const ALPHABET = [0x0627, 0x0628, 0x062A, 0x062B, 0x062C, 0x062D, 0x062E, 0x062F, 0x0630, 0x0631, 0x0632, 0x0633, 0x0634, 0x0635,
  0x0636, 0x0637, 0x0638, 0x0639, 0x063A, 0x0641, 0x0642, 0x0643, 0x0644, 0x0645, 0x0646, 0x0647, 0x0648, 0x064A];
const DAZU = [0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0626, 0x0629, 0x0649];
pruefe(T.length === 36 && new Set(T).size === 36, 'es sind nicht 36 verschiedene Tasten, sondern ' + T.length + ' / ' + new Set(T).size);
pruefe(ALPHABET.length === 28 && ALPHABET.every(c => T.includes(c)),
  'ein Buchstabe des Alphabets fehlt: ' + ALPHABET.filter(c => !T.includes(c)).map(c => 'U+0' + c.toString(16).toUpperCase()).join(', '));
pruefe(DAZU.every(c => T.includes(c)), 'eine Hamza-Form, das Ta marbuta oder das Alif maqsura fehlt');
pruefe(T.every(c => c >= 0x0621 && c <= 0x064A && c !== 0x0640), 'unter den Tasten steht ein Vokalzeichen oder ein fremdes Zeichen');
{
  const s = stand(LERNEN); s.zeige(TABLET);
  const html = s.els.cardTippTasten.innerHTML;
  pruefe(T.every(c => html.includes('data-taste="z' + c + '"') && html.includes('>' + String.fromCodePoint(c) + '<')),
    'nicht jede Taste steht mit ihrem Buchstaben im Kasten');
  pruefe(html.includes('data-taste="weg"') && html.includes('data-taste="leer"') && html.includes('data-taste="pruefen"'),
    'Löschen, Leerzeichen oder Prüfen fehlt');
}

console.log('E  Schreiben an der Schreibmarke');
{
  const s = stand(LERNEN); const ein = s.els.cardTippEingabe;
  const B = String.fromCodePoint(0x0628), A = String.fromCodePoint(0x0627), TA = String.fromCodePoint(0x062A), D = String.fromCodePoint(0x062F);
  s.taste('z' + 0x0628);
  pruefe(ein.value === B && ein.selectionStart === 1, 'der erste Buchstabe landet nicht im leeren Feld');
  ein.value = A + B; ein.setSelectionRange(1, 1); s.taste('z' + 0x062A);
  pruefe(ein.value === A + TA + B && ein.selectionStart === 2, 'ein Buchstabe wird nicht an der Schreibmarke eingefügt');
  ein.value = A + B + TA; ein.setSelectionRange(1, 3); s.taste('z' + 0x062F);
  pruefe(ein.value === A + D && ein.selectionStart === 2 && ein.selectionEnd === 2, 'eine Auswahl wird nicht ersetzt');
  s.taste('weg');
  pruefe(ein.value === A && ein.selectionStart === 1, 'Löschen nimmt nicht das Zeichen vor der Schreibmarke');
  ein.value = A + B + TA; ein.setSelectionRange(0, 2); s.taste('weg');
  pruefe(ein.value === TA && ein.selectionStart === 0, 'Löschen nimmt eine Auswahl nicht weg');
  s.taste('weg');
  pruefe(ein.value === TA, 'Löschen am Anfang des Felds verändert den Text');
  ein.setSelectionRange(1, 1); s.taste('leer');
  pruefe(ein.value === TA + ' ' && ein.selectionStart === 2, 'die Leertaste schreibt kein Leerzeichen');
  const vorher = ein.value; s.taste('pruefen');
  pruefe(s.zustand.geprueft === 1 && ein.value === vorher, '„Prüfen" prüft nicht oder verändert den Text');
}

console.log('F  Verdrahtung');
const kasten = HTML.slice(HTML.indexOf('id="cardTippBox"'), HTML.indexOf('id="btnTippUeberspringen"'));
pruefe(kasten.includes('id="cardTippTasten"') && /class="tipp-tasten hidden"/.test(kasten),
  'index.html: der Tastenkasten fehlt im Tippfeld oder ist nicht von Anfang an verborgen');
const feldZeile = HTML.slice(HTML.indexOf('id="cardTippEingabe"'), HTML.indexOf('>', HTML.indexOf('id="cardTippEingabe"')));
pruefe(!feldZeile.includes('inputmode'), 'index.html: das Feld trägt fest ein inputmode — dann ginge am Handy seine Tastatur nicht mehr auf');
pruefe(HTML.includes('.tipp-tasten.hidden{display:none;}'), 'index.html: der verborgene Tastenkasten nimmt trotzdem Platz ein');
pruefe(LERNEN.includes("if (typeof zeigeTippTasten === 'function') zeigeTippTasten();"),
  'js/lernen.js: renderTippfeld() ruft die Tasten nicht mehr auf');
pruefe(LERNEN.includes("tasten.addEventListener('pointerdown', (e)=>{ e.preventDefault(); e.stopPropagation(); });"),
  'js/lernen.js: eine Taste nimmt dem Feld die Schreibmarke oder dreht die Karte um');
pruefe(LERNEN.includes("e.target.closest('#cardTippBox')"), 'js/lernen.js: ein Tippen im Tippfeld dreht die Karte um');

console.log('G  Störtests (der Quelltext wird verändert)');
function stoere(was, alt, neu, bemerkt) {
  const text = LERNEN.split(alt).join(neu);
  if (!pruefe(text !== LERNEN, 'Störtest „' + was + '": die Stelle wurde nicht gefunden — der Störtest prüft nichts')) return;
  let gemerkt;
  try { gemerkt = bemerkt(stand(text)); } catch (e) { gemerkt = true; }
  pruefe(gemerkt, 'Störtest „' + was + '" wird NICHT bemerkt');
}
stoere('Grenze auf 300 Punkte', '>= 600;', '>= 300;', s => !erkennung(s) && !handyUnveraendert(s));
stoere('Berührung nicht mehr gefragt', '(g.maxTouchPoints || 0) > 0 && ', '', s => s.istTablet(PC) === true);
stoere('Tasten auch am Handy sichtbar', "tasten.classList.toggle('hidden', !an);", "tasten.classList.toggle('hidden', false);", s => !handyUnveraendert(s));
stoere('inputmode bleibt am Handy hängen', "else ein.removeAttribute('inputmode');", '', s => !zurueckAmHandy(s));
stoere('Tablet ohne inputmode', " ein.setAttribute('inputmode', 'none');", '', s => !tabletHatTasten(s));
stoere('Tasten immer an', 'const an = istTablet();', 'const an = true;', s => !handyUnveraendert(s));

console.log('\ntest-tippen-tablet: ' + geprueft + ' Prüfungen, ' + fehler + ' Fehler');
process.exit(fehler ? 1 : 0);
