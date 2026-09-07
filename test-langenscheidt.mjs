/* test-langenscheidt.mjs — bewacht `werkzeuge/langenscheidt.mjs`.
 *
 * ⛔⛔ ALLE VORLAGEN SIND ECHTE SEITEN, keine nachgebauten.
 * Am 07.09.2026 hatte ich für arabdict ein Muster gegen selbstgeschriebenes
 * HTML grün getestet — an der echten Seite traf es NULL Mal, und der Test war
 * trotzdem grün. Deshalb liegen die vier Seiten unter
 * `test-vorlagen/langenscheidt/`, so wie sie am 07.09.2026 abgerufen wurden.
 * [[testvorlage_selbst_nachgebaut]] [[pruefwerkzeug_mit_eingebauter_antwort]]
 *
 * ⭐ ZWEISEITIG GEEICHT. Ein Prüfer, der nur „findet", findet auch dort etwas,
 * wo nichts ist. Die Fälle 5 und 6 verlangen deshalb ausdrücklich SCHWEIGEN,
 * und Fall 6 zeigt zusätzlich, dass die Schranke ohne sie NICHT schwiege.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluraleAus, nackt, fuerDieAbfrage } from './werkzeuge/langenscheidt.mjs';

const WURZEL = path.dirname(fileURLToPath(import.meta.url));
const VORLAGEN = path.join(WURZEL, 'test-vorlagen', 'langenscheidt');
const seite = (w) => fs.readFileSync(path.join(VORLAGEN, w + '.html'), 'utf8');

let ok = 0, schlecht = 0;
const pruefe = (was, bedingung, wieGemessen) => {
  if (bedingung) { ok++; console.log('  ✔ ' + was); }
  else { schlecht++; console.log('  ✘ ' + was + '   gemessen: ' + wieGemessen); }
};

console.log('test-langenscheidt.mjs — Plurale aus echten Langenscheidt-Seiten\n');

/* ---------- 1. Der eindeutige Fall ---------- */
{
  const r = pluraleAus(seite('قلم'), 'قلم');
  pruefe('قلم liefert genau أقلام',
    r.plurale.length === 1 && r.plurale[0] === 'أقلام',
    JSON.stringify(r.plurale));
}

/* ---------- 2. Mehrere Plurale eines Wortes ---------- */
{
  const r = pluraleAus(seite('بيت'), 'بيت');
  pruefe('بيت liefert alle drei Plurale (بيوت · بيوتات · أبيات)',
    r.plurale.length === 3 && ['بيوت', 'بيوتات', 'أبيات'].every(p => r.plurale.includes(p)),
    JSON.stringify(r.plurale));
}

/* ---------- 3. ⛔ Der Homograph — der Grund für die strenge Regel ---------- */
{
  const r = pluraleAus(seite('رجل'), 'رجل');
  /* رجال gehört zu رَجُل („Mann"), أرجل zu رِجْل („Bein"). Nackt sind beide
     رجل, und Langenscheidt vokalisiert seine Lemmata nicht. Das Werkzeug DARF
     hier keinen einzelnen Plural als Beleg ausgeben. */
  pruefe('رجل liefert BEIDE Plurale, damit der Aufrufer sie verwerfen kann',
    r.plurale.length === 2 && r.plurale.includes('رجال') && r.plurale.includes('أرجل'),
    JSON.stringify(r.plurale));
}

/* ---------- 4. Schweigen ---------- */
{
  const r = pluraleAus(seite('سكر'), 'سكر');
  pruefe('سكر liefert nichts (die Quelle nennt keinen Plural)',
    r.plurale.length === 0, JSON.stringify(r.plurale));
}

/* ---------- 5. ⭐ STÖRTEST: die Lemma-Schranke greift ---------- */
{
  /* Dieselbe Seite, anderes Suchwort. Ohne die Lemma-Prüfung käme hier
     „أقلام" heraus — der Plural, der auf DIESER Seite gar nicht steht, bzw.
     bei بيت die drei Haus-Plurale. Das Werkzeug muss schweigen. */
  const r = pluraleAus(seite('بيت'), 'قلم');
  pruefe('STÖRTEST — die بيت-Seite, abgefragt mit قلم, liefert NICHTS',
    r.plurale.length === 0, JSON.stringify(r.plurale));
  /* Vier Blöcke der بيت-Seite tragen eine Plural-Marke — gemessen, nicht
     geraten: erst stand hier 3, und der Test zeigte 4. */
  pruefe('STÖRTEST — und sie sagt bei jedem der vier Blöcke, warum sie schweigt',
    r.verworfen.length === 4 && r.verworfen.every(v => v.grund.startsWith('anderes Wort')),
    JSON.stringify(r.verworfen.map(v => v.grund)));
}

