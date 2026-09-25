# Pflichtprogramm für jede Satzübung — neu und bestehend

> Elias, 25.09.2026, wörtlich: *„wir sollten auch mal niederschreiben was so alles
> pflicht programm sein soll bei einem neuen satzmodus und vorallem dann auch die
> pflege und in stand haltung und das es immer aktuell bleibt und passende wörter
> hinzufügt und so. prüfer sollten das dann nachprüfen"* — und auf die Frage, ob
> ein Prüfer das bei **jeder** Übung prüfen soll, auch bei einer neuen, ohne dass
> jemand sie in eine Liste einträgt: *„ja richtig"*.
>
> Bewacht von `werkzeuge/pruefe-satzmodus-aktuell.mjs`, **Teil H** (dazu E, F, B)
> und `werkzeuge/pruefe-satz-teile.mjs`. Beide laufen in `alle-pruefer.mjs` und
> in der Wartung (Mi/So). Eine neue Übung wird **automatisch** mitgeprüft: die
> Prüfer lesen `UEBUNGEN` aus `js/uebung.js`, nicht eine Liste.

## Was jede Übung erfüllen muss

| # | Pflicht | Warum (seine Worte) | Wer prüft |
|---|---|---|---|
| 1 | **Nur belegte Sätze** aus seinen Büchern. Ein erfundener Satz nur als letzter Notfall, nur aus seinen Vokabeln, logisch und grammatisch, gekennzeichnet `selbstGebildet: true`. Keine selbst gesetzte Ḥaraka. | Notfallregel vom 25.09.2026 | Wartung 1b.8, `pruefe-saetze.js` |
| 2 | **Die Auswahl kommt live aus seinem Stand** — alle Formen, die er auf seinen Karten und Karteikarten hat; ein neues Kapitel bringt seine Formen von selbst mit. | *„also halt alle die bisher zur auswahl stehen"* | Teil A, B |
| 3 | **Reihum**: in den ersten k Aufgaben kommt jede der k Antworten (oder Fragen) einmal (`uebungMischen()`). | *„das sollte auch bei den anderen aufgaben so sein mit reihum"* | Teil E (Auswählen), F (Präpositionen), H (Antippen mit einer Frage je Aufgabe) |
| 4 | **Je Antwort gleich viele**, gedeckelt auf die seltenste, mindestens `UEB_JE_ANTWORT_MIN`. | *„wenn es ingesamt 30 sätze zu dieser übung gibt dann sollte jede antwort 10 sätze haben"* | Teil E |
| 5 | **Genug Aufgaben**: mindestens `UEB_JE_ANTWORT_MIN` Aufgaben in seiner Auswahl; weniger ist eine **Lücke** für die Wartung (neue Sätze aus seinen Büchern), kein Fehler. | *„das es immer aktuell bleibt und passende wörter hinzufügt"* | Teil H |
| 6 | **Genau ein Teil**: jede Übung steht in Teil 1 oder Teil 2 (`satzTeile()`); eine neue kommt von selbst in den kürzeren Teil. | *„ich möchte das beide teile ungefähr gleich zeitaufwändig sind"* | `pruefe-satz-teile.mjs`, Teil H |
| 7 | **Nummern linear 1 bis N**, in der Liste nach Gruppen ohne Sprünge. | *„ich möchte das die liste liniar von 1 bis 15 geht ohne das daraus salat gemacht wird"* | Teil H, `test-satzmodus-schwerer.mjs` |
| 8 | **Eigener Test mit Störtest** für das, was die Übung besonders macht (z. B. „mindestens zwei Adjektive"). | Nachtschicht-Regel: ein Prüfer muss rot werden können | der Test der Übung |
| 9 | **Pflegeplan-Vermerk** in `werkzeuge/pflegeplan.mjs` und, wenn Inhalt nachwachsen muss, ein Schritt in der Wartung. | *„weil sonst hat eine neue funktion keinen sinn wenn sie nicht gepflegt wird"* (11.09.2026) | `pruefe-pflegeplan.mjs` |
| 10 | **Zeitmessung** läuft von selbst mit (`merkeUebZeit()`); nichts zu tun. | gleich lange Teile | `lernlast.mjs` zeigt die Zeiten |

## Pflege und Instandhaltung (Wartung Mi/So)

1. `node werkzeuge/pruefe-satzmodus-aktuell.mjs` — Exit 1 ist ein Fehler (Pflicht 3, 4, 6, 7 verletzt), Exit 2 sind Lücken (Pflicht 5, Formen ohne Satz, neue Wörter in keinem Satz): **belegte Sätze aus seinen Büchern suchen**, nie erfinden (Pflicht 1).
2. `node werkzeuge/pruefe-satz-teile.mjs` — die zwei Teile gleich lang, fester Wechsel.
3. `node werkzeuge/lernlast.mjs` — Zeit je Satzübung; ab 10 Antworten je Übung gleicht die App die Teile nach der Messung aus.

## Wer eine neue Übung baut

Den Eintrag in `UEBUNGEN` (js/uebung.js) mit `id`, `nr` (nächste Zahl), `art` (`mehrfach` · `wahl` · `schreiben`) und `baue()` — dann laufen Pflicht 3 bis 7 und 10 **ohne weiteren Eintrag** mit. Selbst zu erledigen bleiben 1, 2, 8 und 9.
