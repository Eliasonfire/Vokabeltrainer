/* koran-stellen-lib.mjs — gemeinsamer Zugriff auf Verse seines auswendigen Bereichs und den Wortlaut seiner Duas.
   Wortzählung: 1-basiert, gezählt werden nur Stücke mit arabischem Buchstaben (wie in anker30.mjs).
   REPO = der Ordner über werkzeuge/ — der Ort dieser Datei zählt, nicht der aktuelle Ordner (seit 13.10.2026; im
   Zwischenordner war es process.cwd()). ARBEIT = wohin die Werkzeuge schreiben: lokal und nicht im Repo, denn dort
   stehen aufgelöste Wörter seiner Buchkarten. VORLAGEN = die Vorlagen mit Verweisen (im Repo, ohne ein arabisches
   Zeichen — bewacht von werkzeuge/pruefe-koran-vorlagen.mjs). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARBEIT = path.join(REPO, 'data-ersatz', 'arbeit', 'koran-zwischenordner');
export const VORLAGEN = path.join(REPO, 'werkzeuge', 'koran-vorlagen');
const require = createRequire(path.join(REPO, 'x.js'));
export const lade = (datei, name) => new Function(fs.readFileSync(path.join(REPO, datei), 'utf8') + '\nreturn (typeof ' + name + ' !== "undefined") ? ' + name + ' : null;')();
export const Z = n => String.fromCodePoint(n);
const kl = (...b) => '[' + b.map(x => Array.isArray(x) ? Z(x[0]) + '-' + Z(x[1]) : Z(x)).join('') + ']';
const BUCHSTABE = new RegExp(kl([0x0621, 0x064A], [0x0671, 0x06D3]));
export const woerterVon = text => String(text).split(/\s+/).filter(w => BUCHSTABE.test(w));
let _q = null, _a = null;
export const quran = () => _q || (_q = lade('quran-text.js', 'QURAN_TEXT'));
export const bereich = () => { if (!_a){ const { auswendigLesen } = require('./werkzeuge/auswendig.js'); _a = auswendigLesen(REPO); } return _a; };
export const { kannStelle, umfang } = require('./werkzeuge/auswendig.js');
/* Liefert { w: [Wörter], de, art } für "S:V" oder "D<nr>.<text>" — oder wirft. */
export function stelle(wo){
  let m = /^(\d+):(\d+)$/.exec(wo);
  if (m){
    const s = Number(m[1]), v = Number(m[2]);
    const e = (quran()[s] || [])[v - 1];
    if (!e) throw new Error('Vers ' + wo + ' nicht gefunden');
    return { w: woerterVon(e[0]), de: e[1], art: 'vers', sure: s, vers: v };
  }
  m = /^D(\d+)\.(\d+)$/.exec(wo);
  if (m){
    const d = (bereich().duas || []).find(x => Number(x.nr) === Number(m[1]));
    if (!d) throw new Error('Dua ' + m[1] + ' nicht gefunden');
    const t = (d.texte || [])[Number(m[2]) - 1];
    if (!t) throw new Error('Dua ' + m[1] + ' hat keinen Text ' + m[2]);
    return { w: woerterVon(t.arabisch), de: d.titel, art: 'dua', dua: d, text: t };
  }
  throw new Error('Stelle nicht lesbar: ' + wo);
}
/* Koran-Lesezeichen (Pausen, Sajda, Rub) aus einem Zitat nehmen; die Schreibzeichen des Wortes bleiben.
   Tanwin-Fatha mit abgesetztem Alif (so steht es in quran-text.js) wird zusammengezogen. */
const PAUSE = new RegExp(kl([0x06D6, 0x06DC], 0x06DD, 0x06DE, 0x06E9, 0x200F, 0x200E), 'g');
const TANWIN_LUECKE = new RegExp(Z(0x064B) + ' ' + Z(0x0627), 'g');
export function zitat(wo, von, bis){
  const st = stelle(wo);
  if (!(von >= 1 && bis >= von && bis <= st.w.length)) throw new Error('Bereich ' + von + '-' + bis + ' passt nicht zu ' + wo + ' (' + st.w.length + ' Wörter)');
  return st.w.slice(von - 1, bis).join(' ').replace(PAUSE, '').replace(TANWIN_LUECKE, Z(0x064B) + Z(0x0627)).replace(/\s+/g, ' ').trim();
}