/* ---------- 6. ⭐⭐ STÖRTEST: die Wortgruppen-Schranke greift ---------- */
{
  /* ⚠️ Dieser Fall ist ZUSAMMENGESETZT, und das ist Absicht — an 20 echten
     Seiten kam er NULL Mal vor. Eine Schranke ohne Störfall ist unbewiesen:
     sie könnte wirkungslos sein, ohne dass es auffiele. Bausteine sind echt:
     ein echter Block aus der قلم-Seite, und als Lemma eine Wortgruppe, wie sie
     auf der عين-Seite tatsächlich vorkommt („تعين عليه").
     [[stoertest_muss_wirkung_nachweisen]] */
  /* ⛔ Den Block mit DEMSELBEN Muster herausschneiden, das auch das Werkzeug
     benutzt — ein von Hand gesetzter Schnitt traf den ersten search-term, und
     der trägt bei قلم gar keine Plural-Marke. Der Test war dadurch still
     wirkungslos. [[stoertest_muss_wirkung_nachweisen]] */
  const echt = seite('قلم');
  const block = [...echt.matchAll(/<div class="(?:search-term|mobile parts)">[\s\S]{0,1200}?<\/div>/g)]
    .map(m => m[0]).find(b => /جمع \| Plural/.test(b));

  /* a) Unverändert muss der Block tragen — sonst misst der Störtest nichts. */
  pruefe('STÖRTEST-Eichung — es gibt überhaupt einen Block mit Plural-Marke', !!block, String(block));
  const vorher = pluraleAus(block || '', 'قلم');
  pruefe('STÖRTEST-Eichung — der unveränderte Block liefert أقلام',
    vorher.plurale.length === 1 && vorher.plurale[0] === 'أقلام',
    JSON.stringify(vorher.plurale));

  /* b) Nur das Lemma zur Wortgruppe gemacht: derselbe Plural, gleiche Struktur. */
  const gruppe = String(block || '').replace(/<h3>[^<]*<\/h3>/, '<h3>قلم الرصاص</h3>');
  pruefe('STÖRTEST — mit Wortgruppen-Lemma liefert derselbe Block NICHTS',
    pluraleAus(gruppe, 'قلم الرصاص').plurale.length === 0,
    JSON.stringify(pluraleAus(gruppe, 'قلم الرصاص')));
  pruefe('STÖRTEST — und nennt „Wortgruppe" als Grund',
    (pluraleAus(gruppe, 'قلم الرصاص').verworfen[0] || {}).grund?.startsWith('Wortgruppe'),
    JSON.stringify(pluraleAus(gruppe, 'قلم الرصاص').verworfen));
}

/* ---------- 7. Die Normalisierung ---------- */
{
  /* Elias' Wörter tragen Taschkīl, Langenscheidts Lemmata nicht. Ohne diese
     Angleichung fände das Werkzeug bei قَلَمٌ gar nichts. */
  pruefe('nackt() zieht Taschkīl ab: قَلَمٌ → قلم', nackt('قَلَمٌ') === 'قلم', nackt('قَلَمٌ'));
  pruefe('nackt() vereinheitlicht Hamza-Träger: أَقْلَام → اقلام', nackt('أَقْلَام') === 'اقلام', nackt('أَقْلَام'));
  const r = pluraleAus(seite('قلم'), 'قَلَمٌ');
  pruefe('vokalisiertes قَلَمٌ findet den Eintrag trotzdem',
    r.plurale.length === 1 && r.plurale[0] === 'أقلام', JSON.stringify(r.plurale));
}

/* ---------- 7b. ⛔ Die Adresse darf NICHT normalisiert werden ---------- */
{
  /* Am 07.09.2026 fragte der erste Lauf `اربعه` statt `أربعة` ab — `nackt()`
     hatte ة zu ه und أ zu ا gemacht. Die Seite kam leer zurück, und daraus
     wurde beinahe der Befund „Langenscheidt kennt أَرْبَعَةٌ nicht".
     Für den VERGLEICH ist die Vereinheitlichung richtig, für die ADRESSE
     falsch. Genau diese Trennung bewacht dieser Fall.
     [[gleiche_messreihe_falsche_ursache]] */
  pruefe('fuerDieAbfrage() lässt ة stehen: أَرْبَعَةٌ → أربعة',
    fuerDieAbfrage('أَرْبَعَةٌ') === 'أربعة', fuerDieAbfrage('أَرْبَعَةٌ'));
  pruefe('fuerDieAbfrage() lässt أ stehen',
    fuerDieAbfrage('أَرْبَعَةٌ').startsWith('أ'), fuerDieAbfrage('أَرْبَعَةٌ'));
  pruefe('nackt() macht daraus etwas ANDERES — der Unterschied ist der Punkt',
    nackt('أَرْبَعَةٌ') !== fuerDieAbfrage('أَرْبَعَةٌ'),
    nackt('أَرْبَعَةٌ') + ' vs ' + fuerDieAbfrage('أَرْبَعَةٌ'));
  pruefe('fuerDieAbfrage() zieht die Ḥarakāt trotzdem ab',
    !/[ً-ْ]/.test(fuerDieAbfrage('قَلَمٌ')), fuerDieAbfrage('قَلَمٌ'));
}

/* ---------- 8. Leere Eingabe ---------- */
{
  pruefe('leeres HTML liefert leer, ohne zu werfen', pluraleAus('', 'قلم').plurale.length === 0, '—');
  pruefe('HTML ohne Plural-Marke liefert leer',
    pluraleAus('<div class="search-term"><h3>قلم</h3></div>', 'قلم').plurale.length === 0, '—');
}

console.log('\n' + (schlecht ? '✘ ' + schlecht + ' von ' + (ok + schlecht) + ' Fällen falsch'
                              : '✅ alle ' + ok + ' Fälle richtig'));
process.exitCode = schlecht ? 1 : 0;
