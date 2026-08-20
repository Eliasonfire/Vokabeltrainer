Gib neuen Vokabeln und neuen Regeln im Vokabeltrainer alles, was zu ihnen gehört.

Elias sagt dafür **„das volle Programm"**. Diese Datei ist die verbindliche
Liste dessen, was das bedeutet — und sie existiert, weil er selbst darauf
bestanden hat (20.08.2026):

> „es muss halt recht klar sein was ‚das volle programm‘ ist weil ich glaube
> wenn man das nicht aufschreibt, dass du dann nicht das machst was ich möchte
> und **einfach irgendwas machst**."

Und auf die Rückfrage, ob das nur beim Freischalten gilt:

> „nicht nur wenn ich ein neues kapitel freischalte, sondern eigentlich **jeden
> mittwoch und sonntag** sollte das passieren … also **dauerhaft soll das
> aktuell bleiben**. jede woche lerne ich ja auch immer was neues sei es
> vokabeln oder regeln."

⛔ **Nichts hier ist optional, und nichts wird durch etwas Gleichwertiges
ersetzt.** Ein Punkt, der nicht geht, wird gemeldet — nicht weggelassen.

---

## Wann das gilt

**Bei jedem Wartungslauf** (Mi 22:00, So 13:00) für den ganzen Bestand **im
Fenster** — nicht nur für das, was neu dazukam. Und zusätzlich, sobald er es
ausdrücklich sagt.

⚠️ **Das Fenster ist kleiner als das Freigeschaltete, und der Unterschied ist
groß.** Am 20.08.2026: **203 gemessen von 427 freigeschalteten** Wörtern. Die
fehlenden 224 sind madina-2, für das Elias keinen Lernstand angegeben hat —
sie bleiben absichtlich draußen (siehe unten), aber das Werkzeug **beziffert**
es seitdem, statt nur den Buchnamen zu nennen.

Es gibt **vier Wege**, auf denen ein Wort in seine Reichweite kommt:

| Weg | Wo das Wort herkommt | Wo es liegt |
|---|---|---|
| 1 | Er schaltet ein **Kapitel** frei | `FREIGESCHALTET` in `js/kern.js` |
| 2 | Er schaltet ein **einzelnes Wort** frei | ⛔ `vt_einzeln_frei` — **nur in seinem localStorage** |
| 3 | Er legt eine **eigene Vokabel** an | `window.EIGENE_VOKABELN` (arabicroots) oder `vt_personalVocab` (App) |
| 4 | Ein **Fachbegriff** kommt dazu | `FACHBEGRIFF_VOKABELN` in `data/fachbegriffe.js` |

⭐ **`werkzeuge/vorrat.mjs` deckt seit dem 20.08.2026 die Wege 1, 3 und 4 ab**
(vorher nur Weg 1 — seine 11 eigenen Vokabeln und die 15 Fachbegriffe waren
unsichtbar, 163 → 189 geprüfte Wörter).

