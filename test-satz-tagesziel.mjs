/* test-satz-tagesziel.mjs — bewacht das Tagesziel im Satzmodus (B4).
 *
 * Elias' Vorschlag im Wortlaut: „nach 13 aufgaben könnte auch so eine animation
 * kommen wie bei karteikarten die dann zeigt das man sein tagesziel erreicht
 * hat" — und ausdrücklich: „danach kann man noch weiter üben".
 *
 * ⭐ Zwei Dinge, die still kaputtgehen könnten und deshalb hier stehen:
 *   1. Die Feier feuert am ÜBERGANG, nicht bei jedem Stand darüber.
 *   2. Der Zähler ist TAGESBEZOGEN — ein neuer Tag fängt bei null an.
 * Beides sähe ohne Test völlig richtig aus.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ohneKommentareUndTexte } from './werkzeuge/js-quelltext.mjs';
const nurCode = (t) => ohneKommentareUndTexte(String(t), { texte: false });
import { fileURLToPath } from 'node:url';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const uebung = fs.readFileSync(path.join(WURZEL, 'js', 'uebung.js'), 'utf8');
/* ⛔ Kommentarfrei: „js/feier.js kennt 'satz-tagesziel'" darf nicht von einem
   Kommentar erfuellt werden. [[stichworttreffer_im_kommentar]] */
const feier  = nurCode(fs.readFileSync(path.join(WURZEL, 'js', 'feier.js'), 'utf8'));

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, gemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + gemessen); }
};

console.log('test-satz-tagesziel.mjs — das Tagesziel im Satzmodus\n');

