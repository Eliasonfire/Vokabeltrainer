/* pruefe-spieler-leiste.mjs — die Leiste des Rezitators im Koran-Leser.
 *
 * Bewacht zwei Sätze von Elias vom 20.09.2026:
 *
 *  1. Mit Bild, das ✕ rot umrandet: „wenn ich das drücke will ich das
 *     rezitator komplett aus ist, auch in den einstellungen des korans".
 *     Vorher beendete das ✕ nur den laufenden Ton (audioAus), die Leiste blieb
 *     stehen, der Schalter in den Koran-Einstellungen stand weiter auf „An" —
 *     und solange nichts lief, war das ✕ gesperrt.
 *
 *  2. „wenn ich in die mitte davon tippe also wo der name des rezitators steht
 *     dann komme ich zu dem feld wo ich eine zahl eintippen kann … das soll
 *     nicht so sein". Die Mitte ist nur noch Anzeige.
 *
 * ⛔ quranRezitationSetzen() wird aus js/quran-audio.js HERAUSGESCHNITTEN und
 *    gefahren, nicht nachgebaut. [[testvorlage_selbst_nachgebaut]]
 * ⛔ Verbote werden im KOMMENTARFREIEN Text gesucht — die Kommentare zitieren
 *    genau das, was verboten ist. [[funktion_als_referenz_sieht_tot_aus]]
 * ⭐ Zwei Störtests am Ende.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const lies = (rel) => fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const audio = lies('../js/quran-audio.js');
const html  = lies('../index.html');
const ohneKommentare = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const audioNackt = ohneKommentare(audio);
const htmlNackt  = html.replace(/<!--[\s\S]*?-->/g, ' ');

let fehler = 0;
const pruefe = (was, erwartet, ist) => {
  const ok = JSON.stringify(erwartet) === JSON.stringify(ist);
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok ' : 'X  ') + was.padEnd(62)
    + (ok ? '' : 'erwartet ' + JSON.stringify(erwartet) + ', ist ' + JSON.stringify(ist)));
};

/* ------------------- Die echten Funktionen herausschneiden ---------------- */
const mSetzen = audio.match(/\nfunction quranRezitationSetzen\([^)]*\)\{[\s\S]*?\n\}\n/);
const mAn     = audio.match(/\nfunction quranRezitationAn\(\)\{[^\n]*\}\n/);
if (!mSetzen || !mAn){
  console.log('X  quranRezitationSetzen() oder quranRezitationAn() nicht gefunden');
  process.exit(1);
}

function fahre(quelleSetzen, startwert, wert){
  const zaehler = { speichern: 0, audioAus: 0, ansicht: 0 };
  const ctx = {
    SETTINGS: { quranRezitation: startwert },
    saveSettings: () => { zaehler.speichern++; },
    audioAus: () => { zaehler.audioAus++; },
    wendeQuranAnsichtAn: () => { zaehler.ansicht++; },
    zeigeSpieler: () => {},
  };
  vm.createContext(ctx);
  vm.runInContext(mAn[0] + quelleSetzen, ctx);
  vm.runInContext('quranRezitationSetzen(' + JSON.stringify(wert) + ')', ctx);
  return { wert: ctx.SETTINGS.quranRezitation, zaehler };
}

/* ====================== 1. Das ✕ schaltet GANZ aus ======================== */
console.log('1. Das ✕ schaltet den Rezitator ganz aus:');
{
  const aus = fahre(mSetzen[0], 'an', 'aus');
  pruefe('die Einstellung steht danach auf „aus"', 'aus', aus.wert);
  pruefe('… und wird gespeichert', 1, aus.zaehler.speichern);
  pruefe('… der Ton wird beendet', 1, aus.zaehler.audioAus);
  pruefe('… der Schalter in den Koran-Einstellungen wird nachgezogen', 1, aus.zaehler.ansicht);

  const an = fahre(mSetzen[0], 'aus', 'an');
  pruefe('„an" stellt an', 'an', an.wert);
  pruefe('… und beendet KEINEN Ton', 0, an.zaehler.audioAus);
  pruefe('ein unbekannter Wert heißt „aus", nicht „an"', 'aus', fahre(mSetzen[0], 'an', 'vielleicht').wert);

  pruefe('das ✕ ruft quranRezitationSetzen(\'aus\')', true,
    /an\('btnQsAus',[\s\S]{0,80}quranRezitationSetzen\('aus'\)/.test(audioNackt));
  pruefe('… und NICHT mehr nur audioAus', false, /an\('btnQsAus',\s*audioAus\)/.test(audioNackt));
  pruefe('der Schalter in den Einstellungen geht denselben Weg', true,
    /closest\('\[data-quranrezitation\]'\)[\s\S]{0,120}quranRezitationSetzen\(k\.dataset\.quranrezitation\)/.test(audioNackt));
  pruefe('das ✕ wird nie gesperrt (nicht in der disabled-Liste)', false,
    /\[[^\]]*'btnQsAus'[^\]]*\]\.forEach/.test(audioNackt));
  const knopf = htmlNackt.match(/<button[^>]*id="btnQsAus"[^>]*>/);
  pruefe('das ✕ steht im Markup', true, !!knopf);
  pruefe('… ohne `disabled`', false, !!knopf && /\sdisabled/.test(knopf[0]));
}