⛔ **Weg 2 bleibt strukturell unsichtbar.** `vt_einzeln_frei` liegt in seinem
localStorage, kein Werkzeug hier kommt daran. Dafür gibt es den Kopierknopf in
den Einstellungen („Einzeln freigeschaltete kopieren") — **danach fragen**, wenn
er von „neuen Wörtern" spricht und ich sie nicht finde. Eine leere Messung ist
kein Beweis, dass es keine gibt. [[daten_ohne_zugang]]

---

## ⛔ Ein leeres Feld ist nicht dasselbe wie eine Lücke

نَعَمْ hat keine Wurzel. اليَابَانُ hat keinen Plural. مَجْرُور hat kein
Geschlecht, das man abfragen könnte. Ein Werkzeug, das jedes leere Feld meldet,
produziert eine Liste, die zu vier Fünfteln aus Nicht-Fehlern besteht — und
wird ab dem vierten Mal ignoriert.

Deshalb steht in **`data/feld-ausnahmen.js`**, wo ein leeres Feld erklärt ist.
Zwei Ebenen, und die Reihenfolge ist Absicht:

1. **Regeln aus der Sache** — Partikel haben keine Wurzel, Fachbegriffe kein
   Geschlecht. Sie decken auch Wörter ab, die noch niemand gesehen hat.
2. **Einzelfälle, die Elias bestätigt hat.** ⛔ Diese Liste wächst **nur** durch
   seine Entscheidung. Was ich für wahrscheinlich halte, gehört ihm vorgelegt,
   nicht dort eingetragen. [[kennzeichen_mit_zwei_ursachen]]

---

## Die dreizehn Punkte auf einen Blick

⚠️ **Diese Tabelle wird maschinell ausgelesen** — von
`werkzeuge/pruefe-volles-programm.mjs`, das sie in den Wartungs-Prompt
schreibt. Spaltenzahl und Reihenfolge deshalb nicht ändern, Inhalt gern.

| # | Bestandteil | wer es misst | was ohne es ausfällt |
|---|---|---|---|
| A1 | **Wortart** `type` — nie `other`/`vocab` | `vorrat.mjs`, `pruefe-wortfelder.js` | Kategorieansicht, Funktionsanzeige, **6** Übungsarten |
| A2 | **Wurzel** `root` (nicht bei Partikeln, nicht bei Fachbegriffen) | `vorrat.mjs`, `validate.js` | Wurzelansicht, Wortfamilie |
| A3 | Bei Nomen: `gender`, `sg`, `pl` | `vorrat.mjs` | `gender`: **Übung 11** · `pl`: eigene Pluralkarte · `sg`: Anzeige und Sprachausgabe |
| A4 | Bei Adjektiven: `femSg` (und `femPl`) | `vorrat.mjs` | **Übung 13** erzeugt null Aufgaben — und **8** weitere zerlegen den Satz anders |
| A5 | Bei Verben: `past`, `present`, `imperative`, `masdar` | `vorrat.mjs` | ⭐ **das Iʿrāb-Lexikon** — sie steuern, wie JEDER Satz zerlegt wird |
| A6 | **Drei Eselsbrücken** nach seiner Rangfolge | `vorrat.mjs`, `pruefe-eselsbruecken.js` | er hat nur den Abzugstext |
| A7 | **Wortart-Kategorie** (folgt aus A1) · Bedeutungsfeld ist ein Zusatz | `vorrat.mjs` (Wortart), `pruefe-wortfelder.js` (Bedeutungsfeld) | Wort fehlt in der Kategorieansicht — **nicht** in der Statistik, die zählt über `bekannteVokabeln()` |
| A8 | **Funktionsanzeige** — ggf. Liste in `js/irab.js` | `pruefe-funktionen.js` | Infokarte sagt nur „Wort" |
| A9 | **Beispielsatz** — nur mit Wörtern, die er hat | `vorrat.mjs`, `pruefe-saetze.js` | **10 bis 12** Übungsarten fallen aus — der teuerste Einzelpunkt |
| A10 | **Markierungen** am Satz | `vorrat.mjs`, `pruefe-markierungen.js`, `pruefe-erreichbarkeit.js` | Satz steht in keinem Thema, null Aufgaben |
| A11 | **Quran-Bezug** nur aus Sure 1, 67, 93–114 | `pruefe-quran.js` | (kein Ausfall — Zusatz) |
| A12 | **Vollständiges Taschkil** | `pruefe-taschkil.js` | falsche Aussprache, kaputte Suche |
| A13 | **Kein Duplikat** zu einer freigeschalteten Buchvokabel | `pruefe-duplikate.js` | zwei Karten für dasselbe Wort |

⭐ **Die vierte Spalte ist der eigentliche Grund für diese Liste.** Nichts
davon meldet sich von selbst: `js/uebung.js` gibt bei einem Wort ohne `gender`
schlicht `null` zurück (Zeile 399), und die Aufgabe entsteht nie.

⛔ **Die Zahlen sind am 20.08.2026 gemessen worden — und drei davon standen
hier vorher falsch.** Ein Prüf-Agent hat den Bestand nachgebaut und je ein Feld
entfernt:

| Behauptung vorher | gemessen | wie |
|---|---|---|
| fehlender Satz kostet **acht** Übungsarten | **10 bis 12** | je Wort geprüft: بَيْتٌ 10, مَسْجِدٌ 12, قَلَمٌ 12 |
| `gender` kostet **zwei** Übungsarten | **eine** | `gender` steht in `js/uebung.js` nur in Übung 11 (Zeile 399–400). Übung 12 liest `p.istFem` **aus dem Satz**, nicht das Feld |
| `type` kostet auch die **Statistik** | **nein** | `js/statistik.js` enthält kein `WORTFELDER` und keinen Kategoriebezug — gezählt wird über `bekannteVokabeln()` und `PROGRESS` |

⭐ **Warum „acht" zu niedrig war:** `js/uebung.js:529` baut **jede** der 13
Übungsarten je Satz (`SENT.list.forEach(satz => … UEBUNGEN.forEach(m =>
m.baue(zeilen, satz)))`). Ohne Satz gibt es gar nichts — die 10 bis 12 sind
nur deshalb nicht 13, weil einzelne Übungen zusätzliche Bedingungen haben.

⭐⭐ **Und der wichtigste Fund: ein FALSCHES Feld ist schädlicher als ein
leeres.** `setzeLexikon()` in `js/irab.js:635` trägt `type`, `sg`, `pl`,
`femSg`, `femPl` und die Verbformen ins Iʿrāb-Lexikon ein — sie entscheiden,
wie **jeder** Satz zerlegt wird. Gemessen: ohne `femSg` erzeugt Übung 1 statt
660 plötzlich **706** Aufgaben. Es fehlen also nicht Aufgaben, es entstehen
**andere**. [[zahlen_ohne_beleg]]

---

# TEIL A — Eine neue Vokabel

Die Reihenfolge ist nicht beliebig, und zwar aus der Sache heraus:

| zuerst | entscheidet über | warum |
|---|---|---|
| **A1** Wortart | A3, A4, A5 | ohne sie steht nicht fest, **welche** Felder das Wort überhaupt braucht |
| **A1** Wortart | A7, A8 | Kategorie und Funktionsanzeige folgen ihr unmittelbar |
| **A9** Beispielsatz | A10, A12 | Markierungen und Taschkīl hängen am Satz — ohne ihn gibt es nichts zu markieren |

Wer hinten anfängt, arbeitet doppelt.

⛔ **Hier stand bis zum 20.08.2026 „Punkt 5 entscheidet über 6, 15 und 16".**
Teil A hat dreizehn Punkte — 15 und 16 gibt es nicht. Und A5 (die Verbformen)
entscheidet über gar nichts Weiteres; es ist A1, an dem alles hängt.

## A1 · Wortart (`type`)

`noun` · `verb` · `adjective` · `particle` · `adverb` · `expression`

⛔ **Nicht `other` oder `vocab` stehen lassen** — daraus wird auf der Karte
„Wort", und das ist keine Auskunft, sondern das Eingeständnis, dass keine da
ist. Eigene Vokabeln kommen mit `other` aus arabicroots.

⭐ **Das ist die Wurzel von allem anderen.** Daran hängen:
die Kategoriezuordnung (A7), die Funktionsanzeige (A8), die Wortart-Übung
(Nr. 8) und die Frage, ob A2–A4 überhaupt anwendbar sind.

`erschlosseneWortart()` in `js/irab.js` fängt die sicheren Fälle ab (Tanwīn,
Dual, gesunder Maskulinplural = Nomen). Alles andere setzt **er** über die
Wortart-Auswahl im Bearbeitungsformular, oder ich frage ihn.

```
node pruefe-wortfelder.js
```

## A2 · Bei JEDEM Wort: Wurzel (`root`), Form `ك ت ب`

Nur bei ableitbaren Wörtern. Partikeln, Fremdwörter und Eigennamen haben keine
— das ist kein Mangel, sondern richtig.

⭐ **Daran hängt der Wurzelbaum** (`screen-wurzeln`, `js/wurzel.js`): ein Wort
ohne `root` erscheint dort überhaupt nicht.

```
node validate.js          # Abschnitt „Wurzeln"
```

⛔ Keine Wurzel raten. Beleg aus dem Madina-Schlüssel oder aus einem Wort
derselben Wurzel, das schon im Bestand steht.

## ⛔⛔ Wohin diese Felder überhaupt geschrieben werden

**Das gilt für A3, A4 und A5 gemeinsam und stand bis zum 20.08.2026 nirgends** —
ein Prüf-Agent hat es gefunden, und es ist genau die Lücke, an der „einfach
irgendwas machen" anfängt. Alle naheliegenden Orte scheiden aus:

| Ort | warum nicht |
|---|---|
| `data/vokabeln-<buch>.js` | wird von `hole-vokabeln.mjs` bei **jedem** Abzug neu erzeugt — spurlos weg |
| Das Bearbeitungsformular der App | `AENDERBAR` in `js/kern.js` führt sieben Felder: `ar`, `de`, `sentAr`, `sentDe`, `pl`, `root`, `type`. `gender`, `sg`, `femSg`, `femPl` und die vier Verbformen sind **nicht** dabei, und das Formular hat auch keine Eingabezeile dafür |
| `vocab-data.js` | nur für die 171 Lernwörter — ein neuer Eintrag zöge das Wort über `LERNBESTAND_IDS` in „kennt er schon" und verschöbe seinen Lernstand |

⭐ **Der einzige haltbare Ort ist `FELD_ERGAENZUNGEN` in
`data/feld-ausnahmen.js`** — angewandt in `js/kern.js` vor `WORT_AENDERUNGEN`,
gefüllt von `werkzeuge/antworten-uebernehmen.mjs` aus dem, was Elias im
Wartungsfragen-Artefakt beantwortet hat.

⚠️ **Für eine in der App angelegte eigene Vokabel gilt das nicht.**
`addPersonalVocab()` nimmt sechs Felder entgegen und setzt `type: 'noun'` fest;
nachtragen ginge nur über `AENDERBAR`. **Ein selbst angelegtes Adjektiv kann
deshalb nie ein `femSg` bekommen** — weder durch ihn noch durch mich. Das ist
eine ehrliche Grenze von Weg 3 und gehört in den Bericht, nicht in ein „gleich
erledigt".

## ⭐⭐ Und der wichtigste Grund für diese drei Punkte

`setzeLexikon()` in `js/irab.js` trägt `type`, `sg`, `pl`, `femSg`, `femPl` und
die Verbformen ins **Iʿrāb-Lexikon** ein. Damit entscheiden sie, **wie jeder
Satz zerlegt wird** — nicht nur, ob eine Übung Aufgaben erzeugt.

Gemessen am 20.08.2026 (Bestand nachgebaut, je ein Feld entfernt, 350 Sätze):

| entferntes Feld | Übungsarten mit **veränderter** Aufgabenzahl |
|---|---|
| `femSg` | **8** — u. a. Übung 1: 660 → **706** |
| `type` | **6** — Übung 8: 1152 → 23, Übung 9: 710 → 7 |
| `pl` | **6** |
| `sg`, `gender` | je 1 |

⛔ **Die Zahlen, die STEIGEN, sind der eigentliche Befund.** Ohne `femSg`
erzeugt Übung 1 nicht weniger, sondern **mehr** Aufgaben — es fehlen keine, es
entstehen **andere**. Die Analyse liest den Satz anders.

**Daraus folgt: ein FALSCHES Feld ist schädlicher als ein leeres.** Ein leeres
kostet eine Funktion; ein falsches macht aus richtigen Sätzen falsche
Auskünfte, und keine Prüfung meldet das.

⚠️ `gender` hat **keine Wertprüfung**: erkannt werden nur `'masculine'` und
`'feminine'`. Jeder andere Wert gilt in Übung 11 stillschweigend als männlich.
Kein Werkzeug prüft das — beim Nachtragen also buchstabengenau.

## A3 · Bei Nomen: `gender`, `sg`, `pl`

| Feld | Wofür genau |
|---|---|
| `gender` | Die Genus-Übung (Nr. 11 مُذَكَّر/مُؤَنَّث). ⚠️ **Nicht** Übung 12: die liest `p.istFem` aus dem Satz, nicht dieses Feld — bis zum 20.08. stand hier „beide". Die Lernkarte zeigt es zusätzlich farbig an. |
| `sg` | Anzeige und Sprachausgabe (`sprechText()` nutzt `w.sg \|\| w.ar`), Wurzelbaum, Grundlage der Pluralkarten. ⚠️ **Der Hörmodus überspringt ein Wort ohne `sg` NICHT** — er filtert auf `de` mit mehr als einem Zeichen. |
| `pl` | ⭐ Aus `pl` entsteht eine **eigene Karteikarte** mit eigenem Fortschritt. Fehlt der Plural, fehlt diese Karte — und niemand merkt es. |

⛔ Stoffnamen (Fleisch, Milch, Wasser) haben keinen Plural. Das ist kein
Mangel und darf nicht nachgetragen werden — es gehört als „gibt es nicht" in
`FELD_AUSNAHMEN`, dann fragt kein Werkzeug wieder danach.

## A4 · Bei Adjektiven: `femSg` (und `femPl`)

Die weibliche Form. ⭐ **Übung Nr. 13** („صَغِيرٌ / صَغِيرَةٌ") erzeugt ohne
`femSg` **null** Aufgaben — und **acht weitere Übungsarten zerlegen den Satz
anders**, siehe oben.

## A5 · Bei Verben: `past`, `present`, `imperative`, `masdar`

Die vier Stammformen. ⭐ **Ihre wichtigste Wirkung ist das Iʿrāb-Lexikon**
(siehe oben) — daran hängt jede Satzzerlegung.

⚠️ Zwei Wirkungen, die früher hier standen und **nicht** stimmen: In der
**Sprachausgabe** kommen sie nicht vor (`js/sprachausgabe.js` kennt sie nicht,
gesprochen wird `w.sg || w.ar`). Und der **Formen-Kasten** auf der Lernkarte
erscheint nur, wenn `SETTINGS.showVerbFormen` an ist — aus ist der Standard,
auf Elias' ausdrücklichen Wunsch vom 30.07.2026.

⚠️ Nicht jedes Verb hat einen Imperativ (unpersönliche Verben) — das ist
begründet und kein Mangel. Es gehört als „gibt es nicht" in `FELD_AUSNAHMEN`.

## A6 · Drei Eselsbrücken

`data/eselsbruecken.js` (die erste) und `data/eselsbruecken-alt.js` (die
weiteren). **Die Rangfolge steht im Kopf von `eselsbruecken-alt.js` und stammt
von ihm:**

1. bekannter islamischer **Begriff** oder eine Wendung — das Stärkste
2. ein Vers aus seinem **auswendigen** Bereich: Sure 1, 67, 93–114
3. Muster oder Wurzel — aber **mit Anhang**, also mit drei eigenen Wörtern am
   selben Muster

```
node pruefe-eselsbruecken.js
node werkzeuge/vers.mjs <sure:vers>     # ⛔ JEDE Koranstelle belegen
```

⛔ Ein Vers außerhalb 1 / 67 / 93–114 ist als Merkhaken wertlos — er ist selbst
neuer Stoff. [[quranbezug_nur_auswendiges]]
⛔ Jedes „…wie X, das du schon hast" **nachschlagen, mit voller Schreibung**.
Ohne Ḥarakāt treffen مُدَرِّسَةٌ/مَدْرَسَةٌ und مَلِكٌ/مَلَكَ einander.
[[skelettvergleich_wirft_information_weg]]

## A7 · Wortfeld / Kategorie

⛔ **Das sind ZWEI Dinge, und nur eines läuft von selbst.**
`wortfelder-data.js` hat 27 Einträge, davon tragen nur **7** ein `typ`:

| | | |
|---|---|---|
| **Wortart-Kategorie** (7) | folgt aus `type` | läuft von selbst — deshalb ist A1 die Voraussetzung |
| **Bedeutungsfeld** (18) | greift über `passtInsFeld()` in `js/kern.js`, also über die Form oder das deutsche Stichwort | greift **nicht** automatisch |

Ein Wort mit unbekanntem `type` fällt **lautlos** aus jeder Kategorie und damit
aus der Statistik. Ein Wort ohne Bedeutungsfeld dagegen ist **kein Mangel am
Wort**: es heißt, dass keines der 18 Felder es abdeckt. Bei madina-1 sind das
58 % der Wörter, die eines haben — ein neues Feld anzulegen ist Elias'
Entscheidung, keine Pflicht des Laufs.

⚠️ `werkzeuge/vorrat.mjs` misst nur die **Wortart**-Kategorie und sagt das seit
dem 20.08.2026 auch so. Die Zeile hieß vorher „ohne Kategorie: 0" und klang
nach „alle einsortiert". [[widerspruch_liegt_in_der_beschriftung]]

```
node pruefe-wortfelder.js          # Bedeutungsfelder, je Quelle mit Anteil
node werkzeuge/vorrat.mjs          # Wortart-Kategorie im Fenster
```

## A8 · Funktionsanzeige auf der Infokarte

`funktionenVon()` in `js/irab.js`. Zeigt Wortart, Sonderrolle
(Genitivpräposition, Zeit-/Ortsangabe, Rufpartikel, Hinweiswort, Pronomen,
Fragewort) und **die Wirkung auf das nächste Wort**.

⭐ Elias, 20.08.2026: *„orts und zeitangaben haben die selbe wirkung wie
genitivpräpositionen. so soll das sein."* — Wortart und Wirkung sind **zwei
Zeilen**, nicht eine. [[sein_ist_nicht_wirken]]

Ist das neue Wort eine Partikel, ein Ẓarf oder ein Nomen, das mit einem Verb
zusammenfällt, gehört es in die passende Liste in `js/irab.js`
(`HURUF_JARR`, `ZURUF`, `NICHT_VERB`, `INDEKLINABEL`, `ADJEKTIVE`, …).

⛔ `istInListe()` trennt و/ف ab, **nicht** den Artikel; `ohneVokale()` lässt die
**Hamza stehen** — Einträge also mit Hamza schreiben.
⭐ Seit dem 20.08.2026 gilt: **ein Verb trägt nie Tanwīn**, und die voll
vokalisierte Lexikonform schlägt den Skelettvergleich. Viele Fälle, die früher
einen Listeneintrag brauchten, lösen sich dadurch von selbst.

## A9 · Beispielsatz

`data/beispielsaetze.js` (Buchvokabeln) oder `sentAr`/`sentDe` am Datensatz.
Die drei Regeln stehen im Kopf jener Datei:

1. **nur Wörter aus freigeschalteten Kapiteln oder seinem eigenen Bestand**
2. vollständig vokalisiert, mit korrekten Kasusendungen
3. nur Bauformen, die er kennt

⭐ Der Satz soll die **Regel** zeigen, die zum Wort passt — `زَوْجَةُ
التَّاجِرِ` ist deshalb eine Iḍāfa und kein beliebiger Satz.

⛔ Lieber **kein** Satz als ein gestellter. Bei abstrakten Wörtern (Befolgung,
Präzedenzfall) und bei Verben ohne passendes Objekt im Bestand bleibt das Feld
leer — mit einem Kommentar, **warum**.

```
node pruefe-saetze.js     # nach JEDEM neuen Satz
```

⛔ Meldet es „ist خَبَر, das verlangt raf" oder im Lexikon-Vergleich „Saetze
anders": **nicht den Satz wegwerfen, sondern nachsehen.** Beide Meldungen haben
schon mehrfach echte Mängel im Iʿrāb-Erklärer aufgedeckt — am 20.08.2026 gleich
sechs auf einmal. [[nomen_wird_zum_verb_gelesen]]

## A10 · Markierungen am Satz

`SENTENCE_TAGS` in `grammar-data.js`, gesetzt über
`werkzeuge/markierung-setzen.mjs`. Aufbau: `{ ruleId, matchText }`.

⛔⛔ **Ein Satz ohne Markierung erscheint nur unter „Alle".** Wer ein Thema
gewählt hat, sieht ihn nie — und er erzeugt **null Übungsaufgaben**. „Hat einen
Satz" ist nicht „ist erreichbar".

```
node pruefe-markierungen.js
node pruefe-erreichbarkeit.js
```

⚠️ `markierung-setzen.mjs` sucht über NFC, speichert aber die Zeichen **des
Satzes**. Wird der matchText normalisiert und der Satz nicht, findet die App die
Markierung nie — ohne Meldung. [[arabisch_vergleichen_nfc]]

## A11 · Quran-Bezug

Nur, wenn die Stelle in seinem auswendigen Bereich liegt (Sure 1, 67, 93–114).

```
node pruefe-quran.js
node werkzeuge/vers.mjs <sure:vers>
```

⛔ Auf der **Infokarte** wird er seit dem 20.08.2026 nicht mehr angezeigt (sein
Wunsch). Auf der Lernkarte und im Satzmodus hängt er an `SETTINGS.showQuran`,
und die Kategorie „Wörter mit Quran-Bezug" nutzt ihn weiter.

## A12 · Vollständiges Taschkil

Jedes arabische Zeichen in Datei und Karte voll vokalisiert.

```
node pruefe-taschkil.js
```

⛔ **Nicht selbst vokalisieren.** Beleg aus dem Madina-Schlüssel oder dem
Lehrbuch holen — sonst ihm vorlegen. [[taschkil_immer_vollstaendig]]

## A13 · Kein Duplikat

Gibt es das Wort schon als Buchvokabel, **und hat er die freigeschaltet**, ist
seine eigene Fassung doppelt und gehört weg.

⛔ **Beides prüfen, nicht nur das erste.** Hat er die Buchvokabel nicht, ist
seine eigene der einzige Zugang.
⛔ Vergleich **mit** Ḥarakāt: صِفْر (Null) und صَفَرَ (pfeifen) sehen ohne sie
gleich aus.

---

## Vier Felder, die in keiner Liste standen

⛔ **Auch diese vier gibt es wirklich, und drei davon wirken.** Am 20.08.2026
über alle **4444** Wörter gezählt — das sind **4433** Buchvokabeln plus seine
**11** eigenen. ⚠️ Die **15 Fachbegriffe** aus `data/fachbegriffe.js` sind darin
**nicht** enthalten; mit ihnen wären es 4459:

| Feld | wie oft | was es tut |
|---|---|---|
| `chapter` | **4444×** | ohne es taucht das Wort in **keiner Kapitelauswahl** auf — bei eigenen Vokabeln steht dort `'personal'` |
| `deNeben` | — | eine zweite deutsche Angabe: wird **angezeigt** und ist **suchbar** (`js/kategorien.js`, `js/lernen.js`) |
| `quran` | — | speist den Bildschirm „Wörter im Quran" und den Startzähler (`js/quran.js`, `js/start.js`) |
| `note` | **5×** | freie Anmerkung aus dem Abzug |

⚠️ **Ein Feld, das es NICHT gibt und trotzdem wirkt: `box`.** Am 20.08.2026
gemessen: **0 von 4433** Wörtern tragen es. Gelesen wird es trotzdem — als
**Vorgabewert** an drei Stellen, die einen neuen `PROGRESS`-Eintrag anlegen
(`js/buecher.js:378`, `:563`, `js/kern.js:960`): `box: w.box || 1`.

⛔ **Es gehört deshalb NICHT ins volle Programm** — der Leitner-Stand steht in
`PROGRESS`, nicht am Wort. Aber es ist ein Einfallstor: brächte ein künftiger
arabicroots-Abzug ein `box`-Feld mit, gäbe es beim ersten Anlegen still den
Lernstand vor. [[kennzeichen_mit_zwei_ursachen]]

⭐ **`root` hat einen dritten Verbraucher, der leicht übersehen wird:**
`QURAN_FREQ[w.root.replace(/\s+/g,'')]` (`js/kategorien.js:1279`,
`js/lernen.js:489`). Die Wurzel muss also nicht nur *da* sein, sondern zur
Schreibung im Häufigkeitsverzeichnis **passen** — sonst bleibt der Quranbezug
still leer, ohne dass irgendetwas meldet.

## ⛔ Zwei Werte, die die App still verwirft

`js/kern.js:703` führt die erlaubten Wortarten:

    const WORTARTEN = ['noun','verb','adjective','particle','adverb',
                       'expression','vocab','other'];

**`phrase` und `grammar` stehen nicht darin** — und `data/vokabeln-madina-3.js`
enthält **9** Wörter mit `type: "phrase"`. Wer die Wortart eines solchen Wortes
im Bearbeitungsformular ändert und wieder zurücksetzen will, kommt nicht
zurück: `speichereWortAenderung()` wirft den Wert weg und meldet trotzdem
Erfolg. [[erfolgsmeldung_ohne_wirkung]]

## ⛔ Weg 3 kann A3, A4 und A5 nicht erfüllen — strukturell

`addPersonalVocab()` (`js/kern.js:501`) nimmt **sechs** Felder — `ar`, `de`,
`sentAr`, `sentDe`, `root`, `pl` — und setzt `type: 'noun'` **fest**.

Daraus folgt, was keine Sorgfalt behebt:

- Eine selbst angelegte Vokabel ist immer ein Nomen. Ein eigenes **Adjektiv**
  kann nie ein `femSg` bekommen, ein eigenes **Verb** keine Verbformen —
  weder durch Elias noch durch mich.
- `gender`, `sg`, `femSg`, `femPl` und die vier Verbformen stehen **nicht**
  in `AENDERBAR`, sind also auch nachträglich nicht eintragbar.

⭐ **Der einzige Ort, an dem diese Felder landen können, ist `FELD_ERGAENZUNGEN`
in `data/feld-ausnahmen.js`** — `data/vokabeln-*.js` wird bei jedem Abzug neu
geschrieben, und ein dort eingetragener Wert wäre spurlos weg.

⚠️ **Und A9 hat bei Weg 3 eine ungenannte Ausnahme:** hat Elias keinen Satz
geschrieben, baut `addPersonalVocab()` selbst einen aus einer Schablone und
markiert ihn mit `satzAusSchablone: true`. Das steht gegen den Grundsatz „lieber
kein Satz als ein gestellter" — es ist eine **bewusste** Ausnahme für eigene
Vokabeln, keine Nachlässigkeit, und gehört hier genannt, damit sie nicht als
Fehler gemeldet wird.

---

# TEIL B — Eine neue Regel

Kommt aus einer neuen Unterrichtsfolge oder aus seinem Heft. Der ausführliche
Weg steht in Schritt 1b des Wartungs-Prompts; hier das, was jede Regel braucht:

| # | Bestandteil | Prüfung |
|---|---|---|
| B1 | `id`, `name`, `shortExplanation` in `grammar-data.js` | `node validate.js` |
| B2 | Die Herkunft — **zwei Gestalten, die sich ausschließen** (siehe unten) | `node validate.js` |
| B3 | `color` für die Markierung im Satz | `node validate.js` (Abschnitt Färbung) |
| B4 | **Mindestens ein Satz, der sie zeigt** — sonst ist sie unerreichbar | `node pruefe-erreichbarkeit.js` |
| B5 | Die Markierung an diesem Satz (`SENTENCE_TAGS`) | `node pruefe-markierungen.js` |
| B6 | Einsortierung in ein Satzmodus-Thema (`SATZ_THEMEN`, über `muster`) | `node validate.js` |
| B7 | Abgleich mit den bestehenden Regeln — Widerspruch? | `node werkzeuge/abgleich.mjs` |

## B2 · Die Herkunft — entweder Video **oder** Buch, nie beides

⛔ **Das ist kein Formalismus, sondern ein Entweder-oder, das `validate.js`
erzwingt.** Eine Regel aus dem Unterricht und eine aus dem Buch sehen im
Quelltext völlig verschieden aus:

| kommt aus | Felder | `validate.js` verlangt |
|---|---|---|
| **Unterrichtsfolge** | `source: { video, approxTimestamp, chapter }` | alle drei; `ergaenzung` steht **nicht** dabei |
| **Buch** (Madina-Schlüssel u. a.) | `ergaenzung: true` · `buchQuelle: { werk, lektion, seite }` · `kapitel: <Zahl>` | alle drei Teile von `buchQuelle`, `werk` aus `BUCHWERKE`, dazu `kapitel` als ganze Zahl |

⭐ **`kapitel` ersetzt bei Buchregeln das `source.chapter`.** Ohne es weiß die
Oberfläche nicht, wohin die Regel gehört — sie taucht in **keiner
Kapitelauswahl** auf. Am 20.08.2026 gemessen: **22** Regeln tragen `kapitel`,
**12** tragen `ergaenzung: true` und `buchQuelle`, und **keine einzige** davon
hat daneben ein `source`. Umgekehrt fällt `buchQuelle` ohne `ergaenzung: true`
durch die Prüfung — dann wäre die Herkunft in der App nicht gekennzeichnet.

## Vier weitere Felder, die es wirklich gibt

⛔ **Diese vier standen bis zum 20.08.2026 in keiner Liste**, obwohl drei davon
das Verhalten der App verändern. Ein Feld, das niemand kennt, wird beim
Eintragen einer neuen Regel schlicht vergessen.

| Feld | wie oft | was es tut | wer es liest |
|---|---|---|---|
| `source2` | **61×** | freiwilliger **Zweitbeleg** aus einem gedruckten Madina-Schlüssel: `{ schluessel, lektion, seite }`. Steht nur, wo Buch und Unterricht dasselbe sagen — wo sie abweichen, entscheidet Elias und es bleibt leer | `js/saetze.js`, `validate.js` |
| `nichtAufKarteikarten` | **27×** | die Regel erscheint im Satzmodus, aber **nicht** als Karteikarte | `js/saetze.js:314`, `pruefe-markierungen.js` |
| `kapitel` | **22×** | siehe B2 — Pflicht bei `ergaenzung: true` | `validate.js:267` |
| `ausgeblendet` | **1×** | die Regel wird **nirgends** angezeigt und zählt in keinem Thema mit | `js/saetze.js:76` und `:309` |

⚠️ **`source2` ist freiwillig, aber nicht halb erlaubt.** Steht das Feld da,
prüft `validate.js` alle drei Teile — *„eine halbe Fundstelle ist schlimmer als
keine, weil man ihr glaubt."*

## ⭐⭐ B6 wird schon bei B1 entschieden — von der `id`

Das ist der Punkt, an dem eine neue Regel still im Nichts landen kann.
`SATZ_THEMEN` ordnet **nicht** über ein eigenes Feld zu, sondern über einen
**regulären Ausdruck auf die `id`** (`js/saetze.js:76`):

    GRAMMAR_RULES.filter(r => t.muster.test(r.id) && !r.ausgeblendet)

Die dreizehn Themen und ihre Präfixe, am 20.08.2026 gemessen:

| Thema | `muster` | trifft |
|---|---|---|
| `isara` | `^(ismul-isara\|hadha\|isara\|tilka\|kaf-der-entfernung)` | 9 |
| `jarr` | `^(harf-jarr\|min-ila\|fi-ala\|mina-al\|li-\|lil-\|hurufu-jarr)` | 11 |
| `nominalsatz` | `^(mubtada\|nominalsatz\|jumla\|wortstellung\|satz-vs-wortgruppe)` | 6 |
| `kasus` | `^(irab\|kasus\|marfu\|majrur\|mansub\|tanwin\|alif-maqsura\|mamnu-min-as-sarf)` | 8 |
| `nat` | `^(nat\|adjektive\|mutabaqa\|ismun-mawsul)` | 8 |
| `al` | `^(al-\|schams\|qamar\|adjektive-an\|nakira-marifa)` | 6 |
| `idafa` | `^(idafa\|mudaf\|zarf-als-mudaf\|possessiv-ist-idafa)` | 10 |
| `fragen` | `^(istifham\|fragepartikel\|min-ayna\|min-man)` | 10 |
| `zarf` | `^(zarf-\|zuruf-makan\|inda-ort)` | 7 |
| `besitz` | `^(possessiv-ya\|possessiv-endungen\|asma-khamsa\|hu-nach-kasra)` | 5 |
| `schrift` | `^(madd\|schakl\|hamzatul\|lafz-al\|taschkil\|iltiqa\|mudarris-lesung)` | 7 |
| `wortarten` | `^(wortarten\|huwa-hiya\|verb-enthaelt)` | 3 |

⛔ **Eine `id`, die auf kein Präfix passt, landet in keinem Thema** — die Regel
ist dann nur unter „Alle" zu finden, und im Satzmodus taucht sie nirgends auf,
wo Elias sie suchen würde. Am 20.08. betrifft das **6** Regeln (`ya-nida-01`,
`fem-ohne-ta-marbuta-01`, `koerperteile-genus-01`,
`eigennamen-fem-ohne-tanwin-01`, `ta-marbuta-grenzen-01` und eine weitere).

⭐ **Praktisch heißt das: die `id` wird nicht frei gewählt.** Sie muss mit dem
Präfix des Themas beginnen, in das die Regel gehört — oder `SATZ_THEMEN` bekommt
ein neues Muster. Wer die `id` erst vergibt und die Einsortierung „später"
macht, hat sie schon verbaut.

## ⛔⛔ Wer einen Satz ändert, reißt seine Markierungen mit

`matchText` speichert den WORTLAUT, nicht eine Stelle. Ändert sich ein einziges
Zeichen im Satz — auch nur eine ergänzte Ḥaraka —, zeigt die Markierung ins
Leere.

Am 20.08.2026 belegt: Ich habe in fünf Sätzen eine fehlende Kasra ergänzt.
`validate.js` meldete daraufhin sofort

    FEHLER SENTENCE_TAGS["mb1-42-2"][0]: matchText "اسْمُ التَّاجِرِ" kommt im Satz nicht vor.

und nach dem Nachziehen in `grammar-data.js` **drei weitere**, weil dieselben
Wörter noch in Fachbegriff-Sätzen standen (`gram-suffix-ki`, `-hu`, `-ha`).

⭐ **Das ist ein Fall, in dem die Prüfung ihren Wert beweist:** ohne
`validate.js` wären die Markierungen still verschwunden — in der App fehlt dann
einfach die Farbe, und niemand merkt, woran es liegt.

**Praktisch:** Nach jeder Änderung an einem Satz `node validate.js` laufen
lassen, und zwar **bevor** man weiterarbeitet. Der Fehler ist trivial zu
beheben, solange man weiß, woher er kommt.

## ⛔ Zitierform ist nicht Satzkontext — Hamzat al-Waṣl

Derselbe Versuch hat einen zweiten, tieferen Befund erzeugt, und deshalb wurde
er **ganz zurückgenommen**:

`vocab-data.js` führt <span dir="rtl">اِسْمٌ</span> **mit Kasra** — das ist die
**Zitierform**, in der das Wort allein steht und die Hamzat al-Waṣl wirklich
gesprochen wird. Im Satz <span dir="rtl">مَا اسْمُكِ؟</span> steht dasselbe Wort
aber **nicht** am Sprechanfang: dort wird die Hamzat al-Waṣl übersprungen, und
die Kasra wäre falsch.

⛔ **Ein Beleg für die Zitierform ist kein Beleg für den Satzkontext.** Genau
das habe ich am 20.08. verwechselt — die Änderung war schon geschrieben und
`pruefe-taschkil.js` von 17 auf 12 Befunde gefallen, bevor es auffiel. Eine
Prüfung, die grüner wird, ist kein Beweis, dass man recht hatte.

**Die fünf Stellen bleiben deshalb als Befund stehen** und gehören Elias
vorgelegt, nicht selbst entschieden. Goal-Prompt **E.1** gilt für Ḥarakāt
genauso wie für Grammatik. [[quranbezug_nur_auswendiges]] · [[zitieren_am_original]]

## B5 · `SENTENCE_TAGS` hat vier Schlüsselarten, nicht eine

Der Schlüssel ist **nicht** immer eine Wort-id. Gezählt über alle 315 Einträge:

| Art | wie oft | wofür |
|---|---|---|
| reine Zahl (`45751`) | **259** | Satz an einer Buchvokabel |
| Satz-id (`mb1-13-1`) | **36** | Satz aus `data/beispielsaetze.js` |
| UUID (`0f311405-…`) | **9** | Satz an einer eigenen Vokabel |
| sonstige | **11** | Fachbegriffe und Quranverse |

⚠️ Wer beim Markieren nur an die Wort-id denkt, findet die 36 Sätze aus
`data/beispielsaetze.js` nicht — genau die Quelle, die am 19.08.2026 **drei
Werkzeugen unbekannt** war. [[dritte_satzquelle]]

⛔ **Bei Widerspruch beide Fassungen nennen, nie still eine wählen.**
[[vokabeltrainer_quellen]]
⛔ **Regeln aus dem Heft:** bei zwei Fassungen gilt die **spätere** Notiz.
[[heft_spaetere_notiz_gilt]]
⭐ Was sein Lehrer sagt, wiegt schwerer als jeder Abzug. Und bevor ich ihm
widerspreche: trennt der Einwand **Wortart** und **Wirkung**?
[[sein_ist_nicht_wirken]]

---

# TEIL C — Was die neue Vokabel sonst noch berührt

Diese Punkte erzeugt niemand von Hand, aber sie brechen still, wenn oben etwas
fehlt. **Nach dem Eintragen prüfen, ob sie greifen:**

| Was | Hängt an | Bricht, wenn |
|---|---|---|
| **Karteikarte** (`js/lernen.js`) | `ar`, `de`, `type`, `gender` | `gender` fehlt → kein Genus-Hinweis |
| **Pluralkarte** | `pl` | fehlt → die Karte entsteht gar nicht erst |
| **Hörmodus** (`js/hoeren.js`) | `ar`, `sg`, `type`, `book` | `sg` fehlt → Wort wird übersprungen |
| **Wurzelbaum** (`js/wurzel.js`) | `root` | fehlt → Wort taucht nicht auf |
| **Satzmodus** (`js/saetze.js`) | Satz **und** Markierung | Markierung fehlt → nur unter „Alle" sichtbar |
| **13 Übungsarten** (`js/uebung.js`) | siehe unten | |
| **Kategorien** (`js/kategorien.js`) | `type` über `WORTFELDER` | `type` unbekannt → keine Kategorie |
| **Statistik** (`js/statistik.js`) | `PROGRESS` und `bekannteVokabeln()` | ⚠️ **nicht** an Kategorien oder `type` — am 20.08. nachgemessen: 0 Treffer für `WORTFELDER`, `kategorie`, `.type` |
| **Suche** | `ar`, `de` | — geht immer |
| **Sprachausgabe** | `ar`, Verbformen | — |

**Die dreizehn Übungsarten und was sie brauchen:**

| Nr | Übung | Braucht |
|---|---|---|
| 1 | مُبْتَدَأ / خَبَر | Satz + Markierung |
| 2 | نَعْت | Satz + Markierung |
| 3 | مُضَاف / مُضَاف إِلَيْهِ | Satz + Markierung |
| 4 | حَرْف جَرّ + مَجْرُور | Satz + Markierung |
| 5 | Alle مَجْرُور | Satz + Markierung |
| 6 | Welcher Fall? | Satz, Iʿrāb-Analyse |
| 7 | Welche Endung? | Satz, Iʿrāb-Analyse |
| 8 | اِسْم / فِعْل / حَرْف | **`type`** |
| 9 | Bestimmt? | Satz |
| 10 | Welche Regel? | Satz + Markierung |
| 11 | مُذَكَّر / مُؤَنَّث | **`gender`** |
| 12 | هَذَا / هَذِهِ | Satz — ⚠️ **nicht** `gender`: `istFem` steht in der Musterliste (`js/uebung.js:423–426`), nicht am Wort |
| 13 | صَغِيرٌ / صَغِيرَةٌ | **`femSg`** |

⭐ **Das ist die Interdependenz, die man leicht übersieht** — mit den am
20.08.2026 nachgemessenen Zahlen:

| fehlt | kostet | gemessen woran |
|---|---|---|
| **Satz** | **10 bis 12** Übungsarten | `js/uebung.js:529` baut jede der 13 je Satz; بَيْتٌ 10, مَسْجِدٌ 12, قَلَمٌ 12 |
| **`type`** | Kategorie, Funktionsanzeige, Übung 8 — **6** Übungsarten insgesamt | ⚠️ **nicht** die Statistik |
| **`gender`** | **eine** Übungsart (11) | ⚠️ **nicht** zwei — Übung 12 liest die Musterliste |
| **`femSg`** | Übung 13, und **8** weitere zerlegen den Satz anders | `setzeLexikon()` trägt es ins Iʿrāb-Lexikon |

⛔ **Diese vier Zeilen standen hier bis zum 20.08.2026 falsch** — und zwar,
obwohl die Korrektur zweihundert Zeilen weiter oben schon eingetragen war. Eine
Datei kann sich selbst widersprechen, ohne dass ein Werkzeug es meldet: beide
Stellen sehen für sich genommen richtig aus. [[dieselbe_frage_zwei_antworten]]

---

# Zum Schluss — ohne diese vier Schritte ist nichts angekommen

```
node validate.js                              # muss grün sein
```

Dann `CACHE_NAME` in `sw.js` **hoch** (jede ausgelieferte Änderung), und:

```
node werkzeuge/veroeffentlichen.mjs --mit-daten
```

⛔ **`git push` veröffentlicht nichts.** [[deploy_meldet_erfolg_ohne_produktion]]

⭐ Und der **erste Satz** an Elias: **„App schließen und neu öffnen."** Ohne
ihn sieht er den alten Stand und hält die Arbeit für nicht gemacht.
[[alte_fassung_beim_nutzer]]

---

# Die vollständige Prüfkette

Alle zwölf auf einmal, wenn mehr als ein Wort dazukam:

```
node validate.js
node pruefe-saetze.js
node pruefe-markierungen.js
node pruefe-erreichbarkeit.js
node pruefe-eselsbruecken.js
node pruefe-wortfelder.js --fenster
node pruefe-taschkil.js
node pruefe-quran.js
node pruefe-funktionen.js
node pruefe-duplikate.js
node werkzeuge/vorrat.mjs
node werkzeuge/export-index.mjs --pruefen
```

⛔ **Zwei davon prüfen etwas anderes, als man beim Überfliegen annimmt:**

| | |
|---|---|
| `node validate.js` | **ist kein Tor.** Es endet mit **0 auch bei Warnungen** — und B6 (die Einsortierung ins Satzmodus-Thema) ist nur eine Warnung. Wer „grün" liest, hat nicht geprüft, ob am Ende „0 Hinweise" steht |
| `export-index.mjs --pruefen` | misst **keinen** der dreizehn Punkte. Es prüft den Samsung-Notes-Index — gehört in die Kette, gehört aber nicht zur Vollständigkeit einer Vokabel |

⭐ `pruefe-funktionen.js` ist am 20.08.2026 dazugekommen und misst **A8** — den
einzigen Punkt, für den es vorher gar kein Werkzeug gab. Die Liste nannte
`pruefe-saetze.js`, das `funktionenVon` mit **0** Treffern nie aufruft.

⭐ **`vorrat.mjs` misst seit dem 20.08.2026 neun der dreizehn Punkte**, vorher
waren es vier. Es ist damit das Werkzeug mit der breitesten Sicht auf ein
einzelnes Wort — die anderen prüfen je einen Ausschnitt.

⛔ **Hier stand bis zum 20.08. „alle dreizehn".** Die Tabelle direkt darunter
listet **neun**, und der Absatz danach nennt die vier, die es *nicht* messen
kann. Drei Angaben, zwei davon richtig — und die falsche stand oben, wo man
aufhört zu lesen. [[dieselbe_frage_zwei_antworten]]

| was es meldet | Punkt |
|---|---|
| fehlende Eselsbrücken | A6 |
| fehlender Beispielsatz | A9 |
| fehlende Markierung am Satz | A10 |
| Wort ohne Kategorie | A7 |
| `type` leer oder `other` | A1 |
| `root` fehlt (außer bei Partikeln und Fachbegriffen) | A2 |
| `gender`, `sg`, `pl` fehlen bei einem Nomen | A3 |
| `femSg` fehlt bei einem Adjektiv | A4 |
| `past`/`present` fehlen bei einem Verb | A5 |

Was es **nicht** messen kann — neun plus diese vier ergibt dreizehn:
A8 (Funktionsanzeige — dafür seit dem 20.08. `pruefe-funktionen.js`),
A11 (Quran-Bezug — dafür `pruefe-quran.js`), A12 (Taschkīl — dafür
`pruefe-taschkil.js`), A13 (Duplikat — dafür seit dem 20.08.
`pruefe-duplikate.js`).

⭐ **Damit hat jeder der dreizehn Punkte ein Werkzeug.** A13 war bis zum
20.08.2026 der letzte ohne — dort stand „⛔ nur seine App", ein Duplikat konnte
also nur auffallen, wenn Elias beim Lernen zweimal dieselbe Karte bekam.

⚠️ Der erste Bau von `pruefe-duplikate.js` meldete **14** Duplikate, davon war
**eines** echt. Zwei Fehler zugleich: er verglich **ohne Vokalzeichen**
(صِفْرٌ „Null" gegen صَفَرَ, ein Verb) und gegen **alle 4433** Buchvokabeln statt
gegen die **387 freigeschalteten**. ⚠️ 4433 sind hier die Buchvokabeln **ohne**
seine 11 eigenen — die Zahl 4444 weiter oben schließt sie ein. Das Werkzeug prüft sich deshalb beim Start
an vier Fällen, deren Antwort feststeht, und bricht ab, wenn einer davon kippt.

⚠️ **Und es misst ein FENSTER, nicht den ganzen Bestand.** ⛔ Hier stand bis
zum 20.08.2026 „gemessen werden die Wörter, die Elias erreichen kann" — das
war **falsch**. Erreichen kann er alles Freigeschaltete; gemessen wird nur,
was zusätzlich im Fenster liegt.

| | am 20.08.2026 |
|---|---|
| gemessen (Fenster) | **203** |
| freigeschaltet, also erreichbar | **427** |
| Buchvokabeln plus eigene | 4444 |

Dass madina-2 draußen bleibt, ist Absicht: ohne Lernstandsangabe meldete das
Werkzeug sonst 445 Wörter Rückstand, die niemand braucht — und ein Werkzeug,
das regelmäßig Unsinn meldet, wird nach dem dritten Mal ignoriert.

⭐ **Was seit dem 20.08. dazugekommen ist: der Nenner.** Die Meldung nannte
vorher nur den Buchnamen („madina-2: NICHT gemessen"), und damit las sich das
Übersprungene wie eine Randnotiz — obwohl es **größer war als das Gemessene**.
Jetzt steht in beiden Ausgabewegen, wie viel es ist:
*„224 weitere freigeschaltete Wörter = 52 % des freigeschalteten Bestands
(427) bleiben ungeprüft."* [[trefferquote_ohne_preis]]
[[milder_bezugspunkt_verdeckt_mangel]]

Dasselbe gilt für `pruefe-wortfelder.js`: **ohne `--fenster`** meldet es über
alle neun Bücher und ist damit für einen Lauf unbrauchbar.

⚠️ `pruefe-oberflaeche.js` läuft **nicht** unter node, nur im Browser über
`fetch(...).then(eval)`. Unter node wirft es `SETTINGS is not defined` — das ist
bekannt und kein Befund.

---

# Bericht an ihn — knapp, aber mit Zahlen

Je Punkt: wie viele Wörter bearbeitet, wie viele **bewusst** offen geblieben
sind und **warum**. Ein „alles erledigt" ohne Nenner ist keine Auskunft.
[[trefferquote_ohne_preis]] · [[liste_und_haken_von_mir]]

⚠️ Was ich **nicht** konnte, steht ausdrücklich da — besonders die einzeln
freigeschalteten Wörter, wenn ich seine Liste nicht hatte.

---

<!-- ⛔⛔ DIES IST DIE QUELLE. Zwei weitere Orte lesen sie:
       1. C:\Users\abdur\.claude\commands\volles-programm.md  (der Befehl /volles-programm)
       2. Automation\prompts\vokabeltrainer-wartung.md, Schritt 1c.4
     Beide sind KOPIEN bzw. Verweise. Wer hier ändert, muss danach
       node werkzeuge/pruefe-volles-programm.mjs
     laufen lassen — es meldet, wenn die Orte auseinanderlaufen, und stellt sie
     mit --angleichen wieder her.

     ⭐ Warum eine Quelle: Am 20.08.2026 wurde diese Liste um zwei Punkte
     erweitert (gender/femSg/Verbformen). Der Wartungs-Prompt blieb bei elf und
     hätte neuen Nomen kein `gender` gegeben — zwei Übungsarten wären für sie
     leer geblieben, ohne dass irgendetwas meldet. [[dieselbe_frage_zwei_antworten]] -->
