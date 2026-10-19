/* korantext-lib.mjs — der Korantext von quran.com und was jedes Werkzeug davon braucht (19.10.2026)
 * ===================================================================================
 *
 * Elias, 19.10.2026: „ja hört sich gut an" (Sukun und Tanwīn im Leser wie bei quran.com),
 * „ja, wenn das der gleiche text von quran.com ist" und, nachdem gemessen war, dass die
 * heruntergeladene Datei NICHT derselbe Text ist: „stelle sicher das sie gleich sind damit
 * keine fehler da sind".
 *
 * Seitdem ist quran-text.js der Text von quran.com, Zeichen für Zeichen: das Feld
 * `text_qpc_hafs` von api.quran.com, ohne die Versnummer am Ende. Gebaut und geprüft von
 * werkzeuge/korantext-bauen.mjs, bewacht von test-korantext.mjs.
 *
 * ⛔⛔ DIE KODIERUNG GEHÖRT ZUR SCHRIFT. quran.com schreibt das versetzte Tanwīn mit
 * U+0657 / U+065E / U+0656 und das Sukun des Muṣḥaf mit U+06E1. Im Unicode-Standard
 * heißen U+0657 „umgekehrte Ḍamma" und U+0656 „Alif darunter" — richtig gezeichnet werden
 * sie NUR von der Muṣḥaf-Schrift des Lesers (fonts/kfgqpc-hafs-18.woff2, „KFGQPC HAFS
 * Uthmanic Script", Version 0.18). Gemessen am 19.10.2026 in ihrer Zeichentabelle: sie hat
 * U+0657, U+065E, U+0656 und U+06E1, aber KEIN U+08F0–U+08F2 (die Kodierung der
 * heruntergeladenen Datei). Amiri, die Schrift der Karten, zeichnet U+0657 als umgekehrte
 * Ḍamma — also falsch.
 *
 * Deshalb zwei Wege, und jeder Leser muss wissen, welchen er geht:
 *   · der Leser (js/quran.js) zeigt quran-text.js UNVERÄNDERT in der Muṣḥaf-Schrift;
 *   · alles andere — Zitate auf Karten, Suchen, Vergleiche — nimmt zuStandard():
 *     die vier Zeichen zurück in den Standard (wie quran-text.js bis v691 aussah) und
 *     danach NFD. NFD zerlegt die Hamza-Buchstaben (أ → ا + ٔ) und sortiert die Zeichen
 *     über einem Buchstaben; beides war im alten Text so. Gemessen am 19.10.2026: danach
 *     gleichen 3114 von 6236 Versen dem alten Text; der Rest unterscheidet sich nur in
 *     dem, was die heruntergeladene Datei falsch hatte (abgetrennte Alif, U+200F,
 *     Tatwīl) — siehe den Block „19.10.2026" in der Projektnotiz.
 *     ⛔ Erst tauschen, dann NFD: U+0657 und U+06E1 tragen die Klasse 230, die
 *     Standardzeichen 27–34. Andersherum bliebe ihre Reihenfolge falsch (gemessen: 437
 *     Verse mit Sukun hinter der Hamza).
 *
 * ⛔ Arabische Zeichen stehen hier nur als Codepunkte. Nichts ist getippt.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const Z = (...c) => String.fromCodePoint(...c);

/** Woher der Text kommt — ein Abruf je Sure. */
export const QUELLE_URL = s => `https://api.quran.com/api/v4/quran/verses/qpc_hafs?chapter_number=${s}`;
export const QUELLE_FELD = 'text_qpc_hafs';

/* Die Versnummer am Ende des Feldes: Leerzeichen oder U+00A0, dann arabisch-indische
   Ziffern (gemessen: „ … قَدِيرٌ ١" in der Kapitel-Abfrage, U+00A0 vor der Ziffer in der
   Abfrage verses/by_chapter). */
const VERSNUMMER = new RegExp('[ ' + Z(0xA0) + ']*[' + Z(0x660) + '-' + Z(0x669) + ']+$');
export const ohneVersnummer = t => String(t).replace(VERSNUMMER, '');

/* Die vier Zeichen der Muṣḥaf-Kodierung und ihr Gegenstück im Standard. U+00A0 steht bei
   quran.com nur zwischen dem Hizb-Zeichen und dem Wort (199×) und wird zum Leerzeichen. */
const STANDARD = new Map([[0x657, 0x64B], [0x65E, 0x64C], [0x656, 0x64D], [0x6E1, 0x652], [0xA0, 0x20]]);

/* ⛔ Eine einzige Schreibung dient nur der Muṣḥaf-Schrift: quran.com setzt in kallā (33×) ein Tatwīl
   zwischen Kāf und Fatḥa (U+0643 U+0640 U+064E U+0644). Eine andere Schrift zieht dort die Linie
   lang; der alte Text (dieselbe Quelle, andere Ausgabe) schrieb kallā ohne. Gemessen am 19.10.2026
   nach NFD: neu 568 Tatwīl, alt 535 — und ohne die 33 in kallā trägt jeder der 6236 Verse gleich
   viele wie vorher. */
const KALLA_MIT = Z(0x643, 0x640, 0x64E, 0x644), KALLA_OHNE = Z(0x643, 0x64E, 0x644);

/** Der Text in der Kodierung des Unicode-Standards, für jede Schrift außer der des Lesers
 *  und für jeden Vergleich. Siehe Kopf: erst tauschen, dann NFD. */
export function zuStandard(t){
  return [...String(t)].map(c => { const k = STANDARD.get(c.codePointAt(0)); return k ? Z(k) : c; })
    .join('').normalize('NFD').split(KALLA_MIT).join(KALLA_OHNE);
}

