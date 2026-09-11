#!/usr/bin/env node
/* pruefe-regelsammlung-routinen.mjs — die zwei Werkzeuge, mit denen die Wartung die Regelsammlung pflegt
 * =====================================================================================================
 *
 * ⛔⛔ DER ANLASS — Elias am 11.09.2026:
 *
 *   19:07:37  „da wir jetzt auch ein regeln feld haben in der app, sollen wir
 *              unsere routinen dahingehend anpassen oder eine neue aufbauen …"
 *   19:22:49  Auswahl: „Alle drei (Recommended)"
 *
 * Gebaut wurden werkzeuge/regeln-holen.mjs (seine Einträge aus dem Abgleich)
 * und werkzeuge/regelsammlung-wache.mjs (Wiedervorlagen, Zusammenfassungs-
 * Folgen, neue Grammatik-Notizen). Beide laufen unbeaufsichtigt in der
 * Wartung — ein Fehler dort meldet sich nie von selbst. Deshalb hier, mit
 * Testständen, deren Antwort unabhängig feststeht:
 *
 *   A. regeln-holen: zeigt Neues, merkt es erst auf --merken, zeigt es danach
 *      nicht mehr, und ⛔ druckt NIE etwas aus seinem übrigen Lernstand
 *      (ein Köder in vt_progress darf nicht erscheinen, auch nicht im
 *      gemerkten Stand).
 *   B. regelsammlung-wache: die Stichworte der echten Wiedervorlage treffen in
 *      den echten Transkripten GENAU die bekannte Stelle (Folge 16, „fünf
 *      Ausnahmewörter") und nicht „Asma-Ul-Ishara" (Folge 10) oder den Namen
 *      Hamza — die Eichung vom 11.09.2026, hier wiederholt.
 *   C. Zusammenfassungs-Folgen und Notizen mit Testständen; und je ein
 *      Störtest, der beweist, dass die Prüfung die Datei wirklich liest.
 *
 * ⚠️ Ob die Wartung die Werkzeuge AUFRUFT und darf, prüft
 * werkzeuge/pruefe-pflegeplan.mjs — dort steht die Regelsammlung mit ihren
 * Belegen. Hier nicht noch einmal: zwei Listen über dieselbe Frage laufen
 * auseinander. [[dieselbe_frage_zwei_antworten]]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOLEN = path.join(REPO, 'werkzeuge', 'regeln-holen.mjs');
const WACHE = path.join(REPO, 'werkzeuge', 'regelsammlung-wache.mjs');

let fehler = 0;
const gut = (t) => console.log('  ✓ ' + t);
const schlecht = (t) => { fehler++; console.log('  ✗ ' + t); };
const pruefe = (b, t, gemessen) => (b ? gut(t) : schlecht(t + (gemessen !== undefined ? '   gemessen: ' + String(gemessen).slice(0, 300) : '')));
const lauf = (datei, argumente) => {
  const r = spawnSync(process.execPath, [datei, ...argumente], { cwd: REPO, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, text: (r.stdout || '') + (r.stderr || '') };
};
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), 'rs-' + name + '-'));
const schreib = (ordner, name, inhalt) => { const p = path.join(ordner, name); fs.writeFileSync(p, inhalt, 'utf8'); return p; };

/* ================= A. regeln-holen ================= */
console.log('');
console.log('=== A. regeln-holen.mjs: seine Einträge, nur Neues, nichts vom Lernstand ===');
{
  const ordner = tmp('holen');
  const KOEDER = 'KOEDER_LERNSTAND_4711';
  const stand = (regeln) => JSON.stringify({ fassung: 1, geaendert: Date.UTC(2026, 8, 11, 17, 0), stempel: {},
    daten: { vt_progress: JSON.stringify({ [KOEDER]: { box: 3 } }), vt_regeln: JSON.stringify(regeln) } });
  const basis = {
    notiz:  { 'asma-khamsa-01': { text: 'Notiz NOTIZ_TEXT_A', zeit: 1000 } },
    weg:    { 'f19-idafa': { an: true, zeit: 1100 }, 'idafa-zweitglied-01': { an: false, zeit: 900 } },
    eigene: { 'eigen-1': { name: 'Meine Testregel', kurz: 'kurz erklärt', zeit: 1200 } },
    text:   { 'huwa-hiya-01': { name: null, kurz: null, zeit: 1300 } },
    satz:   { 'harf-jarr-bi-01': { an: false, zeit: 1400 } },
    zeigen: {}
  };
  const f1 = schreib(ordner, 'stand1.json', stand(basis));

  let r = lauf(HOLEN, [f1, '--zustand', ordner]);
  pruefe(r.code === 2, 'erster Lauf: Neues → Exitcode 2', r.code + ' ' + r.text);
  pruefe(r.text.includes('NOTIZ_TEXT_A'), 'seine Notiz steht in der Ausgabe');
  pruefe(!r.text.includes(KOEDER), '⛔ der Köder aus vt_progress erscheint NICHT', r.text);
  pruefe(r.text.includes('im Papierkorb') && r.text.includes('zurückgeholt'), 'Papierkorb: gelöscht und zurückgeholt werden unterschieden');
  pruefe(r.text.includes('auf das Original zurückgesetzt'), 'eine zurückgesetzte Fassung heißt so, nicht „Fassung"');
  pruefe(r.text.includes('Meine Testregel'), 'eigene Regel mit Namen');
  pruefe(/asma-khamsa-01\s+Die fünf Ausnahmewörter/.test(r.text), 'Regelname kommt aus grammar-data.js', r.text.split('\n').find(z => z.includes('asma-khamsa-01')));
  pruefe(/f19-idafa\s+\S/.test(r.text) && !/f19-idafa\s+\(unbekannte ID\)/.test(r.text), 'Kartenname kommt aus regelsammlung-data.js', r.text.split('\n').find(z => z.includes('f19-idafa')));

  const vorgemerkt = path.join(ordner, '.regeln-stand.neu.json');
  pruefe(fs.existsSync(vorgemerkt), 'der Lauf legt den Stand nur VOR (.neu.json)');
  pruefe(!fs.existsSync(path.join(ordner, '.regeln-stand.json')), '… und merkt ohne --merken nichts');
  const vorText = fs.existsSync(vorgemerkt) ? fs.readFileSync(vorgemerkt, 'utf8') : '';
  pruefe(!vorText.includes('NOTIZ_TEXT_A') && !vorText.includes(KOEDER), '⛔ im Vorgemerkten stehen keine Texte, nur IDs und Zeiten', vorText);

  r = lauf(HOLEN, ['--merken', '--zustand', ordner]);
  pruefe(r.code === 0 && fs.existsSync(path.join(ordner, '.regeln-stand.json')), '--merken übernimmt den Stand', r.code + ' ' + r.text);

  r = lauf(HOLEN, [f1, '--zustand', ordner]);
  pruefe(r.code === 0, 'derselbe Stand noch einmal: nichts Neues → 0', r.code + ' ' + r.text);

  const geaendert = JSON.parse(JSON.stringify(basis));
  geaendert.notiz['asma-khamsa-01'] = { text: 'Notiz NOTIZ_TEXT_B', zeit: 2000 };
  r = lauf(HOLEN, [schreib(ordner, 'stand2.json', stand(geaendert)), '--zustand', ordner]);
  pruefe(r.code === 2 && r.text.includes('NOTIZ_TEXT_B') && !r.text.includes('Meine Testregel'), 'eine geänderte Notiz ist neu — die unveränderte eigene Regel nicht', r.code + ' ' + r.text);
  lauf(HOLEN, ['--merken', '--zustand', ordner]);

  const nurSchalter = JSON.parse(JSON.stringify(geaendert));
  nurSchalter.satz['harf-jarr-bi-01'] = { an: true, zeit: 3000 };
  r = lauf(HOLEN, [schreib(ordner, 'stand3.json', stand(nurSchalter)), '--zustand', ordner]);
  pruefe(r.code === 0 && r.text.includes('zur Auskunft'), 'nur ein Schalter „im Satzmodus" geändert: Auskunft, keine Arbeit → 0', r.code + ' ' + r.text);

  r = lauf(HOLEN, [schreib(ordner, 'ohne.json', JSON.stringify({ geaendert: 1, daten: { vt_progress: '{}' } })), '--zustand', ordner]);
  pruefe(r.code === 0 && r.text.includes('Keine Regelsammlung') && r.text.includes('NICHT zwingend'), 'ohne vt_regeln: 0 — und der Satz, dass leer nicht „nichts eingetragen" heißt', r.code + ' ' + r.text);

  r = lauf(HOLEN, [schreib(ordner, 'kaputt.json', '{kaputt'), '--zustand', ordner]);
  pruefe(r.code === 1, 'kaputtes JSON → 1', r.code);

  const leer = tmp('holen-leer');
  r = lauf(HOLEN, ['--merken', '--zustand', leer]);
  pruefe(r.code === 1, '--merken ohne vorigen Lauf → 1 (gemerkt wird nur, was gezeigt wurde)', r.code);

  /* Namensraum und Schlüssel: drei Stellen, eine Wahrheit. */
  const ns = (t) => (/NAMENSRAUM\s*=\s*'([0-9a-f]+)'/.exec(t) || [])[1];
  const ks = (t) => (/KV_SCHLUESSEL\s*=\s*'([^']+)'/.exec(t) || [])[1];
  const holenText = fs.readFileSync(HOLEN, 'utf8');
  const vorschlText = fs.readFileSync(path.join(REPO, 'werkzeuge', 'vorschlaege-holen.mjs'), 'utf8');
  const toml = fs.readFileSync(path.join(REPO, 'wrangler.toml'), 'utf8');
  const tomlId = (/binding\s*=\s*"STAND"[\s\S]*?\bid\s*=\s*"([0-9a-f]+)"/.exec(toml) || [])[1];
  pruefe(ns(holenText) && ns(holenText) === ns(vorschlText) && ns(holenText) === tomlId, 'Namensraum gleich in regeln-holen, vorschlaege-holen und wrangler.toml (STAND)', [ns(holenText), ns(vorschlText), tomlId].join(' / '));
  pruefe(ks(holenText) && ks(holenText) === ks(vorschlText), 'KV-Schlüssel gleich in beiden Werkzeugen', [ks(holenText), ks(vorschlText)].join(' / '));
}

