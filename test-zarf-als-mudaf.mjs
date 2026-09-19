/* test-zarf-als-mudaf.mjs — bewacht Elias' Entscheidung vom 19.09.2026 zur
 * Übung „Tippe alle مُضَافٌ an" (Satz mb1-42-3, Madina Buch 1, S. 42):
 *
 *   03:16:54  „sollten diese zwei als antowrt nicht eigentlich auch richtig sein?"
 *   03:46:10  „die beiden sind wie mudaf, wenn das der fall ist dann ist das ja auch grundsätzlich richtig"
 *   03:47:24  „lass die zwei dann gelten und auch andere ähnliche ortangaben oder zeitangeben"
 *   03:48:30  „aber nur wenn zeitangeben auch wirklich wie mudaf sind"
 *
 * → Jede Orts- und Zeitangabe mit einem Genitiv dahinter zählt als مُضَافٌ,
 *   das Wort dahinter als مُضَافٌ إِلَيْهِ. Mit angehängtem Pronomen (عِنْدِي)
 *   nicht — dahinter steht kein Genitiv.
 * → „Warum?" zeigt dann seine Karte „Ortsangabe als مُضَافٌ", auch bei
 *   „Welcher Fall?" am Wort hinter der Ortsangabe (vorher: Genitivpartikel).
 *
 *   node test-zarf-als-mudaf.mjs              prüfen
 *   node test-zarf-als-mudaf.mjs --stoertest  beweisen, dass er rot werden kann
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STOERTEST = process.argv.includes('--stoertest');

const UEBUNG = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8');
const IRAB_TEXT = fs.readFileSync(path.join(WURZEL, 'js', 'irab.js'), 'utf8');
const irab = require('./js/irab.js');
const lade = (datei, name) =>
  (new Function(fs.readFileSync(path.join(WURZEL, datei), 'utf8') + ';return ' + name + ';'))();
const VOCAB_DATA = lade('vocab-data.js', 'VOCAB_DATA');
const LEHRBUCH_SAETZE = lade('lehrbuch-saetze.js', 'LEHRBUCH_SAETZE');
let BEISPIELSAETZE = {};
try { BEISPIELSAETZE = lade('data/beispielsaetze.js', 'BEISPIELSAETZE'); } catch (e) { /* optional */ }
const { GRAMMAR_RULES } = new Function(fs.readFileSync(path.join(WURZEL, 'grammar-data.js'), 'utf8') + ';return {GRAMMAR_RULES};')();
let F19 = [];
try { F19 = lade('regelsammlung-data.js', 'FOLGE19_KARTEN'); } catch (e) { /* dann fehlt f19-* unten */ }
const BEKANNT = new Set([...GRAMMAR_RULES.map(r => r.id), ...F19.map(k => k.id)]);

irab.setzeLexikon(VOCAB_DATA);
const SAETZE = [
  ...VOCAB_DATA.filter(w => w.sentAr),
  ...LEHRBUCH_SAETZE,
  ...Object.keys(BEISPIELSAETZE)
    .filter(id => id.startsWith('satz-lang-') && BEISPIELSAETZE[id] && BEISPIELSAETZE[id].sentAr)
    .map(id => ({ id, sentAr: BEISPIELSAETZE[id].sentAr }))
];
const ANALYSEN = SAETZE.map(s => ({ s, z: irab.analysiereSatz(s.sentAr) }));
const nackt = w => String(w || '').replace(/[ً-ْٰ]/g, '').replace(/[.،؟!«»:؛]/g, '');

function schneideFunktion(text, name){
  const a = text.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let i = text.indexOf('{', a), t = 0;
  for (; i < text.length; i++){
    if (text[i] === '{') t++;
    else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); }
  }
  return null;
}
const schneideBis = (text, kopf, ende) => {
  const a = text.indexOf(kopf);
  if (a < 0) return null;
  const e = text.indexOf(ende, a);
  return e < 0 ? null : text.slice(a, e + ende.length);
};