/** SHA-256 je Sure über die arabischen Verse (mit Zeilenumbruch verbunden) und über alles. */
export function fingerabdruck(koran){
  const suren = {};
  const gesamt = crypto.createHash('sha256');
  for (let s = 1; s <= 114; s++){
    const text = (koran[s] || []).map(v => Array.isArray(v) ? v[0] : v).join('\n');
    suren[s] = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    gesamt.update(suren[s]);
  }
  return { suren, gesamt: gesamt.digest('hex') };
}

/** Lädt QURAN_TEXT aus quran-text.js (oder einer anderen Datei gleichen Baus). */
export function ladeKoran(datei = path.join(REPO, 'quran-text.js')){
  return new Function(fs.readFileSync(datei, 'utf8') + '\n;return QURAN_TEXT;')();
}

/* ---------------------------------------------------------------------------------
   Welche Zeichen kennt eine Schrift? Liest die Zeichentabelle (cmap) einer WOFF2-Datei.
   Gebraucht von test-korantext.mjs: jedes Zeichen des Korantextes muss in der Schrift
   des Lesers stehen, sonst zeichnet der Browser es mit einer anderen Schrift — sichtbar
   anders als bei quran.com, ohne jede Fehlermeldung.
   --------------------------------------------------------------------------------- */
const WOFF2_TAGS = ['cmap','head','hhea','hmtx','maxp','name','OS/2','post','cvt ','fpgm','glyf','loca','prep','CFF ','VORG','EBDT','EBLC','gasp','hdmx','kern','LTSH','PCLT','VDMX','vhea','vmtx','BASE','GDEF','GPOS','GSUB','EBSC','JSTF','MATH','CBDT','CBLC','COLR','CPAL','SVG ','sbix','acnt','avar','bdat','bloc','bsln','cvar','fdsc','feat','fmtx','fvar','gvar','hsty','just','lcar','mort','morx','opbd','prop','trak','Zapf','Silf','Glat','Gloc','Feat','Sill'];

/** Liefert { name, version, zeichen: Map<Codepunkt, Glyphennummer> }. */
export function schriftZeichen(woff2Pfad){
  const buf = fs.readFileSync(woff2Pfad);
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error(woff2Pfad + ' ist keine WOFF2-Datei');
  const anzahl = buf.readUInt16BE(12);
  let p = 48;
  const b128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i++){ const b = buf[p++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; }
    throw new Error('WOFF2: Zahl zu lang');
  };
  const tabellen = [];
  for (let i = 0; i < anzahl; i++){
    const flags = buf[p++];
    let tag = WOFF2_TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63){ tag = buf.toString('latin1', p, p + 4); p += 4; }
    const trans = flags >> 6;
    let laenge = b128();
    if (((tag === 'glyf' || tag === 'loca') && trans === 0) || (tag === 'hmtx' && trans === 1)) laenge = b128();
    tabellen.push({ tag, laenge });
  }
  const daten = zlib.brotliDecompressSync(buf.subarray(p, p + buf.readUInt32BE(20)));
  const T = {};
  let o = 0;
  for (const t of tabellen){ T[t.tag] = daten.subarray(o, o + t.laenge); o += t.laenge; }

  const namen = {};
  if (T.name){
    const nm = T.name, n = nm.readUInt16BE(2), off0 = nm.readUInt16BE(4);
    for (let i = 0; i < n; i++){
      const r = 6 + i * 12;
      if (nm.readUInt16BE(r) !== 3) continue;
      const id = nm.readUInt16BE(r + 6), len = nm.readUInt16BE(r + 8), off = nm.readUInt16BE(r + 10);
      let s = '';
      for (let k = 0; k < len; k += 2) s += String.fromCharCode(nm.readUInt16BE(off0 + off + k));
      if (!namen[id]) namen[id] = s;
    }
  }

  const cm = T.cmap, zeichen = new Map();
  for (let i = 0; i < cm.readUInt16BE(2); i++){
    const plat = cm.readUInt16BE(4 + i * 8), off = cm.readUInt32BE(8 + i * 8);
    if (plat !== 3 && plat !== 0) continue;
    const fmt = cm.readUInt16BE(off);
    if (fmt === 4){
      const seg = cm.readUInt16BE(off + 6) / 2;
      const ende = off + 14, start = ende + seg * 2 + 2, delta = start + seg * 2, rng = delta + seg * 2;
      for (let s = 0; s < seg; s++){
        const e = cm.readUInt16BE(ende + s * 2), a = cm.readUInt16BE(start + s * 2);
        const d = cm.readInt16BE(delta + s * 2), r = cm.readUInt16BE(rng + s * 2);
        for (let c = a; c <= e && c !== 0xFFFF; c++){
          let g;
          if (r === 0) g = (c + d) & 0xFFFF;
          else { g = cm.readUInt16BE(rng + s * 2 + r + (c - a) * 2); if (g) g = (g + d) & 0xFFFF; }
          if (g && !zeichen.has(c)) zeichen.set(c, g);
        }
      }
    } else if (fmt === 12){
      const n = cm.readUInt32BE(off + 12);
      for (let k = 0; k < n; k++){
        const a = cm.readUInt32BE(off + 16 + k * 12), e = cm.readUInt32BE(off + 20 + k * 12), g = cm.readUInt32BE(off + 24 + k * 12);
        for (let c = a; c <= e; c++) if (!zeichen.has(c)) zeichen.set(c, g + (c - a));
      }
    }
  }
  return { name: namen[1] || '', version: namen[5] || '', zeichen };
}