/* ================= B. Wiedervorlagen: die Eichung an den echten Transkripten ================= */
console.log('');
console.log('=== B. regelsammlung-wache.mjs: Wiedervorlagen gegen die echten Transkripte ===');
{
  const liste = JSON.parse(fs.readFileSync(path.join(REPO, 'werkzeuge', 'wiedervorlagen.json'), 'utf8'));
  const gd = fs.readFileSync(path.join(REPO, 'grammar-data.js'), 'utf8');
  pruefe(Array.isArray(liste.eintraege) && liste.eintraege.length >= 1, 'wiedervorlagen.json hat Einträge', liste.eintraege && liste.eintraege.length);
  for (const e of liste.eintraege || []){
    pruefe(new RegExp('["\\\']?id["\\\']?\\s*:\\s*["\\\']' + e.regelId + '["\\\']').test(gd), 'Wiedervorlage ' + e.regelId + ': die Regel gibt es in grammar-data.js');
    pruefe(typeof e.zitat === 'string' && e.zitat.length >= 20, 'Wiedervorlage ' + e.regelId + ': sein Wortlaut steht dabei');
  }

  const transkripte = path.join(REPO, 'transcripts');
  if (!fs.existsSync(path.join(transkripte, 'whisper-voll', 'folge-16.txt'))){
    console.log('  ⚠️  transcripts/ fehlt auf diesem Rechner — Eichung übersprungen (gesperrter Ordner, nicht im Repo)');
  } else {
    const ordner = tmp('eichung');
    const asma = liste.eintraege.find(e => e.regelId === 'asma-khamsa-vollstaendig-01');
    const eich = schreib(ordner, 'wv.json', JSON.stringify({ eintraege: [{ ...asma, abFolge: 1, erledigt: null }] }));
    const notizen = fs.mkdtempSync(path.join(ordner, 'n-'));
    const r = lauf(WACHE, ['--ohne-aufnahmen', '--wiedervorlagen', eich, '--notizordner', notizen, '--zustand', ordner]);
    const folgen = [...r.text.matchAll(/— Folge (\d+) trifft/g)].map(m => Number(m[1]));
    pruefe(folgen.length === 1 && folgen[0] === 16, 'ab Folge 1 trifft GENAU Folge 16 (die bekannte Stelle)', folgen.join(',') + '\n' + r.text);
    pruefe(/Whisper, Zeile 273: .*fünf Ausnahmewörter/.test(r.text), '… an der Zeile „fünf Ausnahmewörter" (whisper-voll, 273)');
    pruefe(!/Ishara/i.test(r.text) && !/Hamsa/.test(r.text), '„Asma-Ul-Ishara" und der Name Hamza erscheinen nicht');
    pruefe(r.code === 2, 'ein neuer Treffer → Exitcode 2', r.code);

    /* Und mit der echten Schwelle (ab Folge 20): kein Treffer in 1–19. */
    const echt = schreib(ordner, 'wv-echt.json', JSON.stringify({ eintraege: [asma] }));
    const r2 = lauf(WACHE, ['--ohne-aufnahmen', '--wiedervorlagen', echt, '--notizordner', notizen, '--zustand', fs.mkdtempSync(path.join(ordner, 'z-'))]);
    pruefe(/kein Treffer ab Folge 20/.test(r2.text), 'mit abFolge 20: kein Treffer in den vorhandenen Folgen', r2.text);

    /* ⛔ Störtest: dieselbe Wiedervorlage OHNE die Wörter, die treffen — dann
       darf auch nichts treffen. Sonst träfe die Suche etwas anderes als die
       Stichworte. */
    const ohne = { ...asma, abFolge: 1, stichworte: ['WortDasNirgendsSteht'] };
    const r3 = lauf(WACHE, ['--ohne-aufnahmen', '--wiedervorlagen', schreib(ordner, 'wv-ohne.json', JSON.stringify({ eintraege: [ohne] })), '--notizordner', notizen, '--zustand', fs.mkdtempSync(path.join(ordner, 'y-'))]);
    pruefe(!/trifft/.test(r3.text) && /kein Treffer/.test(r3.text), 'Störtest: ein Stichwort, das nirgends steht, trifft nichts', r3.text);
  }
}

