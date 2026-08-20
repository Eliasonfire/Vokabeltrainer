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

**Bei jedem Wartungslauf** (Mi 22:00, So 13:00) für den ganzen Bestand, den
Elias erreichen kann — nicht nur für das, was neu dazukam. Und zusätzlich,
sobald er es ausdrücklich sagt.

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
| A7 | **Wortart-Kategorie** (folgt aus A1) · Bedeutungsfeld ist ein Zusatz | `vorrat.mjs` (Wortart), `pruefe-wortfelder.js` (Bedeutungsfeld) | Wort fehlt in der Kategorieansicht und in der Statistik |
| A8 | **Funktionsanzeige** — ggf. Liste in `js/irab.js` | `pruefe-saetze.js` | Infokarte sagt nur „Wort" |
| A9 | **Beispielsatz** — nur mit Wörtern, die er hat | `vorrat.mjs`, `pruefe-saetze.js` | **10 bis 12** Übungsarten fallen aus — der teuerste Einzelpunkt |
| A10 | **Markierungen** am Satz | `vorrat.mjs`, `pruefe-markierungen.js`, `pruefe-erreichbarkeit.js` | Satz steht in keinem Thema, null Aufgaben |
| A11 | **Quran-Bezug** nur aus Sure 1, 67, 93–114 | `pruefe-quran.js` | (kein Ausfall — Zusatz) |
| A12 | **Vollständiges Taschkil** | `pruefe-taschkil.js` | falsche Aussprache, kaputte Suche |
| A13 | **Kein Duplikat** zu einer freigeschalteten Buchvokabel | ⛔ nur seine App | zwei Karten für dasselbe Wort |

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

Die Reihenfolge ist nicht beliebig: **Punkt 1 entscheidet über 7, 8 und 12;
Punkt 5 entscheidet über 6, 15 und 16.** Wer hinten anfängt, arbeitet doppelt.

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

## A3 · Bei Nomen: `gender`, `sg`, `pl`

| Feld | Wofür genau |
|---|---|
| `gender` | Die Genus-Übung (Nr. 11 مُذَكَّر/مُؤَنَّث) **und** die Hinweiswort-Übung (Nr. 12 هَذَا/هَذِهِ). Ohne `gender` fällt das Wort aus **beiden** heraus. Die Lernkarte zeigt es zusätzlich farbig an. |
| `sg` | Hörmodus, Wurzelbaum, und die Grundlage der Pluralkarten |
| `pl` | ⭐ Aus `pl` entsteht eine **eigene Karteikarte** mit eigenem Fortschritt. Fehlt der Plural, fehlt diese Karte — und niemand merkt es. |

⛔ Stoffnamen (Fleisch, Milch, Wasser) haben keinen Plural. Das ist kein
Mangel und darf nicht nachgetragen werden.

## A4 · Bei Adjektiven: `femSg` (und `femPl`)

Die weibliche Form. ⭐ **Daran hängt Übung Nr. 13** („صَغِيرٌ / صَغِيرَةٌ —
weibliche Form"): ohne `femSg` erzeugt das Wort dort **null Aufgaben**.

## A5 · Bei Verben: `past`, `present`, `imperative`, `masdar`

Die vier Stammformen. Sie stehen im Formen-Kasten der Wortkarte und in der
Sprachausgabe. ⚠️ Nicht jedes Verb hat einen Imperativ (unpersönliche Verben) —
das ist begründet und kein Mangel.

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

# TEIL B — Eine neue Regel

Kommt aus einer neuen Unterrichtsfolge oder aus seinem Heft. Der ausführliche
Weg steht in Schritt 1b des Wartungs-Prompts; hier das, was jede Regel braucht:

| # | Bestandteil | Prüfung |
|---|---|---|
| B1 | `id`, `name`, `shortExplanation` in `grammar-data.js` | `node validate.js` |
| B2 | `source` — Videostelle **oder** Buchbeleg, beide sehr kurz | `node validate.js` |
| B3 | `color` für die Markierung im Satz | `node validate.js` (Abschnitt Färbung) |
| B4 | **Mindestens ein Satz, der sie zeigt** — sonst ist sie unerreichbar | `node pruefe-erreichbarkeit.js` |
| B5 | Die Markierung an diesem Satz (`SENTENCE_TAGS`) | `node pruefe-markierungen.js` |
| B6 | Einsortierung in ein Satzmodus-Thema (`SATZ_THEMEN`, über `muster`) | `node validate.js` |
| B7 | Abgleich mit den bestehenden Regeln — Widerspruch? | `node werkzeuge/abgleich.mjs` |

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
| **Statistik** (`js/statistik.js`) | Kategorien | dito, das Wort fehlt in der Zählung |
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
| 12 | هَذَا / هَذِهِ | **`gender`** |
| 13 | صَغِيرٌ / صَغِيرَةٌ | **`femSg`** |

⭐ **Das ist die Interdependenz, die man leicht übersieht:** ein fehlendes
`gender` kostet nicht eine, sondern **zwei** Übungsarten. Ein fehlender Satz
kostet **acht**. Ein fehlendes `type` kostet die Kategorie, die Statistik, die
Funktionsanzeige und Übung 8.

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

Alle zehn auf einmal, wenn mehr als ein Wort dazukam:

```
node validate.js
node pruefe-saetze.js
node pruefe-markierungen.js
node pruefe-erreichbarkeit.js
node pruefe-eselsbruecken.js
node pruefe-wortfelder.js
node pruefe-taschkil.js
node pruefe-quran.js
node werkzeuge/vorrat.mjs
node werkzeuge/export-index.mjs --pruefen
```

⭐ **`vorrat.mjs` misst seit dem 20.08.2026 alle dreizehn Punkte**, nicht mehr
nur vier. Es ist damit das einzige Werkzeug, das „vollständig" für ein Wort
überhaupt beantworten kann — die anderen prüfen je einen Ausschnitt.

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

Was es **nicht** messen kann: A8 (Funktionsanzeige — steckt in `js/irab.js`),
A11 (Quran-Bezug — dafür `pruefe-quran.js`), A12 (Taschkīl — dafür
`pruefe-taschkil.js`), A13 (Duplikat — braucht seine App).

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