function laufe(quelle, still){
  let schlecht = 0;
  const pruefe = (was, ok, gemessen) => {
    if (ok){ if (!still) console.log('  ✔ ' + was); }
    else { schlecht++; if (!still) console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
  };
  const log = s => { if (!still) console.log(s); };

  log('\n1. Seine Sätze stehen an der Stelle, die sie umsetzt');
  for (const satz of [
    '„die beiden sind wie mudaf, wenn das der fall ist dann ist das ja auch grundsätzlich richtig"',
    '„lass die zwei dann gelten und auch andere ähnliche ortangaben oder zeitangeben"',
    '„aber nur wenn zeitangeben auch wirklich wie mudaf sind"'
  ]) pruefe('js/uebung.js zitiert ' + satz.slice(0, 40) + '…', quelle.includes(satz), 'fehlt oder verändert');
  const zuruf = (IRAB_TEXT.match(/const ZURUF = \[([^\]]*)\]/) || [, ''])[1];
  pruefe('die Liste ZURUF (js/irab.js) enthält Zeitangaben: بعد, قبل, عند',
    ['بعد', 'قبل', 'عند'].every(w => zuruf.includes("'" + w + "'")), zuruf);
  pruefe('seine Karte „Ortsangabe als مُضَافٌ" gibt es (Ziel von „Warum?")', BEKANNT.has('zarf-als-mudaf-01'), 'fehlt');

  const teile = [
    schneideFunktion(quelle, 'uebungSammel'),
    schneideFunktion(quelle, 'uebungZarfMitGenitiv'),
    schneideBis(quelle, 'const UEBUNG_WARUM_UNSICHTBAR =', ';'),
    schneideFunktion(quelle, 'uebungUnsichtbarerFall'),
    schneideBis(quelle, 'const UEBUNG_WARUM = {', '};'),
    schneideFunktion(quelle, 'warumNachRolle'),
    schneideFunktion(quelle, 'uebungWarum'),
    schneideBis(quelle, 'const UEBUNGEN = [', '\n];')
  ];
  pruefe('alle Bausteine sind in js/uebung.js zu finden', teile.every(Boolean),
    teile.map((t, i) => t ? null : i).filter(i => i !== null).join(','));
  if (!teile.every(Boolean)) return schlecht;
  const c = { console, endungUnsichtbar: irab.endungUnsichtbar,
    regelArt: id => BEKANNT.has(id) ? 'regel' : null, regelText: id => ({ name: id }) };
  vm.createContext(c);
  try {
    vm.runInContext(teile.join('\n') + '\n;globalThis.__U = UEBUNGEN; globalThis.__W = uebungWarum; globalThis.__Z = uebungZarfMitGenitiv;', c);
  } catch (e){ pruefe('die Übungen lassen sich laden', false, e.message); return schlecht; }
  const idafa = c.__U.find(m => m.id === 'idafa');
  const kasus = c.__U.find(m => m.id === 'kasus');
  pruefe('die Iḍāfa-Übung gibt es', !!idafa, '—');
  if (!idafa) return schlecht;
  const bau = (m, z, s) => { try { return m.baue(z, s) || []; } catch (e){ return ['FEHLER ' + e.message]; } };

  log('\n2. Der Satz von seinem Bildschirmfoto (mb1-42-3)');
  const foto = ANALYSEN.find(x => x.s.id === 'mb1-42-3');
  pruefe('der Satz steht im Bestand', !!foto, 'fehlt');
  if (foto){
    const [a, b] = bau(idafa, foto.z, foto.s);
    const woerter = t => (t && t.ziele || []).map(i => nackt(foto.z[i].wort));
    pruefe('„Tippe alle مُضَافٌ an": بيت · أمام · وبيت · خلف', JSON.stringify(woerter(a)) === JSON.stringify(['بيت', 'أمام', 'وبيت', 'خلف']), woerter(a).join(' · '));
    pruefe('„Tippe alle مُضَافٌ إِلَيْهِ an": التاجر · المسجد · الطبيب · المدرسة', JSON.stringify(woerter(b)) === JSON.stringify(['التاجر', 'المسجد', 'الطبيب', 'المدرسة']), woerter(b).join(' · '));
    pruefe('beide Aufgaben erklären mit seiner Karte „Ortsangabe als مُضَافٌ"', !!a && !!b && a.warum === 'zarf-als-mudaf-01' && b.warum === 'zarf-als-mudaf-01', (a && a.warum) + ' / ' + (b && b.warum));
    const iM = foto.z.findIndex(t => nackt(t.wort) === 'المسجد');
    const w = kasus ? c.__W({ modus: kasus, zeilen: foto.z, wortIdx: iM }) : null;
    pruefe('„Warum?" bei „Welcher Fall?" an الْمَسْجِدِ zeigt dieselbe Karte, nicht die Genitivpartikel', !!w && w.id === 'zarf-als-mudaf-01', w ? w.id : 'null');
  }

  log('\n3. Jede Orts- und Zeitangabe im Bestand');
  let stellen = 0, verfehlt = [], mitPronomen = 0, pronomenGezaehlt = [], ohneKarte = 0, falscheKarte = 0, jarrKarte = null;
  for (const { s, z } of ANALYSEN){
    const liste = bau(idafa, z, s);
    const [a, b] = liste;
    let hatPaar = false;
    z.forEach((t, i) => {
      const istZarf = String(t.rolle || '').startsWith('ظَرْف');
      if (c.__Z(z, i)){
        stellen++; hatPaar = true;
        if (!a || !a.ziele.includes(i) || !b || !b.ziele.includes(i + 1)) verfehlt.push(s.id + ' ' + t.wort);
      } else if (istZarf && /(ي|ك|ه|ها|نا|كم|هم)$/.test(nackt(t.wort))){
        mitPronomen++;
        if (a && a.ziele && a.ziele.includes(i)) pronomenGezaehlt.push(s.id + ' ' + t.wort);
      }
      /* Gegenstück: nach einer echten Genitivpartikel bleibt „Warum?" bei ihr. */
      if (!jarrKarte && kasus && t.rolle === 'حَرْف جَرّ' && z[i + 1] && z[i + 1].erwartet === 'jarr')
        jarrKarte = c.__W({ modus: kasus, zeilen: z, wortIdx: i + 1 });
    });
    for (const x of liste){
      if (hatPaar && x.warum !== 'zarf-als-mudaf-01') ohneKarte++;
      if (!hatPaar && x.warum) falscheKarte++;
    }
  }
  log('     gemessen: ' + stellen + ' Orts-/Zeitangaben vor einem Genitiv, ' + mitPronomen + ' mit angehängtem Pronomen');
  pruefe('es gibt solche Stellen (sonst prüft das hier nichts)', stellen >= 10, stellen);
  pruefe('jede zählt als مُضَافٌ, das Wort dahinter als مُضَافٌ إِلَيْهِ', verfehlt.length === 0, verfehlt.slice(0, 3).join(' · '));
  pruefe('mit angehängtem Pronomen (عِنْدِي) zählt keine', pronomenGezaehlt.length === 0, pronomenGezaehlt.join(' · '));
  pruefe('jede Aufgabe mit so einer Stelle erklärt mit seiner Karte', ohneKarte === 0, ohneKarte);
  pruefe('Aufgaben ohne so eine Stelle behalten die allgemeine Iḍāfa-Karte', falscheKarte === 0, falscheKarte);
  pruefe('nach einer echten Genitivpartikel zeigt „Warum?" weiter deren Karte (f19-jarr)', !!jarrKarte && jarrKarte.id === 'f19-jarr', jarrKarte ? jarrKarte.id : 'kein Fall gefunden');
  return schlecht;
}