/* ================= C. Zusammenfassungs-Folgen und Notizen ================= */
console.log('');
console.log('=== C. Zusammenfassungs-Folgen und Grammatik-Notizen ===');
{
  const ordner = tmp('wache');
  const leereListe = schreib(ordner, 'wv.json', JSON.stringify({ eintraege: [] }));
  const titel = schreib(ordner, 'aufnahmen.json', 'Ausgabe des Werkzeugs:\n' + JSON.stringify([
    { title: 'Folge 10 | MB1 Kapitel 7 Tilka' },
    { title: 'Folge 18 | Pronomen & Konjugieren' },
    { title: 'Folge 19 | Grammatikabfrage 1' },
    { title: 'Folge 27 | Wiederholung Kapitel 13 bis 15' }
  ]));
  const notizen = fs.mkdtempSync(path.join(ordner, 'notizen-'));
  const notiz = (name, uuid, geaendert) => schreib(notizen, name + '.md', '# ' + name + '\n\n- Ordner: Arabisch\\Grammatik\n- Erstellt: 2026-09-01 10:00\n- Geändert: ' + geaendert + '\n- UUID: ' + uuid + '\n');
  notiz('Testnotiz Eins', 'uuid-1', '2026-09-01 10:00');
  notiz('Testnotiz Zwei', 'uuid-2', '2026-09-02 10:00');
  const zustand = fs.mkdtempSync(path.join(ordner, 'zustand-'));
  const basis = ['--aufnahmen', titel, '--wiedervorlagen', leereListe, '--notizordner', notizen, '--zustand', zustand];

  let r = lauf(WACHE, basis);
  pruefe(/Folge 19 „Grammatikabfrage 1" — Karten: FOLGE19_KARTEN/.test(r.text), 'Folge 19 wird als Zusammenfassung erkannt — und hat ihre Karten', r.text);
  pruefe(/🆕 Folge 27 „Wiederholung Kapitel 13 bis 15" — KEINE Karten/.test(r.text), 'eine neue Wiederholungs-Folge ohne Karten wird gemeldet');
  pruefe(!/Folge 18/.test(r.text.split('=== 2.')[1] || '') && !/Folge 10/.test(r.text.split('=== 2.')[1] || ''), '„Pronomen & Konjugieren" und „Kapitel 7 Tilka" sind keine Zusammenfassungen');
  pruefe(/🆕 „Testnotiz Eins"/.test(r.text) && /🆕 „Testnotiz Zwei"/.test(r.text), 'noch nie gemerkte Notizen sind neu');
  pruefe(r.code === 2, 'Neues → 2', r.code);

  r = lauf(WACHE, ['--merken', '--zustand', zustand]);
  pruefe(r.code === 0, '--merken', r.code + ' ' + r.text);
  r = lauf(WACHE, basis);
  pruefe(r.code === 0 && /schon gemeldet am/.test(r.text), 'nach --merken: Folge 27 steht als „schon gemeldet" da, nicht als neu → 0', r.code + ' ' + r.text);

  notiz('Testnotiz Drei', 'uuid-3', '2026-09-11 10:00');
  notiz('Testnotiz Eins', 'uuid-1', '2026-09-11 11:00');
  r = lauf(WACHE, basis);
  pruefe(r.code === 2 && /🆕 „Testnotiz Drei"/.test(r.text) && !/🆕 „Testnotiz Eins"/.test(r.text), 'eine neue Notiz → 2; die nur neu gestempelte ist KEINE neue', r.code + ' ' + r.text);
  pruefe(/⚠️\s+„Testnotiz Eins" — Geändert-Stempel neu/.test(r.text), '… die neu gestempelte steht als Hinweis da');

  r = lauf(WACHE, ['--wiedervorlagen', leereListe, '--notizordner', notizen, '--zustand', zustand]);
  pruefe(r.code === 1 && /--aufnahmen <datei> fehlt/.test(r.text), 'ohne --aufnahmen und ohne --ohne-aufnahmen → 1 (kein stilles Überspringen)', r.code);

  r = lauf(WACHE, ['--ohne-aufnahmen', '--wiedervorlagen', leereListe, '--notizordner', path.join(ordner, 'gibt-es-nicht'), '--zustand', zustand]);
  pruefe(r.code === 1 && /Nichts gemessen/.test(r.text), 'fehlender Notizordner → 1', r.code);

  /* ⛔ Störtest: eine Kartendatei OHNE FOLGE19_KARTEN — dann muss Folge 19
     als Zusammenfassung ohne Karten gemeldet werden. Beweist, dass die
     Kartenprüfung die Datei liest und nicht am Titel „weiß", dass es Karten gibt. */
  const ohneKarten = schreib(ordner, 'karten-leer.js', 'const REGEL_ENTWUERFE = {};\n');
  r = lauf(WACHE, ['--karten', ohneKarten, ...basis.slice(0, -2), '--zustand', fs.mkdtempSync(path.join(ordner, 'z2-'))]);
  pruefe(/🆕 Folge 19 „Grammatikabfrage 1" — KEINE Karten/.test(r.text), 'Störtest: ohne FOLGE19_KARTEN in der Kartendatei wird Folge 19 gemeldet', r.text);
}

/* ================= D. Störtests an der echten Quelle =================
   ⛔ Alles oben lief beim ersten Bau auf Anhieb grün. Das beweist nur, dass
   die Werkzeuge zu den Erwartungen passen — nicht, dass die Erwartungen einen
   Fehler FÄNDEN. Deshalb wird hier je eine Schutzstelle im echten Quelltext
   ausgehebelt (Kopie neben dem Original, danach gelöscht), und die Prüfung,
   die sie bewacht, muss anschlagen. [[stoertest_muss_wirkung_nachweisen]] */
console.log('');
console.log('=== D. Störtests: ausgehebelte Schutzstellen müssen auffallen ===');
{
  const ordner = tmp('stoer');
  const kopie = (quelle, name, alt, neu) => {
    const text = fs.readFileSync(quelle, 'utf8');
    if (!text.includes(alt)) return null;
    const ziel = path.join(path.dirname(quelle), '.stoer-' + name + '.mjs');
    fs.writeFileSync(ziel, text.replace(alt, () => neu), 'utf8');
    return ziel;
  };
  const erzeugt = [];
  try {
    /* 1. regeln-holen druckt den ganzen Stand: der Köder MUSS erscheinen. */
    const KOEDER = 'KOEDER_LERNSTAND_4711';
    const f = schreib(ordner, 'stand.json', JSON.stringify({ geaendert: 1, daten: {
      vt_progress: JSON.stringify({ [KOEDER]: 1 }), vt_regeln: JSON.stringify({ notiz: { x: { text: 't', zeit: 1 } } }) } }));
    const s1 = kopie(HOLEN, 'regeln-holen', "const feld = ablage && ablage.daten ? ablage.daten[FELD] : undefined;",
      "console.log(JSON.stringify(ablage.daten)); const feld = ablage && ablage.daten ? ablage.daten[FELD] : undefined;");
    pruefe(s1, 'Störtest 1: die Stelle, an der nur vt_regeln herausgegriffen wird, ist auffindbar');
    if (s1){ erzeugt.push(s1); const r = lauf(s1, [f, '--zustand', ordner]); pruefe(r.text.includes(KOEDER), 'Störtest 1: druckt das Werkzeug den ganzen Stand, zeigt der Köder es an', r.text); }

    /* 2. regelsammlung-wache ohne die Schwelle abFolge: Folge 16 MUSS treffen. */
    const liste = JSON.parse(fs.readFileSync(path.join(REPO, 'werkzeuge', 'wiedervorlagen.json'), 'utf8'));
    const s2 = kopie(WACHE, 'wache-ohne-schwelle', 'if (n < Number(eintrag.abFolge)) continue;', '/* ausgehebelt */');
    pruefe(s2, 'Störtest 2: die Schwelle abFolge ist auffindbar');
    if (s2 && fs.existsSync(path.join(REPO, 'transcripts', 'whisper-voll', 'folge-16.txt'))){
      erzeugt.push(s2);
      const notizen = fs.mkdtempSync(path.join(ordner, 'n-'));
      const r = lauf(s2, ['--ohne-aufnahmen', '--wiedervorlagen', schreib(ordner, 'wv.json', JSON.stringify({ eintraege: liste.eintraege })), '--notizordner', notizen, '--zustand', fs.mkdtempSync(path.join(ordner, 'z-'))]);
      pruefe(/— Folge 16 trifft/.test(r.text), 'Störtest 2: ohne Schwelle trifft die echte Wiedervorlage Folge 16 — die Schwelle wirkt also', r.text);
    }

    /* 3. regelsammlung-wache erkennt keine Zusammenfassung mehr: Folge 27 darf NICHT kommen. */
    /* ⚠️ Erster Versuch war `/(?!)abfrage|…/` — das legt nur die ERSTE
       Alternative still, „wiederholung" traf weiter, und der Störtest schlug
       an. Der Fehler lag im Störtest, nicht im Werkzeug. Jetzt wird die
       Abfrage selbst ausgehebelt. [[mein_neues_werkzeug_ist_verdaechtig]] */
    const s3 = kopie(WACHE, 'wache-ohne-muster', 'if (!ZUSAMMENFASSUNG.test(titel)) continue;', 'continue;');
    pruefe(s3, 'Störtest 3: das Muster für Zusammenfassungen ist auffindbar');
    if (s3){
      erzeugt.push(s3);
      const titel = schreib(ordner, 'aufn.json', JSON.stringify([{ title: 'Folge 27 | Wiederholung Kapitel 13 bis 15' }]));
      const r = lauf(s3, ['--aufnahmen', titel, '--wiedervorlagen', schreib(ordner, 'leer.json', '{"eintraege":[]}'), '--notizordner', fs.mkdtempSync(path.join(ordner, 'm-')), '--zustand', fs.mkdtempSync(path.join(ordner, 'y-'))]);
      pruefe(!/Folge 27/.test(r.text), 'Störtest 3: ohne Muster verschwindet Folge 27 — die Prüfung in C hängt also am Muster', r.text);
    }
  } finally {
    for (const d of erzeugt) try { fs.unlinkSync(d); } catch { /* schon weg */ }
  }
  pruefe(!fs.readdirSync(path.join(REPO, 'werkzeuge')).some(n => n.startsWith('.stoer-')), 'keine Störkopie bleibt in werkzeuge/ liegen');
}

console.log('');
if (fehler){
  console.log('✗ ' + fehler + ' Prüfung(en) gescheitert — die Wartung pflegt die Regelsammlung damit nicht verlässlich.');
  process.exit(1);
}
console.log('✓ regeln-holen und regelsammlung-wache tun, was die Wartung von ihnen erwartet.');
