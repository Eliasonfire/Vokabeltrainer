# Maintenance Log

## 2026-07-24 13:00 – Wöchentliche Wartung (So-Check)

**Check 1 - Neue Aufzeichnung/Grammatik:**
- `get_recordings` liefert 12 Folgen; bisher bekannt (grammar-data.js +
  transcripts/) war nur Folge 01, Folge 02 stand als fehlgeschlagener
  Versuch vor (leeres Transkript-Panel laut vorherigem Backfill-Lauf).
  Einziger erlaubter Abrufversuch dieses Laufs: Folge 02 - diesmal
  **erfolgreich** (deutsche Auto-Untertitel vollständig geladen).
- Transkript gespeichert unter `transcripts/folge-02.md` (Kapitel 2 & 3,
  Madina Buch 1).
- 3 neue Grammatikregeln konservativ extrahiert und in `grammar-data.js`
  ergänzt: مَنْ (Fragewort "wer"), ذَلِكَ (Demonstrativpronomen "jenes",
  Ferne-Pendant zu هَذَا), اَلْ (bestimmter Artikel + Tanwin-Regel).
  1 von 3 Regeln (اَلْ) konnte mit einem sentAr-Beispielsatz getaggt werden
  (Vokabel-ID 45787, "الْمَاءُ بَارِدٌ الْيَوْمَ."). Für مَنْ und ذَلِكَ
  existiert aktuell kein passender Beispielsatz in VOCAB_DATA - nicht
  getaggt, als Kandidaten in `folge-02.md` unter "Flagged/skipped" vermerkt.
  Weitere nicht übernommene Passagen (Hamzatul-Wasl-Erklärung zu unklar,
  kalligraphische Dammatain-Variante, Wortherkunfts-Exkurse) ebenfalls dort
  dokumentiert.
- Folgen 03-12 bleiben offen (laut vorherigem Log-Eintrag wurde auch Folge 12
  bereits erfolglos versucht) - Backlog wird weiter von der Backfill-Routine
  abgearbeitet, nicht Teil dieses wöchentlichen Laufs (Rate-Limiting: nur ein
  Abrufversuch pro Lauf).

**Check 2 - Abgleich mit Samsung Notes:**
- `list_export_status` liefert eine leere Liste - weder "Grammatik Heft
  Medina Buch 1" noch "Madina Buch 1 (Beschriftet)" sind exportiert.
- Abgleich mit eigenen Notizen übersprungen - Notiz noch nicht exportiert.

**Check 3 - Neue freigeschaltete Kapitel/Vokabeln:**
- `get_unlocked_chapters` liefert Kapitel 1-9 (Madina Buch 1). VOCAB_DATA
  enthält bereits Einträge für alle Kapitel 1-9. Keine neuen Kapitel,
  keine Aktion nötig.

**Abschluss:**
- `grammar-data.js` und `sw.js` geändert (CACHE_NAME v7 → v8).
- `transcripts/folge-02.md` liegt nur lokal (per .gitignore ausgeschlossen).
- Änderungen committet und zu origin/main gepusht.

## 2026-07-24 22:00 – Wöchentliche Wartung (Mi-Check)

- **Check 1 (neue Aufzeichnung):** Neueste Aufzeichnung laut `get_recordings` ist **Folge 12** (https://youtu.be/tQKdcsNcc0c, "MB1 Kapitel 8 (2)") - höher als der bisher bekannte Stand (Folge 01 in `grammar-data.js`, Folge 01/02 unter `transcripts/`). Einziger erlaubter Abrufversuch durchgeführt: "Transkript anzeigen" geklickt, 5s gewartet - Panel blieb leer (kein Text geladen). Kein weiterer Versuch in diesem Lauf; die 6h-Backfill-Routine übernimmt Folge 02 ff. automatisch weiter. Keine Änderungen an `grammar-data.js`.
- **Check 2 (neue Kapitel/Vokabeln):** `get_unlocked_chapters` liefert Kapitel 1-9 (Madina Buch 1) - alle bereits vollständig in `vocab-data.js` vertreten (chapter 1-9 geprüft). Keine neu freigeschalteten Kapitel, keine Änderungen.
- Keine Datei-Änderungen außer diesem Log-Eintrag; kein `CACHE_NAME`-Bump nötig.

## 2026-07-24 – Grammatik-Transkript-Backfill (Folge 02)

- Bearbeitete Folge: **Folge 02** (https://youtu.be/FBd6oYJ7q04, "MB1 Kapitel 2 & 3")
- Transkript-Panel auf YouTube ist trotz zwei Versuchen (Klick auf "Transkript anzeigen", je 5s Wartezeit) leer geblieben - vermutlich das bekannte Rate-Limiting-Problem beim automatisierten Laden.
- Es wurde `transcripts/folge-02.md` mit nur dem Kopf-Abschnitt und einem Hinweis auf den fehlgeschlagenen Versuch angelegt (nicht committet, da `transcripts/` ohnehin per `.gitignore` ausgeschlossen ist).
- Keine Änderungen an `grammar-data.js` in diesem Lauf.
- Abgleich mit Samsung-Notes-Notizen: übersprungen, da kein Transkript zum Abgleichen vorlag.
- Nächster Versuch für Folge 02 beim nächsten geplanten Lauf.