if (STOERTEST){
  console.log('Störtest: jede Gegenprobe muss rot werden.\n');
  let alleRot = true;
  for (const [was, q] of [
    ['die Hilfsfunktion erkennt nichts mehr', UEBUNG.replace(/function uebungZarfMitGenitiv\(z, i\)\{/, 'function uebungZarfMitGenitiv(z, i){ return false;')],
    ['die Übung fragt die Hilfsfunktion nicht mehr', UEBUNG.replace('if (uebungZarfMitGenitiv(z, i)){', 'if (false){')],
    ['die Karte wird nicht mehr mitgegeben', UEBUNG.replace(".map(a => mitZarf ? { ...a, warum: 'zarf-als-mudaf-01' } : a)", '')],
    ['„Welcher Fall?" zeigt wieder die Genitivpartikel', UEBUNG.replace("if (uebungZarfMitGenitiv(a.zeilen, a.wortIdx - 1) && regelArt('zarf-als-mudaf-01')) id = 'zarf-als-mudaf-01';", '')],
    ['sein Satz ist „verbessert"', UEBUNG.replace('ortangaben oder zeitangeben', 'Ortsangaben oder Zeitangaben')]
  ]){
    const geaendert = q !== UEBUNG;
    const rot = geaendert && laufe(q, true) > 0;
    if (!rot) alleRot = false;
    console.log((rot ? '  ✔ rot: ' : '  ✘ GRÜN: ') + was + (geaendert ? '' : '  (Ersetzung griff nicht)'));
  }
  const echt = laufe(UEBUNG, true);
  console.log('\n  und die echte Datei: ' + (echt === 0 ? 'grün ✔' : echt + ' Befund(e) ✘'));
  process.exit(alleRot && echt === 0 ? 0 : 1);
}
const schlecht = laufe(UEBUNG, false);
console.log('\n' + (schlecht ? '✘ ' + schlecht + ' Prüfung(en) rot' : '✔ alle grün'));
process.exit(schlecht ? 1 : 0);