/* ---------- 1. Die Zahl steht in der Quelle und ist begründet ---------- */
{
  const m = uebung.match(/const SATZ_TAGESZIEL\s*=\s*(\d+)/);
  pruefe('SATZ_TAGESZIEL steht in js/uebung.js', !!m, String(m));
  pruefe('und ist 13 — eine Aufgabe je Übungsart', m && Number(m[1]) === 13, m && m[1]);
  /* ⛔ Die 13 hängt an der Zahl der Übungsarten. Wächst UEBUNGEN, muss die
     Begründung neu bewertet werden — dieser Fall meldet das. */
  const modi = (uebung.match(/\bbaue\s*[:(]/g) || []).length;
  pruefe('die Begründung „13 Übungsarten" steht als Kommentar dabei',
    /jede der 13 Uebungsarten|13 Uebungsarten/.test(uebung), 'Kommentar fehlt');
  pruefe('Hinweis: ' + modi + ' baue()-Stellen in uebung.js gezählt', true, modi);
}

/* ---------- 2. Der Anlass ist eingetragen und hat die richtige Stärke ------ */
{
  pruefe("js/feier.js kennt 'satz-tagesziel'", feier.includes("'satz-tagesziel'"), '—');
  const block = feier.slice(feier.indexOf("'satz-tagesziel'"), feier.indexOf("'satz-tagesziel'") + 700);
  pruefe('einmalig je Tag', /einmalig:\s*\(\)\s*=>\s*`satz-\$\{todayStr\(0\)\}`/.test(block), block.slice(0, 90));
  pruefe('Konfetti 90 wie beim Hören, nicht 160 wie bei alles-fällig',
    /feierKonfetti\(90\)/.test(block), (block.match(/feierKonfetti\(\d+\)/) || [])[0]);
  pruefe("Banner 'mittel', nicht 'gross'", /'mittel'/.test(block) && !/'gross'/.test(block),
    (block.match(/'(mittel|gross)'/g) || []).join(','));
  /* Gegenprobe: 'alles-faellig' muss weiterhin der größere Anlass sein. */
  const gross = feier.slice(feier.indexOf("'alles-faellig'"), feier.indexOf("'alles-faellig'") + 600);
  pruefe('GEGENPROBE — alles-fällig ist weiterhin größer',
    /feierKonfetti\(1[0-9]{2}\)/.test(gross) && /'gross'/.test(gross),
    (gross.match(/feierKonfetti\(\d+\)/) || [])[0] + ' ' + (gross.match(/'(mittel|gross)'/) || [])[0]);
}

/* ---------- 3. ⭐ Der Zähler: Tag, Übergang, kein Sperren ---------- */
{
  const schneide = (text, name) => {
    const a = text.indexOf('function ' + name + '(');
    if (a < 0) return null;
    let i = text.indexOf('{', a), t = 0;
    for (; i < text.length; i++){
      if (text[i] === '{') t++;
      else if (text[i] === '}'){ t--; if (!t) return text.slice(a, i + 1); }
    }
    return null;
  };
  const code = [schneide(uebung, 'satzTag'), schneide(uebung, 'satzTagSpeichern')];
  pruefe('satzTag() und satzTagSpeichern() stehen in js/uebung.js', code.every(Boolean), String(code.map(Boolean)));

  const c = { speicher: {}, heute: '2026-09-07', Object, JSON, console,
    LS: { get: (k, d) => (k in c.speicher ? c.speicher[k] : d), set: (k, v) => { c.speicher[k] = v; } },
    todayStr(){ return c.heute; } };
  vm.createContext(c);
  vm.runInContext(code.join('\n') + '\n;globalThis.__t = satzTag; globalThis.__s = satzTagSpeichern;', c);
  const tag = c.__t, speichern = c.__s;

  const t1 = tag();
  pruefe('frischer Tag beginnt bei 0', t1.gesamt === 0 && t1.richtig === 0, JSON.stringify(t1));
  t1.gesamt = 13; t1.richtig = 9; speichern(t1);
  pruefe('gespeicherter Stand kommt zurück', tag().gesamt === 13, tag().gesamt);
  pruefe('und wird NICHT gesperrt — 14 ist möglich',
    (() => { const t = tag(); t.gesamt++; speichern(t); return tag().gesamt === 14; })(), tag().gesamt);

  /* ⭐ Der wichtige Fall: neuer Tag → wieder bei null. */
  c.heute = '2026-09-08';
  pruefe('am nächsten Tag fängt der Zähler wieder bei 0 an',
    tag().gesamt === 0 && tag().tag === '2026-09-08', JSON.stringify(tag()));

  /* ⛔ Und ohne Speicher darf nichts werfen. */
  c.LS = { get(){ throw new Error('gesperrt'); }, set(){ throw new Error('gesperrt'); } };
  let warf = false, r;
  try { r = tag(); speichern(r); } catch (e) { warf = true; }
  pruefe('gesperrter Speicher: kein Absturz, Stand 0',
    !warf && r && r.gesamt === 0, warf ? 'hat geworfen' : JSON.stringify(r));
}

/* ---------- 4. ⭐ Die Auslösung sitzt am Übergang ---------- */
{
  /* ⛔⛔ NICHT mehr „+ 2600 Zeichen". Die Bedingung steht 52 Zeilen nach dem
     Funktionskopf, und der feste Ausschnitt endete knapp davor, sobald in der
     Funktion ein Kommentar dazukam: der Pruefer meldete „Bedingung nicht
     gefunden" fuer Code, der unveraendert dasteht (js/uebung.js:1387).
     Eine Schablone mit Stellenzahl misst die Laenge, nicht die Sache.
     [[schablone_mit_stellenzahl]]
     Jetzt bis zur naechsten Funktion auf oberster Ebene — das ist die echte
     Grenze; Deklarationen INNERHALB stehen eingerueckt und treffen nicht. */
  const start = uebung.indexOf('function uebungAuswerten');
  const bisEnde = uebung.slice(start + 1);
  const naechste = bisEnde.search(/\nfunction /);
  const stelle = naechste < 0 ? uebung.slice(start)
                              : uebung.slice(start, start + 1 + naechste);
  pruefe('die Feier hängt am Übergang (satzVorher < ZIEL && jetzt >= ZIEL)',
    /satzVorher\s*<\s*SATZ_TAGESZIEL\s*&&\s*satzT\.gesamt\s*>=\s*SATZ_TAGESZIEL/.test(stelle),
    'Bedingung nicht gefunden');
  pruefe('gezählt wird in uebungAuswerten() — der einen Stelle für alle 13 Modi',
    /satzT\.gesamt\+\+/.test(stelle), 'Zählung nicht gefunden');
  /* ⛔ Der erste Anlauf suchte `indexOf('renderUebung()')` — und traf den
     KOMMENTAR darüber, der genau diesen Namen nennt („VOR renderUebung(), damit
     …"). Der Test war rot, obwohl der Code stimmte. Deshalb wird hier auf den
     AUFRUF am Zeilenanfang geprüft, nicht auf das Wort.
     [[stichworttreffer_im_kommentar]] */
  const zeilen = stelle.split(/\r?\n/);
  const zeileMit = (muster) => zeilen.findIndex(z => muster.test(z.trim()));
  const iZaehler = zeileMit(/^satzTagSpeichern\(satzT\);$/);
  const iRender  = zeileMit(/^renderUebung\(\);$/);
  pruefe('der Zähler steht VOR renderUebung(), damit die Standzeile stimmt',
    iZaehler >= 0 && iRender >= 0 && iZaehler < iRender,
    'Zeile ' + iZaehler + ' vs ' + iRender);
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
