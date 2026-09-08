/* bestandsbelege.mjs — Belege aus ELIAS' EIGENEM BESTAND für die Felder, die
 * den offenen Fragen fehlen.
 *
 *   node werkzeuge/bestandsbelege.mjs            schreibt data/bestandsbelege.json
 *   node werkzeuge/bestandsbelege.mjs --zeigen   nur anzeigen, nichts schreiben
 *
 * ================== WOZU ===================================================
 *
 * ⭐⭐ Elias' Rangfolge der Quellen lautet: 1. arabicroots · 2. seine Bücher ·
 * 3. sonstige Belege · 4. arabdict · 5. Langenscheidt nur im größten Notfall.
 *
 * ⛔ RICHTIGSTELLUNG zum ersten Entwurf dieser Datei: „vorrat.mjs liest den
 * eigenen Bestand gar nicht" war FALSCH. `belegSuchen()` in vorrat.mjs sucht
 * dasselbe Wort sehr wohl im Bestand — mit NFC-Vergleich, Selbstbezug-Filter
 * und Bedeutungsprobe. Ich hatte eine Begründung geschrieben, bevor ich die
 * Stelle gelesen hatte. [[erfundene_begruendung_schliesst_den_fall]]
 *
 * Was dieses Werkzeug WIRKLICH hinzufügt, sind die drei Fälle, die ein
 * Vergleich auf Gleichheit nicht sehen kann — am 08.09.2026 gemessen:
 * **5 Wörter, 7 Angaben**, für die die Wörterbücher nichts hatten.
 * [[eigener_bestand_vor_woerterbuch]]
 *
 * ================== DIE VIER REGELN, UND WARUM NUR DIESE VIER ==============
 *
 * ⛔ Ein Skelettvergleich wäre hier der naheliegende und falsche Weg: ohne
 * Ḥarakāt treffen مُدَرِّسَةٌ und مَدْرَسَةٌ einander.
 * [[skelettvergleich_wirft_information_weg]]
 *
 * Deshalb belegt dieses Werkzeug nur, wo die Beziehung EINDEUTIG ist:
 *
 *   R0  dasselbe Wort steht im Bestand und lässt das Feld LEER  → „gibt es nicht"
 *   R1  dasselbe Wort steht schon im Bestand (nur der Artikel darf abweichen)
 *   R2  das Wort ist die weibliche Form eines Bestandsworts (+ ة)
 *   R3  das Wort ist ein Bestandswort mit angehängtem Personalsuffix
 *
 * R1 unterscheidet sich von `belegSuchen()` nur durch den Artikel — genau
 * daran scheiterte dort أَلْمُهَنْدِسٌ gegen مُهَنْدِسٌ. R0, R2 und R3 gibt es dort
 * gar nicht.
 *
 * Alles andere bleibt UNBELEGT und geht als Frage an Elias. Ein Vorschlag,
 * den niemand geprüft hat, ist gefährlicher als eine offene Frage — er sieht
 * aus wie ein Befund. [[vorgabewert_sieht_aus_wie_befund]]
 *
 * ⛔ Dieses Werkzeug trägt NICHTS ein. Es schreibt eine Belegdatei, die
 * `vorrat.mjs --offene-fragen` neben die Wörterbuchbelege stellt. Die
 * Entscheidung bleibt bei Elias.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

/* ⛔ fileURLToPath, NICHT `new URL(...).pathname`: der Ordner heißt
   „1. Workspace", und in einer URL steht dort %20. Der rohe pathname ergibt
   `G:\1.%20Workspace\…` — ein Pfad, den es nicht gibt, mit einer Fehlermeldung,
   die nach einem fehlenden Ordner aussieht statt nach einer Kodierung. */
const REPO   = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p      = (...t) => path.join(REPO, ...t);
const ZEIGEN = process.argv.includes('--zeigen');

/* ---------- 1. Den Bestand einlesen ---------- */
/* Regex statt vm: im vm-Kontext sind `const`-Variablen unsichtbar.
   [[const_ist_im_vm_kontext_unsichtbar]] */
const QUELLEN = [];
for (const ordner of ['data', '.']) {
  const voll = p(ordner);
  for (const f of fs.readdirSync(voll)) {
    if (/^(vokabeln-.*\.js|vocab-data\.js)$/.test(f)) QUELLEN.push(path.join(voll, f));
  }
}