/* ====================== 2. Die Mitte ist nur Anzeige ====================== */
console.log('2. Die Mitte der Leiste ist kein Knopf mehr:');
{
  const mitte = htmlNackt.match(/<(\w+)[^>]*id="qsStandKnopf"[^>]*>/);
  pruefe('die Mitte steht im Markup', true, !!mitte);
  pruefe('… als <div>, nicht als <button>', 'div', mitte ? mitte[1] : null);
  pruefe('kein Klick-Horcher mehr auf der Mitte', false,
    /kStand\.addEventListener\('click'|getElementById\('qsStandKnopf'\)\.addEventListener/.test(audioNackt));
  pruefe('der Stand und der Name stehen weiter darin', true,
    /id="qsStandKnopf"[\s\S]{0,200}id="qsStand"[\s\S]{0,120}id="qsName"/.test(htmlNackt));
}

/* ================= 3. Zeile offen = Schleife an ========================== */
/* Elias 20.09.2026, 02:41, mit Bild (Zeile offen, „von 1 bis 5", Knopf „Aus"):
   „wenn ich das aktiviert habe soll automatisch ein loop sein also ich will
   nicht noch extra einschalten das ein loop kommt. wenn ich die funktion
   nutze dann brauche ich nur einen loop, es kommt nicht vor das ich es dann
   nur einmal spielen lassen möchte". */
const schneide = (name) => {
  const m = audio.match(new RegExp('\\nfunction ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n'));
  if (!m){ console.log('X  ' + name + '() nicht gefunden'); process.exit(1); }
  return m[0];
};
const SCHLEIFE_TEILE = { setzen: schneide('schleifeSetzen'), lesen: schneide('schleifeLesen'), anzeigen: schneide('schleifeAnzeigen') };
const mKonstSchleife = audio.match(/\nconst QSCHLEIFE = \{[^\n]*\n/);

function elementDoppel(){
  const klassen = new Set(); const attr = {};
  return {
    value: '',
    classList: {
      toggle(n, f){ const an = f === undefined ? !klassen.has(n) : !!f; if (an) klassen.add(n); else klassen.delete(n); return an; },
      add(n){ klassen.add(n); }, remove(n){ klassen.delete(n); }, contains(n){ return klassen.has(n); },
    },
    setAttribute(n, v){ attr[n] = v; }, getAttribute(n){ return attr[n]; },
  };
}
function schleifenUmgebung(teile, vers){
  const els = { qsSchleife: elementDoppel(), qsVon: elementDoppel(), qsBis: elementDoppel(), btnQsSchleife: elementDoppel() };
  els.qsSchleife.classList.add('hidden');
  const ctx = {
    document: { getElementById: (id) => els[id] || null },
    QAUDIO: { sure: 67, vers: vers },
    OFFENE_SURE: 67,
    audioVersZahl: () => 30,
  };
  vm.createContext(ctx);
  vm.runInContext(mKonstSchleife[0] + teile.lesen + teile.anzeigen + teile.setzen
    + '\nthis.API = { QSCHLEIFE, schleifeSetzen };', ctx);
  return { api: ctx.API, els };
}

console.log('3. Wiederholen: Zeile offen = Schleife an:');
{
  const u = schleifenUmgebung(SCHLEIFE_TEILE, 7);
  u.api.schleifeSetzen(true);
  pruefe('ein Druck schaltet die Schleife AN', true, u.api.QSCHLEIFE.an);
  pruefe('… öffnet die Zeile', false, u.els.qsSchleife.classList.contains('hidden'));
  pruefe('… füllt „von" und „bis" mit dem laufenden Vers', ['7', '7'], [u.els.qsVon.value, u.els.qsBis.value]);
  pruefe('… und der Bereich gilt sofort', [7, 7, 67], [u.api.QSCHLEIFE.von, u.api.QSCHLEIFE.bis, u.api.QSCHLEIFE.sure]);
  pruefe('… das Zeichen in der Leiste leuchtet', true, u.els.btnQsSchleife.classList.contains('an'));
  u.api.schleifeSetzen(false);
  pruefe('der nächste Druck schaltet AUS', false, u.api.QSCHLEIFE.an);
  pruefe('… und schließt die Zeile', true, u.els.qsSchleife.classList.contains('hidden'));
  pruefe('… das Zeichen leuchtet nicht mehr', false, u.els.btnQsSchleife.classList.contains('an'));

  /* Sein Bild: er hatte 1 bis 5 eingetragen. Schon Eingetragenes bleibt. */
  const v = schleifenUmgebung(SCHLEIFE_TEILE, 7);
  v.els.qsVon.value = '1'; v.els.qsBis.value = '5';
  v.api.schleifeSetzen(true);
  pruefe('eingetragene Zahlen bleiben und gelten („von 1 bis 5")', [1, 5], [v.api.QSCHLEIFE.von, v.api.QSCHLEIFE.bis]);

  pruefe('den Knopf „An/Aus" gibt es nicht mehr — im Markup', false, /btnQsSchleifeAn/.test(htmlNackt));
  pruefe('… und im Code', false, /btnQsSchleifeAn/.test(audioNackt));
  pruefe('das Zeichen in der Leiste ist der eine Schalter', true,
    /knAuf\.addEventListener\('click',\s*\(\)\s*=>\s*schleifeSetzen\(!QSCHLEIFE\.an\)\)/.test(audioNackt));
  pruefe('verschwindet die Leiste, geht die Schleife mit aus', true,
    /if \(!sichtbar\) schleifeSetzen\(false\);/.test(audioNackt));
}

/* ============ 4. Im Listenmodus keine Zeile „Übersetzung" ================= */
/* Elias 20.09.2026, 02:43, mit Bild: „außerdem will ich beim listenmodus gar
   nciht die option sehen von übersetzung weil sie sowieso nciht da ist in
   liste." */
console.log('4. Koran-Einstellungen: im Listenmodus keine Zeile „Übersetzung":');
{
  const quranNackt = ohneKommentare(lies('../js/quran.js'));
  /* Elias 20.09.2026, 03:19, mit Bild (beide Hinweise rot umrandet): „die zwei
     texte können weg". */
  pruefe('der Hinweis „Im Listenmodus läuft nur …" ist weg', false, /id="qaHinweisListe"|Im Listenmodus läuft nur/.test(htmlNackt));
  pruefe('der Hinweis „Diese Ansicht gilt nur auf diesem Gerät …" ist weg', false, /id="qaHinweisGeraet"|Diese Ansicht gilt nur/.test(htmlNackt));
  pruefe('… und niemand greift mehr nach dem entfernten Element', false, /getElementById\('qaHinweis(Liste|Geraet)'\)/.test(quranNackt));
  pruefe('die Zeile hat eine Kennung im Markup', true, /id="qaZeileUeb"/.test(htmlNackt));
  pruefe('… und verschwindet, wenn die Darstellung „Liste" ist', true,
    /const nurListe = a\.darstellung === 'liste';[\s\S]{0,900}zeileUeb\.classList\.toggle\('hidden', nurListe\)/.test(quranNackt));
}

/* ============================ 5. Störtests ================================ */
console.log('Störtests (jede zurückgedrehte Fassung muss auffallen):');
{
  /* c) die alte Trennung: die Zeile geht auf, aber die Schleife bleibt aus —
        genau der Zustand auf seinem Bild. */
  const nurAuf = SCHLEIFE_TEILE.setzen.replace(/QSCHLEIFE\.an = !!an;/, 'const offen = !!an;')
    .replace(/classList\.toggle\('hidden', !QSCHLEIFE\.an\)/, "classList.toggle('hidden', !offen)")
    .replace(/if \(QSCHLEIFE\.an\)\{/, 'if (offen){');
  pruefe('c) die Störfassung unterscheidet sich vom Original', true, nurAuf !== SCHLEIFE_TEILE.setzen);
  const c = schleifenUmgebung(Object.assign({}, SCHLEIFE_TEILE, { setzen: nurAuf }), 7);
  c.api.schleifeSetzen(true);
  pruefe('c) Zeile offen, Schleife aus — das fällt auf', [false, false],
    [c.els.qsSchleife.classList.contains('hidden'), c.api.QSCHLEIFE.an]);

  const ohneSpeichern = mSetzen[0].replace(/\n\s*saveSettings\(\);/, '');
  pruefe('a) die Störfassung unterscheidet sich vom Original', true, ohneSpeichern !== mSetzen[0]);
  pruefe('a) ohne saveSettings() fällt das fehlende Speichern auf', 0, fahre(ohneSpeichern, 'an', 'aus').zaehler.speichern);

  const nurTon = audioNackt.replace(/an\('btnQsAus',[\s\S]*?\n  \}\);/, "an('btnQsAus',     audioAus);");
  pruefe('b) die Störfassung unterscheidet sich vom Original', true, nurTon !== audioNackt);
  pruefe('b) die alte Verdrahtung (nur audioAus) fällt auf', true,
    /an\('btnQsAus',\s*audioAus\)/.test(nurTon) && !/an\('btnQsAus',[\s\S]{0,80}quranRezitationSetzen\('aus'\)/.test(nurTon));
}

console.log(fehler === 0
  ? '\nAlles gruen: das ✕ schaltet ganz aus, die Mitte ist nur Anzeige, Zeile offen = Schleife an, und im Listenmodus fehlt die Zeile „Übersetzung".'
  : '\n' + fehler + ' Probe(n) rot.');
process.exit(fehler === 0 ? 0 : 1);