const BESTAND = [];
for (const datei of QUELLEN) {
  const kurz = path.basename(datei);
  for (const stueck of fs.readFileSync(datei, 'utf8').split(/\}\s*,\s*\{/)) {
    const ar   = (stueck.match(/["']?\bar["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    const de   = (stueck.match(/["']?\bde["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    const root = (stueck.match(/["']?\broot["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    const type = (stueck.match(/["']?\btype["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    const pl   = (stueck.match(/["']?\bpl["']?\s*:\s*["']([^"']+)["']/) || [])[1];
    /* ⛔ Die id wird gebraucht, um den SELBSTBEZUG auszuschließen — siehe R0. */
    const id   = (stueck.match(/["']?\bid["']?\s*:\s*["']?([A-Za-z0-9_-]+)["']?/) || [])[1];
    if (ar) BESTAND.push({ id, ar, de: de || '', root, type, pl, datei: kurz });
  }
}

/* ---------- 2. Vergleichsformen ---------- */
const HARAKAT = /[ً-ْٰـ]/g;
const nackt   = s => (s || '').replace(HARAKAT, '').trim();
/* ⛔ Nur der Artikel wird abgetrennt, nichts sonst: أَلْمُهَنْدِسٌ und مُهَنْدِسٌ sind
   dasselbe Wort, مُدَرِّسٌ und دَرْسٌ sind es nicht. */
const ohneArtikel = s => nackt(s).replace(/^(ال|أل|اَل)/, '');

/* ⛔⛔ R1 vergleicht MIT Ḥarakāt — der erste Entwurf tat es nicht, und das war
   sofort ein falscher Beleg: unvokalisiert ist بَعْدَ („nach", Partikel ohne
   Wurzel) dasselbe wie بَعُدَ („fern sein", Verb, Wurzel ب ع د). Das Werkzeug
   hat die Wurzel des VERBS an die Partikel gehängt und dabei den exakt
   passenden Eintrag in vokabeln-quran.js übergangen.
   [[skelettvergleich_wirft_information_weg]] */
const vollForm = s => (s || '').trim().replace(/^(اَلْ|أَلْ|الْ|أل|ال)/, '');
const SUFFIXE = ['ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ه', 'ك', 'ي'];

/* ---------- 3. Die offenen Fragen holen ---------- */
const TMP = p('artefakte', '.bestandsbelege-fragen.json');
fs.mkdirSync(p('artefakte'), { recursive: true });
/* ⛔ vorrat.mjs endet mit Exitcode 2, wenn etwas offen ist — hier der
   NORMALFALL, nicht der Fehler. execFileSync würde darauf werfen. */
try {
  execFileSync(process.execPath, [p('werkzeuge', 'vorrat.mjs'), '--offene-fragen', TMP],
    { cwd: REPO, stdio: 'pipe' });
} catch (e) {
  if (!fs.existsSync(TMP)) { console.error('vorrat.mjs lieferte keine Fragen:', e.message); process.exit(1); }
}
const FRAGEN = JSON.parse(fs.readFileSync(TMP, 'utf8')).fragen;

/* ---------- 4. Belegen ---------- */
const belege = {};
let gezaehlt = 0;

for (const frage of FRAGEN) {
  for (const w of frage.woerter) {
    if (w.beleg) continue;                       // Wörterbuch war schon da
    const feld = frage.feld;
    const zielNackt = ohneArtikel(w.ar);
    const zielVoll  = vollForm(w.ar);
    let treffer = null, regel = null;

    /* ⛔⛔ R0 ZUERST: steht dasselbe Wort schon im Bestand und lässt das Feld
       LEER? Dann ist DAS die Auskunft — „es gibt keine" — und kein Beleg von
       anderswo darf sie überschreiben. Der erste Entwurf suchte nur nach
       Einträgen, die das Feld HABEN, und hat damit genau den aussagekräftigen
       Fall systematisch übersprungen. [[leere_liste_ist_keine_messung]] */
    /* ⛔⛔ SELBSTBEZUG AUSSCHLIESSEN. Das gefragte Wort steht selbst im
       Bestand — ohne diesen Filter findet سُكَّرٌ sich selbst und „belegt", dass
       es keinen Plural gibt. Der erste Lauf sprang dadurch von 8 auf 31
       Belege, und 23 davon waren Zirkelschlüsse: ein Wort, das sich selbst
       als Beleg nimmt, belegt nichts.
       [[pruefwerkzeug_mit_eingebauter_antwort]] · [[mein_neues_werkzeug_ist_verdaechtig]] */
    const gleiches = BESTAND.filter(b => vollForm(b.ar) === zielVoll && vollForm(b.ar) !== ''
                                      && String(b.id) !== String(w.id));
    const leerLassend = gleiches.filter(b => !b[feld]);
    if (leerLassend.length && !gleiches.some(b => b[feld])) {
      const q = leerLassend[0];
      belege[w.id] = belege[w.id] || {};
      belege[w.id][feld] = {
        wert: null, regel: 'R0 dasselbe Wort steht im Bestand und lässt dieses Feld leer',
        belegwort: q.ar, belegBedeutung: q.de, belegDatei: q.datei,
      };
      gezaehlt++;
      if (ZEIGEN) console.log('  ⃝  ' + feld.padEnd(7) + w.ar.padEnd(16) + '→ (keine Angabe)'
        + '   (R0 ' + q.ar + ' = ' + q.de + ', ' + q.datei + ')');
      continue;
    }

    /* R1 — dasselbe Wort, MIT Ḥarakāt verglichen */
    treffer = gleiches.find(b => b[feld]);
    if (treffer) regel = 'R1 dasselbe Wort steht schon im Bestand';

    /* R2 — weibliche Form eines Bestandsworts */
    if (!treffer && zielNackt.endsWith('ة')) {
      const maskulin = zielNackt.slice(0, -1);
      treffer = BESTAND.find(b => b[feld] && ohneArtikel(b.ar) === maskulin);
      if (treffer) regel = 'R2 weibliche Form von ' + treffer.ar;
    }

    /* R3 — Bestandswort mit Personalsuffix */
    if (!treffer) {
      for (const suf of SUFFIXE) {
        if (!zielNackt.endsWith(suf) || zielNackt.length <= suf.length + 1) continue;
        const stamm = zielNackt.slice(0, -suf.length);
        const t = BESTAND.find(b => b[feld] && ohneArtikel(b.ar) === stamm);
        if (t) { treffer = t; regel = 'R3 ' + t.ar + ' mit angehängtem ' + suf; break; }
      }
    }

    if (!treffer) continue;
    /* ⛔ Ein Plural, der beim Grundwort steht, gilt NICHT für die Form mit
       Suffix oder für die weibliche Form — dort ist er ein anderer. */
    if (feld === 'pl' && regel[1] !== '1') continue;
    /* ⛔⛔ Eine Partikel hat keine Wurzel. Steht im Bestand trotzdem eine
       (فِي trägt in vokabeln-madina-1.js `root: ف ي`, in vocab-data.js keine —
       zwei Fassungen desselben Worts widersprechen sich), wird sie hier NICHT
       weitergereicht: sonst erbt فِيْهِ einen Fehler aus dem Abzug.
       [[dieselbe_frage_zwei_antworten]] */
    if (feld === 'root' && treffer.type === 'particle') {
      if (ZEIGEN) console.log('  ⚠  root   ' + w.ar.padEnd(16)
        + '→ NICHT übernommen: ' + treffer.ar + ' ist eine Partikel und hat keine Wurzel'
        + ' (im Bestand steht dort ' + treffer.root + ')');
      continue;
    }

    belege[w.id] = belege[w.id] || {};
    belege[w.id][feld] = {
      wert: treffer[feld], regel,
      belegwort: treffer.ar, belegBedeutung: treffer.de, belegDatei: treffer.datei,
    };
    gezaehlt++;
    if (ZEIGEN) console.log('  ✅ ' + feld.padEnd(7) + w.ar.padEnd(16) + '→ ' + treffer[feld]
      + '   (' + regel + ', ' + treffer.datei + ')');
  }
}

/* Was offen bleibt, wird ebenso genannt — eine Belegliste ohne ihre Lücken
   liest sich wie Vollständigkeit. [[kandidatenliste_ist_keine_fehlerliste]] */
let offen = 0;
for (const frage of FRAGEN) {
  for (const w of frage.woerter) {
    if (w.beleg) continue;
    if (belege[w.id] && belege[w.id][frage.feld]) continue;
    offen++;
    if (ZEIGEN) console.log('  —  ' + frage.feld.padEnd(7) + w.ar.padEnd(16) + '(kein Beleg im eigenen Bestand)');
  }
}

console.log('\n  Bestand: ' + BESTAND.length + ' Einträge aus ' + QUELLEN.length + ' Datei(en)');
console.log('  Belegt aus dem eigenen Bestand: ' + gezaehlt + '   offen: ' + offen);

if (!ZEIGEN) {
  const ziel = p('data', 'bestandsbelege.json');
  const inhalt = JSON.stringify({
    erzeugt: new Date().toISOString(),
    quelle: 'Elias eigener Vokabelbestand (Rang 1 und 2 seiner Rangfolge)',
    regeln: ['R1 dasselbe Wort', 'R2 weibliche Form', 'R3 mit Personalsuffix'],
    belege,
  }, null, 2);
  fs.writeFileSync(ziel + '.neu', inhalt, 'utf8');
  fs.renameSync(ziel + '.neu', ziel);          // [[leere_datei_besteht_jeden_test]]
  console.log('  Geschrieben: data/bestandsbelege.json');
}
try { fs.unlinkSync(TMP); } catch { /* egal */ }
